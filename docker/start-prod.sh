#!/bin/sh
set -eu

echo "Applying database migrations..."
npx prisma migrate deploy

if [ -n "${ADMIN_EMAIL:-}" ]; then
  echo "Ensuring admin account..."
  npx tsx scripts/create-admin.ts --from-env || echo "Admin bootstrap failed; continuing startup."
fi

echo "Starting ReligionAudio..."
exec npm start
