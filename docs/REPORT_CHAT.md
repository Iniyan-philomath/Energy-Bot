# Connect Electra AI to the uploaded audit

## What is implemented

- **Audit report:** the Node API reads the fixed private Supabase object, extracts PDF text, translates follow-up questions into English search queries using Groq, retrieves relevant pages using BM25-style text ranking, and asks Groq for a grounded answer in the selected language.
- **Electrical Q&A:** general electrical explanations using Groq, without claiming report evidence.
- **Microgrid demo:** the existing local simulator, isolated from campus report facts.
- Source references identify physical PDF pages and, where recognized, the printed page label. Expand a citation to inspect its original-language quotation.
- A reported quotation must exist in the exact source text sent to the model. An unknown page, invented quotation, or claimed supported answer without citations produces an error instead of an unverified answer. This validates quotations, not every inference made by the language model; users should still check the original report for consequential decisions.
- English and all 22 Eighth Schedule languages are selectable, with automatic detection for text. Native browser speech uses the selected/detected locale; actual recognition and voices vary by browser. No universal spoken-language support is claimed.

## Important access boundary

This is a public chatbot for **one administrator-selected campus report**. Anyone who can call the API can ask questions and receive excerpts from that report. The bucket stays private, and there is no endpoint to list the bucket, read arbitrary object paths, return signed links, or download other documents. Do not point this public endpoint at a confidential report. Per-user report libraries would require authentication and authorization before retrieval; the existing UUID-folder storage policies are ready for that separate feature.

The pasted signed download link is not used or stored. The backend uses a server-only Supabase secret key, or a legacy service-role key, and a fixed bucket/object path. CORS is a browser restriction, not authentication. Request limits (12 questions/minute per IP, 60/minute shared per process), a three-request concurrency limit, bounded inputs and provider timeouts mitigate abuse; production-scale usage should add identity, shared rate-limit storage and provider spending limits.

## Connect your existing Render site

The existing static site is https://energybot.onrender.com. Keep it; you do not need a second static site.

### A. Create the API service

In Render choose **New → Web Service**, connect `Iniyan-philomath/Energy-Bot`, and set:

| Setting | Value |
| --- | --- |
| Branch | `deploy/volt-iq-render` |
| Name | `electra-ai-api` or an available variant |
| Runtime | Node |
| Root Directory | `server` |
| Build Command | `npm ci --no-audit --no-fund` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Choose the free instance if appropriate and offered. Review current Render limits before creation. Free instances can sleep, so the first report request may need a retry. The root `render.yaml` also describes both services for new Blueprint deployments; importing that Blueprint alongside an existing manually created site may create another static site.

Set these variables **on the API Web Service**:

| Variable | Value |
| --- | --- |
| `NODE_VERSION` | `24.19.0` |
| `SUPABASE_URL` | `https://akgdqmijbygpunwtgoss.supabase.co` |
| `SUPABASE_SECRET_KEY` | Secret key from this Supabase project's API Keys settings; enter privately in Render |
| `GROQ_API_KEY` | Key from https://console.groq.com/keys; enter privately in Render |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` (must be available to your Groq account) |
| `AUDIT_BUCKET` | `energy-audits` |
| `AUDIT_OBJECT_PATH` | `sce-energy-audit-2025-2026.pdf` |
| `ALLOWED_ORIGINS` | `https://energybot.onrender.com` |

For older Supabase projects you may set `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`. These privileged keys belong only in backend secrets. Never paste them into chat, GitHub, browser code, a `VITE_*` variable, or the static site's environment. The public Supabase URL itself is not a secret. A publishable/anon key cannot read this root-level private object under the current policies.

Save and deploy. Copy the **actual API HTTPS URL** assigned by Render; do not assume a particular hostname is available.

### B. Connect the static frontend

On the existing **Energy-Bot Static Site**:

1. Confirm branch `deploy/volt-iq-render`, root `energy-bot-app`, build `npm ci --no-audit --no-fund && npm run build`, and publish directory `dist`.
2. Set **`VITE_API_BASE_URL`** to the actual API URL from step A, with no path or trailing slash.
3. Save and redeploy the static site. Vite reads this at build time, so a rebuild is necessary.
4. Retain the rewrite `/*` → `/index.html`.

If the frontend gains a custom domain, add that exact origin to the API's `ALLOWED_ORIGINS` (comma-separated, no trailing slashes). Restart the API after changing its environment.

### C. Verify live operation

1. Open `<API URL>/health`: `status` should be `ok`, `configured` should be `true`. This checks process health and credential presence, not credential validity.
2. Open `<API URL>/api/report`: expect `ready: true`, `pageCount: 73`, and `modelConfigured: true`. This verifies the private Storage read and extraction; model authentication still needs a chat request.
3. In Audit report mode ask **What faults were found in the APFC panels?** Expand the cited source. PDF page 30 (printed 24) contains panel 1 step 1 and panel 2 steps 1 and 8 faults.
4. Ask about **BLDC fan savings and payback**. Relevant source pages are PDF 49–50. The report contains inconsistent fan counts; answers should acknowledge discrepancies rather than silently resolve them.
5. Select Tamil and ask **மின்மாற்றியின் திறன் என்ன?** Confirm a Tamil answer and the original English source quote (main transformer: PDF page 7).
6. Ask about a fact absent from the audit; expect an acknowledgement of insufficient evidence, not invented numbers.
7. Switch to Electrical Q&A for a general concept, then Microgrid demo to verify campus facts and simulated home data remain separate.

Do not mark the service ready based solely on Render's green deployment badge.

## Source, privacy and limitations

- The uploaded PDF remains only in Supabase. It is not committed to this repository.
- The server caches extracted text in memory for five minutes, then refreshes on the next report request. Replacing the configured object is picked up after cache expiry; restarting the service forces refresh.
- Extraction from the supplied local copy found 73 pages and about 77,000 characters. Eleven pages have little extractable text. The implementation does **not** perform OCR or interpret chart pixels; those pages may require manual review. Text tables can also be ambiguous.
- Retrieval is lexical after a model-generated English query, not a complete vector database or whole-document mathematical audit. The model receives at most six ranked pages and 24,000 characters of context. Global summaries and cross-table arithmetic may need narrower questions and source checking.
- Questions, recent conversation context and selected report excerpts are sent to Groq to generate answers. The app does not persist chats to Supabase; they remain in browser memory and disappear on reload.
- The API is read-only against Storage. It does not upload, delete, or alter the audit.

## Local development and validation

Node 24.19.0 is the tested runtime. From the repository root:

```bash
npm --prefix server ci --cache /tmp/npm-cache --no-audit --no-fund
npm --prefix server test
npm --prefix server run check:report -- /absolute/path/to/the/audit.pdf
```

The report check intentionally takes a path; the audit is not a repository fixture. It checks extraction and five known retrieval targets against this particular report. Unit/HTTP tests use controlled model responses and provider fixtures; they do not prove live model accuracy.

Inject server secrets through environment settings. For local frontend access set `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173` and start `npm --prefix server start`. The server does not automatically read `.env`; use your shell/environment manager, or Node's `--env-file` with an ignored local file if required. Start the frontend with `VITE_API_BASE_URL=http://localhost:3001 npm --prefix energy-bot-app run dev`. No secrets belong in that frontend command.

Without API configuration, the UI displays a service notice and retains the local Microgrid demo. It does not silently invent document answers.
