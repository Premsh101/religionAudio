# ReligionAudio

Story-first sacred knowledge platform: read, listen, explore, question.

Core modules: scripture reader, synchronized audio, stories for kids and adults, mythology and folklore, local legends and ghost stories, sacred places atlas, evidence-aware AI, and editorial/rights controls.

Content must clearly distinguish primary text, tradition, scholarship, science, fiction/folklore, and AI-generated explanations.

## Self-hosted deployment

The production target is a Hostinger KVM running Coolify. PostgreSQL is hosted locally on the KVM rather than using a managed database.

The repository Docker Compose stack provides:

- **web** — Next.js application on port 3000
- **db** — PostgreSQL 16 on a private Docker network with persistent storage
- **tts** — self-hosted narration service with persistent model/audio storage

The web container applies committed Prisma migrations automatically before starting Next.js. Seed content is run separately with `npm run db:seed` after the first deployment.

See [docs/COOLIFY_SELF_HOSTED.md](docs/COOLIFY_SELF_HOSTED.md) for Coolify configuration, persistence, backup and production security guidance.

## Authentication

The MVP keeps sign-in intentionally simple: one identifier field accepting either email or phone number plus a password. Sessions use an HttpOnly cookie-backed JWT. Email/phone verification and account recovery can be added later without changing the basic sign-in experience.
