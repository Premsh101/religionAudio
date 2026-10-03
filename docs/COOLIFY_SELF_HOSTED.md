# Coolify self-hosted deployment

ReligionAudio is designed to run on the KVM with PostgreSQL hosted locally on the same server. The default Docker Compose stack keeps PostgreSQL private to the Docker network.

## Recommended topology

- **web**: Next.js application, exposed on port 3000
- **db**: PostgreSQL 16, private, persistent volume `religion_postgres`
- **tts**: self-hosted TTS service, private, persistent audio/model volumes
- **Coolify**: reverse proxy, TLS, deployments and secrets

PostgreSQL should not be exposed publicly. The web container connects to it using the internal service hostname `db`.

## Coolify setup

1. Create a Docker Compose application from the repository.
2. Use the repository `docker-compose.yml`.
3. Add these secrets/environment variables in Coolify:
   - `POSTGRES_PASSWORD`
   - `AUTH_SECRET`
   - `AI_API_KEY` when an external AI provider is enabled
   - `AI_BASE_URL` when an external or self-hosted OpenAI-compatible gateway is used
4. Keep:
   - `POSTGRES_DB=religion_audio`
   - `POSTGRES_USER=religion_audio`
   - `DATABASE_URL=postgresql://religion_audio:<same-password>@db:5432/religion_audio`
5. Generate a strong password using URL-safe characters for the first deployment, or URL-encode special characters before placing them in `DATABASE_URL`.
6. Expose only the `web` service through the Coolify proxy/domain (set the domain on the `web` service, port 3000). Do not publish PostgreSQL or the TTS service as public endpoints. The compose file intentionally publishes no host ports.
7. Set the health check path to `/api/health` if Coolify asks for one.

## Automatic deployment on every change

Coolify's own **Auto Deploy** (GitHub App / webhook) redeploys the stack on every push to `main`. Keep it enabled in the application settings.

Workflow for changes: work on a branch → open a pull request into `main` (CI in `.github/workflows/ci.yml` runs typecheck, fresh-DB migrations, schema-drift check, seed, build, Docker image build and a `/api/health` smoke test) → merge once green → Coolify deploys. Committed migrations under `prisma/migrations` apply automatically when the new container starts.

Coolify does not wait for CI, so only merge to `main` once CI is green. If a Coolify build fails, the previous containers keep running.

The production image runs `prisma migrate deploy` before `next start`, so new committed migrations are applied automatically during deployment.

## Audio storage on Cloudflare R2

Narration is generated once and stored; every later listener streams the stored MP3. With R2, listeners download audio straight from Cloudflare's network instead of from the KVM, so playback starts without buffering and the server's bandwidth isn't used.

