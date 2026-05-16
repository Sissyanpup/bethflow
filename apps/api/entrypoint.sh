#!/bin/sh
set -e
echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy
echo "[entrypoint] Seeding required accounts..."
node dist/seed.prod.js
echo "[entrypoint] Starting API server..."
exec node dist/app.js
