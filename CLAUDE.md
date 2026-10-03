# ReligionAudio — notes for Claude

## Delivery workflow
- Production is deployed by Coolify Auto Deploy on every push to `main` (Hostinger KVM). See `docs/COOLIFY_SELF_HOSTED.md`.
- After finishing and pushing work on a feature branch, **automatically open a pull request into `main` and merge it** — no need to ask first.
- Merge only once the CI workflow (`.github/workflows/ci.yml`) is green on the PR; if it fails, fix and push until green, then merge.
- Prefer squash merges.

## Before pushing
- `npm ci && npx prisma generate && npm run lint && npm run build`
- Schema changes need a committed migration in `prisma/migrations`; CI fails on drift between migrations and `schema.prisma`.
