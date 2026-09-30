#!/bin/sh
set -eu

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting ReligionAudio..."
exec npm start