1. In Cloudflare → **R2 Object Storage** → **Create bucket**, e.g. `religionaudio-audio`.
2. Open the bucket → **Settings** → **Public access**: either connect a custom domain (recommended, e.g. `audio.yourdomain.com`) or enable the **r2.dev** public URL. Copy that public URL.
3. R2 overview → **Manage R2 API Tokens** → **Create API token** with **Object Read & Write** on that bucket. Copy the Access Key ID, Secret Access Key, and the S3 endpoint (`https://<account-id>.r2.cloudflarestorage.com`).
4. In Coolify → Environment Variables, set:
   - `AUDIO_STORAGE_PROVIDER=r2`
   - `R2_ENDPOINT` = the S3 endpoint
   - `R2_BUCKET` = the bucket name
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_PUBLIC_BASE_URL` = the public URL from step 2 (no trailing slash)
5. Redeploy.

How caching works:

- **Full narration** (story/book "Listen to full narration"): one audiobook per item, language and voice (female/male). The first listener's click queues it; playback starts as soon as part 1 is ready, and from then on it plays instantly for everyone.
- **Quick listen / previews** (`/api/tts`): stored under `tts-cache/` with a key derived from the text, language, style and voice, so each passage is generated only once.
- Files are uploaded with `Cache-Control: public, max-age=31536000, immutable`.

Audio stored locally before switching to R2 stays on the `religion_generated_audio` volume; regenerate it (or copy the files into the bucket under the same keys) after switching.

## First seed

After the first deployment, run the seed command once from the Coolify terminal for the web service:

```bash
npm run db:seed
```

The seed is intentionally not part of every application startup. This prevents a redeploy from unexpectedly modifying editorial data beyond the idempotent seed definitions.

## Create the first administrator

Set these in Coolify → Environment Variables and redeploy. On startup the app creates the account (or promotes it if it already exists):

- `ADMIN_EMAIL` (e.g. `admin@yourdomain.com`)
- `ADMIN_PASSWORD` (use a long, unique password; the admin can approve and publish content)

On later deploys the password is **not** overwritten, so changing it is safe. To force a reset, set `ADMIN_PASSWORD_RESET=true` for one deploy, then set it back to `false`.

From the Coolify terminal (web service) you can also run:

```bash
npm run db:create-admin -- someone@example.com 'their-password'   # create, or promote + reset password
npm run db:make-admin -- someone@example.com                      # promote an existing account
```

Admins and editors get **Studio** in the menu: `/admin/review` (approve stories and books; generate titles and covers) and `/admin` (story editor).

## Cover and title generation (Gemini on Vertex AI)

1. In Google Cloud, pick a project and enable the **Vertex AI API**.
2. IAM & Admin → Service Accounts → create one (e.g. `religionaudio-covers`) with the role **Vertex AI User**.
3. Open it → Keys → Add key → JSON. A `.json` file downloads.
4. In Coolify, set `GOOGLE_VERTEX_CREDENTIALS_JSON` to the **entire contents** of that file. If Coolify garbles multi-line values, paste the base64 of the file instead (`base64 -w0 key.json`); both are accepted.
5. Optional: `GOOGLE_CLOUD_LOCATION` (default `global`), `GEMINI_TEXT_MODEL` (default `gemini-2.5-flash`), `GEMINI_IMAGE_MODEL` (default `gemini-2.5-flash-image`; an `imagen-*` model also works). The project is read from the JSON unless `GOOGLE_CLOUD_PROJECT` is set.
6. Redeploy. The Review & covers page shows a warning while generation is not configured.

How it works: Gemini reads the story or book text, writes an art brief (genre style, region- and era-accurate setting, respectful religious iconography, no gore for ghost stories, no depiction where a tradition forbids it), then the image model paints a portrait cover with space at the top. The title is set in type over the art by the site, so it stays sharp in every script and updates instantly when the title changes. Covers are stored with the audio (R2 in production); regenerating creates a new file. Treat the JSON key like a password; never commit it.

## Data persistence

Keep these volumes persistent:

- `religion_postgres` — all application data
- `religion_tts_audio` — TTS cache/audio
- `religion_generated_audio` — generated application audio — generated narration cache/audio
- `religion_tts_models` — downloaded TTS model files

Do not delete these volumes during normal app redeployments.

## Backups

Because the database is hosted on the same KVM, backups must be stored outside the PostgreSQL volume and ideally outside the VPS as well.

Use a scheduled `pg_dump` from the PostgreSQL container/service and copy encrypted backups to separate storage. Keep at least daily and weekly restore points, and periodically test a full restore.

## Future migration to another PostgreSQL host

Application code only depends on `DATABASE_URL`. A future move to managed PostgreSQL, another VPS, or a dedicated Coolify database service does not require changes to the Prisma models or API routes; only the connection string changes.

## Production security checklist

- Use a unique long `AUTH_SECRET`.
- Use a strong PostgreSQL password.
- Keep PostgreSQL private; do not publish port 5432.
- Back up the database and test restores.
- Rate limiting is built in (login, signup, TTS generation, narration requests, Ask AI); limits are in `lib/server/rate-limit.ts`. Client IPs come from Coolify's proxy. If you put Cloudflare's orange-cloud proxy in front of the site, set `TRUST_CLOUDFLARE_IP=true` so limits apply per visitor rather than per Cloudflare server.
- Add email/phone verification when account recovery is introduced.
- Rotate secrets through Coolify rather than committing them to Git.
