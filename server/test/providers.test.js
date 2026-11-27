import test from "node:test";
import assert from "node:assert/strict";
import { createProviders } from "../src/providers.js";

test("Azure Speech selects an exact locale voice and escapes generated SSML", async () => {
  const calls = [];
  const providers = createProviders(
    { speechKey: "test-key", speechRegion: "eastus" },
    {
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        if (options.method !== "POST")
          return Response.json([{ Locale: "ta-IN", Name: "ta-IN-PallaviNeural" }]);
        return new Response(Buffer.from("speech-audio"), {
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    },
  );
  const audio = await providers.synthesizeSpeech("அ & <b>வணக்கம்</b>", "ta-IN");
  assert.equal(audio.toString(), "speech-audio");
  assert.equal(calls.length, 2);
  assert.equal(
    calls[1].options.headers["Ocp-Apim-Subscription-Key"],
    "test-key",
  );
  assert.match(calls[1].options.body, /ta-IN-PallaviNeural/);
  assert.match(calls[1].options.body, /அ &amp; &lt;b&gt;வணக்கம்&lt;\/b&gt;/);
  assert.ok(!calls[1].options.body.includes("test-key"));
});

test("Azure Speech refuses unsupported locales and invalid request sizes", async () => {
  let synthesisRequests = 0;
  const providers = createProviders(
    { speechKey: "test-key", speechRegion: "eastus" },
    {
      fetchImpl: async (_url, options) => {
        if (options.method === "POST") synthesisRequests++;
        return Response.json([]);
      },
    },
  );
  await assert.rejects(
    providers.synthesizeSpeech("Hello", "sat-IN"),
    { code: "SPEECH_LANGUAGE_UNSUPPORTED" },
  );
  assert.equal(synthesisRequests, 0);
  await assert.rejects(
    providers.synthesizeSpeech("x".repeat(6001), "en-IN"),
    { code: "INVALID_SPEECH_REQUEST" },
  );
});
