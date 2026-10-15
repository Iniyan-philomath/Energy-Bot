import { readConfig } from "./config.js";
import { createProviders } from "./providers.js";
import { createReportStore } from "./report.js";
import { createAssistant } from "./assistant.js";
import { createApp } from "./app.js";
const config = readConfig();
const providers = createProviders(config);
const reports = createReportStore(providers.download);
const answer = createAssistant({
  complete: providers.complete,
  reports,
  filename: config.objectPath.split("/").at(-1),
});
const app = createApp({ answer, reports, config });
const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`Electra AI API listening on port ${config.port}.`);
  console.log(
    `Supabase credential: ${config.supabaseKey ? "configured" : "missing"}; Groq credential: ${config.groqKey ? "configured" : "missing"}.`,
  );
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
