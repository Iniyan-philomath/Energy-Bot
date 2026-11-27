import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { languages } from "./languages.js";
import { MAX_PDF_BYTES } from "./report.js";
import { ServiceError } from "./errors.js";
export function createProviders(config, { fetchImpl = fetch } = {}) {
  const supabase = config.supabaseKey
    ? createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (url, init) =>
            fetch(url, { ...init, signal: AbortSignal.timeout(25000) }),
        },
      })
    : null;
  const groq = config.groqKey
    ? new Groq({ apiKey: config.groqKey, timeout: 30000, maxRetries: 0 })
    : null;
  let speechVoices;
  return {
    async download() {
      if (!supabase) throw new ServiceError("REPORT_NOT_CONFIGURED");
      try {
        const { data, error } = await supabase.storage
          .from(config.bucket)
          .download(config.objectPath);
        if (error || !data) throw new ServiceError("REPORT_UNAVAILABLE");
        if (data.size > MAX_PDF_BYTES)
          throw new ServiceError("REPORT_SIZE_INVALID");
        return Buffer.from(await data.arrayBuffer());
      } catch (error) {
        if (error instanceof ServiceError) throw error;
        throw new ServiceError("REPORT_UNAVAILABLE");
      }
    },
    async complete(messages, maxTokens) {
      if (!groq) throw new ServiceError("MODEL_NOT_CONFIGURED");
      const modelsToTry = [
        config.model,
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-20b",
      ].filter((m, i, arr) => m && arr.indexOf(m) === i);

      let lastError;
      for (const modelName of modelsToTry) {
        try {
          const response = await groq.chat.completions.create({
            model: modelName,
            messages,
            temperature: 0.1,
            max_tokens: maxTokens,
            response_format: { type: "json_object" },
          });
          const choice = response.choices[0];
          if (!choice?.message?.content)
            throw new ServiceError("MODEL_RESPONSE_INVALID", 502);
          return choice.message.content;
        } catch (error) {
          lastError = error;
          console.warn(`Groq model ${modelName} error:`, error?.status || error?.message);
          if (error instanceof ServiceError) throw error;
          if (error?.status === 429) continue;
          if (error?.code === "model_not_found" || error?.message?.includes("does not exist")) continue;
        }
      }
      if (lastError?.status === 429) throw new ServiceError("MODEL_BUSY", 429);
      console.error("All Groq model attempts failed:", lastError);
      throw new ServiceError("MODEL_UNAVAILABLE", 502);
    },
    async synthesizeSpeech(text, language) {
      if (!config.speechKey || !config.speechRegion)
        throw new ServiceError("SPEECH_NOT_CONFIGURED");
      if (
        typeof text !== "string" ||
        !text.trim() ||
        text.length > 6000 ||
        !Object.hasOwn(languages, language)
      )
        throw new ServiceError("INVALID_SPEECH_REQUEST", 400);

      const baseUrl = `https://${config.speechRegion}.tts.speech.microsoft.com`;
      try {
        if (!speechVoices) {
          speechVoices = (async () => {
            const response = await fetchImpl(
              `${baseUrl}/cognitiveservices/voices/list`,
              {
                headers: { "Ocp-Apim-Subscription-Key": config.speechKey },
                signal: AbortSignal.timeout(10000),
              },
            );
            if (!response.ok)
              throw new ServiceError("SPEECH_PROVIDER_UNAVAILABLE", 502);
            const voices = await response.json();
            if (!Array.isArray(voices))
              throw new ServiceError("SPEECH_PROVIDER_UNAVAILABLE", 502);
            return voices;
          })().catch((error) => {
            speechVoices = undefined;
            throw error;
          });
        }
        const voices = await speechVoices;
        const voice = voices.find(
          (item) => item.Locale?.toLowerCase() === language.toLowerCase(),
        );
        if (!voice?.Name)
          throw new ServiceError("SPEECH_LANGUAGE_UNSUPPORTED", 422);

        const escapeXml = (value) =>
          value.replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;",
          })[character]);
        const ssml = `<speak version="1.0" xml:lang="${language}" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${escapeXml(voice.Name)}">${escapeXml(text.trim())}</voice></speak>`;
        const response = await fetchImpl(
          `${baseUrl}/cognitiveservices/v1`,
          {
            method: "POST",
            headers: {
              "Ocp-Apim-Subscription-Key": config.speechKey,
              "Content-Type": "application/ssml+xml",
              "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            },
            body: ssml,
            signal: AbortSignal.timeout(20000),
          },
        );
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("audio/")
        )
          throw new ServiceError("SPEECH_PROVIDER_UNAVAILABLE", 502);
        const audio = Buffer.from(await response.arrayBuffer());
        if (!audio.length)
          throw new ServiceError("SPEECH_PROVIDER_UNAVAILABLE", 502);
        return audio;
      } catch (error) {
        if (error instanceof ServiceError) throw error;
        throw new ServiceError("SPEECH_PROVIDER_UNAVAILABLE", 502);
      }
    },
  };
}
