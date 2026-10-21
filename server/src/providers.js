import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { MAX_PDF_BYTES } from "./report.js";
import { ServiceError } from "./errors.js";
export function createProviders(config) {
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
  };
}
