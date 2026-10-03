#!/bin/sh
set -eu

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Checking admin account..."
npx tsx scripts/create-admin.ts --from-env || echo "Admin setup failed (see the message above); continuing startup."

echo "Importing story collections..."
npx tsx scripts/import-corpus-stories.ts || echo "Story import failed; continuing startup."

echo "Starting ReligionAudio..."
exec npm start
