# Deploy the Electra redesign

The production application is `energy-bot-app`, not `animated-website`.
The repository root now contains a Render Blueprint, `render.yaml`.
**A Blueprint file does not automatically change an existing manually configured
Render service.** Update the existing service instead of creating a duplicate
if you want to keep `energy-bot-5yke.onrender.com`.

Use these settings for the existing static site:

| Setting | Value |
| --- | --- |
| Repository | `Iniyan-philomath/Energy-Bot` |
| Branch | `deploy/volt-iq-render` |
| Root Directory | `energy-bot-app` |
| Build Command | `npm ci --include=dev && npm run build` |
| Publish Directory | `dist` |
| Node version | `24.19.0` (also pinned in `.node-version`) |
| Auto-Deploy | On commit |

After saving settings, choose **Manual Deploy → Clear build cache & deploy**.
Check that the deployed commit is the latest commit on GitHub `deploy/volt-iq-render`, and that
the event finishes successfully. A failed build leaves the last successful
version online.

The updated page title is **Electra — The Power Observatory** and its main heading
is **Every watt. Understood.** The neon “POWER. WITH A HIGHER IQ.” page is not this
application's current build.

Every production build emits `/deployment.json`, identifying the application,
source directory, and commit. Compare that commit with Render's successful
deploy event and GitHub `deploy/volt-iq-render`. If the endpoint returns an old page or does not
contain this JSON, it does not establish deployment of the new build.

Build and publish paths above are relative to the Root Directory. If the Root
Directory must remain empty, use build command
`cd energy-bot-app && npm ci --include=dev && npm run build` and publish directory
`energy-bot-app/dist` instead. Do not mix the two path conventions.

The existing service watches `deploy/volt-iq-render`; pushes only to `main` do not trigger it. The deployment branch also preserves the audit backend in `server/`, Supabase setup, and `VITE_API_BASE_URL` connection. Do not replace its Blueprint with a frontend-only service definition.
