# Production readiness — 2026-10-03

Target: Hostinger KVM, Coolify, Docker Compose stack (`web`, `audio-worker`, `db`, `tts`).

## Verdict

**Ready for a private/soft launch on Coolify** after the fixes below. **Not yet ready for an open public launch** until the "before public launch" items are done.

## Fixed in this change (were deploy blockers)

| Problem | Impact | Fix |
| --- | --- | --- |
| TypeScript errors in `app/api/places/route.ts`, `app/content/page.tsx`, `prisma/seed.ts` | `npm run build` failed, so the Docker image could not be built | Typed the literals / fixed the reducer |
| `20261002000100_content_graph` re-created tables already in the (later edited) init migration | `prisma migrate deploy` failed on a fresh database, so the web container could never start | Made the migration idempotent (`IF NOT EXISTS`, guarded constraints). Databases that already applied it are unaffected |
| `AudioJob` model had no migration | Audio worker and `/api/audio/jobs` would crash with "table does not exist" | Added `20261003000300_audio_jobs` (drift check now reports zero difference) |
| Runtime image didn't include `scripts/`, `lib/`, `generated/`, `data/` | Audio worker crash-looped; `npm run db:seed` and `npm run db:make-admin` failed in Coolify | Copied them into the runner stage |
| No OpenSSL in `node:22-alpine` | Prisma picks the wrong schema engine and tries to download it at startup, so migrations fail | `apk add openssl` in the base stage |
| No `package-lock.json` | Unreproducible builds; any upstream release could break a deploy | Committed lockfile, Dockerfile uses `npm ci` |
| `web` waited for `tts` to be healthy | A TTS problem took the whole site down | `web` now only needs `tts` started; narration routes already return 503 when TTS is down |
| `web` published host port `3000:3000` | Can clash with other apps on the KVM and bypasses Coolify's proxy/TLS | Uses `expose` only; Coolify proxies the domain |
| `npm run db:check` imported a non-existent path | Command always failed | Fixed import |

Verified locally against PostgreSQL 16: migrations on an empty DB, zero schema drift, seed run twice (idempotent: 3 works, 4,517 passages, 4 stories, 8 places), production build, `start-prod.sh`, `/api/health` → `ok`, main pages and APIs return 200, signup, `db:make-admin`, audio worker startup. The TTS image wasn't built here because the sandbox network blocks PyPI; CI only syntax-checks `app.py`.

## Continuous deployment

Coolify Auto Deploy redeploys on every push to `main`. CI runs on pull requests and on `main` (typecheck, migrations, drift, seed, build, image build, container smoke test); merge only when it is green. See [COOLIFY_SELF_HOSTED.md](COOLIFY_SELF_HOSTED.md#automatic-deployment-on-every-change).

## Before public launch (not fixed here)

1. ~~Rate limiting~~ **Done.** PostgreSQL-backed limits (`lib/server/rate-limit.ts`, `RULES`):
   - Login: 20 attempts per IP per 15 min, and 5 wrong passwords per account per 15 min (cleared on success).
   - Signup: 5 per IP per hour.
   - New TTS generation: 30 per IP and 600 site-wide per hour. Cached audio is never limited.
   - New full narrations: 10 per IP per hour.
   - Ask AI: 20 per IP per hour.
2. ~~`POST /api/tts` unauthenticated~~ **Mitigated.** It is still public, but text is capped at 6,000 characters, results are cached, and new generation is rate-limited (above).
3. **Backups**: documented but not automated. Set up scheduled `pg_dump` off-box (Coolify has scheduled DB backups for its own DB resources; for the compose `db` service use a cron'd `pg_dump` to S3/R2) and test a restore.
4. **No automated tests**: CI only covers typecheck, build, migrations and a health smoke test.
5. **Per-request `PrismaClient`** in `app/api/audio/jobs/route.ts` and `app/api/audio/assets/[id]/route.ts` opens a new connection pool on every request. Switch to `getPrisma()` from `lib/server/prisma.ts`.
6. **Account recovery / verification**: none yet, as the README notes.
7. **TTS image size/RAM**: `kokoro` and `piper-tts` pull in PyTorch. Check that the KVM plan has enough RAM (aim for at least 8 GB for the full stack) and disk for models.
8. **Monitoring**: enable Coolify notifications for failed deployments and unhealthy containers, and add an external uptime check on `/api/health`.
