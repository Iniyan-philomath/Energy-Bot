import { readConfig } from "./config.js";
import { createProviders } from "./providers.js";
import { createIndex, createReportStore } from "./report.js";
import { createAssistant } from "./assistant.js";
import { createApp } from "./app.js";
import reportPages from "./reportSnapshot.json" with { type: "json" };
const config = readConfig();
const providers = createProviders(config);
const reports = createReportStore(providers.download, {
  fallback: {
    pages: reportPages,
    index: createIndex(reportPages),
    pageCount: reportPages.length,
    imageHeavyPages: reportPages
      .filter((page) => page.text.trim().length < 150)
      .map((page) => page.page),
  },
});
const answer = createAssistant({
  complete: providers.complete,
  reports,
  filename: config.objectPath.split("/").at(-1),
});
const app = createApp({ answer, reports, config });
const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`Energy Bot API listening on port ${config.port}.`);
  console.log(
    `Supabase credential: ${config.supabaseKey ? "configured" : "missing"}; Groq credential: ${config.groqKey ? "configured" : "missing"}.`,
  );
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
