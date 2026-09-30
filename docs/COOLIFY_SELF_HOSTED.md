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
6. Expose only the `web` service through the Coolify proxy/domain. Do not publish PostgreSQL or the TTS service as public endpoints.

The production image runs `prisma migrate deploy` before `next start`, so new committed migrations are applied automatically during deployment.

## First seed

After the first deployment, run the seed command once from the Coolify terminal for the web service:

```bash
npm run db:seed
```

The seed is intentionally not part of every application startup. This prevents a redeploy from unexpectedly modifying editorial data beyond the idempotent seed definitions.

## Data persistence

Keep these volumes persistent:

- `religion_postgres` — all application data
- `religion_audio` — generated narration cache/audio
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
- Add login/signup rate limiting before public launch.
- Add email/phone verification when account recovery is introduced.
- Rotate secrets through Coolify rather than committing them to Git.
