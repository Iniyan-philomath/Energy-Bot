# Host VOLT-IQ on Render and store audit PDFs in Supabase

The current app is a React/Vite frontend with simulated telemetry and a local advice engine. Hosting it does not add PDF chat, authentication, document uploads, or a Supabase connection. Supabase Storage is the first backend prerequisite; retrieval and model inference will need a later server or Edge Function implementation.

## 1. Deploy the frontend

1. Sign in at https://dashboard.render.com/ and connect your GitHub account.
2. Choose **New → Static Site**, then select `Iniyan-philomath/Energy-Bot`.
3. Select branch `deploy/volt-iq-render` (or `main` after merging this branch).
4. Enter these settings:

   | Setting | Value |
   | --- | --- |
   | Name | `volt-iq` or another available name |
   | Root Directory | `energy-bot-app` |
   | Build Command | `npm ci --no-audit --no-fund && npm run build` |
   | Publish Directory | `dist` |
   | Environment variable | `NODE_VERSION=24.19.0` |

5. Create the Static Site. Render supplies the actual HTTPS `onrender.com` address; the name may require a unique suffix.
6. In Redirects/Rewrites, add source `/*`, destination `/index.html`, action **Rewrite**.
7. Optionally add the response headers documented in `render.yaml` under the site's Headers settings.

Alternatively, use **New → Blueprint**, connect this repository and select the deployment branch. The root `render.yaml` contains the build, rewrite, and header configuration. Review the generated resources and any displayed pricing before creation. There is no Express server or start command for this static frontend.

Verify the deployed site: skip or play the intro; switch Today/Week/Month; toggle a device; apply optimization; send a copilot message; reload the page; and check mobile navigation. HTTPS enables browser microphone permissions, but voice availability still depends on the browser and user consent. Microphone and synthesized audio cannot be fully verified by headless browser testing.

## 2. Create a separate Supabase project

1. Sign in at https://supabase.com/dashboard and choose **New project**.
2. Select your organization, name the project `volt-iq`, and choose a region near your users (Mumbai if offered for your organization).
3. Generate a strong database password and save it in your password manager. Do not place it in source control or chat. Select a plan appropriate for your usage after checking the dashboard's current limits and pricing.
4. Wait for provisioning, then open **SQL Editor → New query**.
5. Paste and run `supabase/migrations/202610140001_energy_audit_storage.sql` from this repository.
6. Confirm the query reports `energy-audits`, `public=false`, `file_size_limit=20971520`, `application/pdf`, and four access policies.

The script creates a **private** bucket with a **20 MiB per-file limit**, allowing PDF uploads. It does not alter the existing SmartFarming project. MIME restrictions are not a substitute for parsing and validating uploads in the eventual ingestion service.

### Upload the supplied audit now

Open **Storage → energy-audits** and upload `ENERGY AUDIT REPORT_1..pdf` from your computer. The supplied report is approximately 3.6 MiB and fits the limit. You can rename it to `sce-energy-audit-2025-2026.pdf`.

For an administrator-only document library, a dashboard upload at the bucket root is appropriate: ordinary app users cannot access it under these policies. If a signed-in user should own the document, upload it under a folder named with that user's **Supabase Auth UUID**, e.g. `<user-uuid>/sce-energy-audit-2025-2026.pdf`. Do not use an email address as the folder name. The eventual client will create these paths automatically.

The policies allow an authenticated user to upload, read, update and delete files only within their UUID folder. Anonymous clients have no access. Downloads use authenticated requests or short-lived signed URLs, not public URLs. If you later need a shared campus library, add a deliberate membership/role model instead of making this bucket public. PostgreSQL permissive policies combine with OR, so review any additional policies before adding them to this new project.

## 3. Values needed for the later integration

Find the **Project URL** and **publishable key** in the project's Connect dialog or API settings. Older projects may show an `anon` key instead. A publishable/anon key is intended for browser use with access policies; it does not replace user authentication.

When a Supabase client is implemented, use:

- `VITE_SUPABASE_URL`: the project's HTTPS URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the browser publishable key (or legacy anon key).

These variables are not consumed by the current frontend, so setting them now does not connect the app. Never use a secret key, service-role key, database password, or LLM API key in a `VITE_*` variable: Vite embeds these variables in the publicly downloadable JavaScript. Server-only credentials belong in a backend or Supabase Edge Function's secret settings.

Before implementing login, set Supabase **Authentication → URL Configuration → Site URL** to the actual Render HTTPS address and add the exact redirect URLs used by the future auth flow. Rebuild the Render site whenever frontend build-time variables change.

## Current verification boundary

The local frontend production build and browser interactions have been tested. The Supabase SQL has been reviewed and parsed but has not been executed against your project. Live upload, cross-user denial, signed download, and deployed-site checks must follow account provisioning. Project creation, Render deployment and PDF storage are only complete once their dashboards and service responses confirm success.
