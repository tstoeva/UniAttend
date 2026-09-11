#!/usr/bin/env bash
set -euo pipefail
docker compose up -d db
[ -f backend/.env ] || cp backend/.env.example backend/.env
(cd backend && npm install && npx prisma generate && npx prisma migrate dev --name init && npm run prisma:seed)
(cd web && npm install)
echo "Done. Run backend and web in separate terminals."
echo "For iOS: brew install xcodegen && cd ios && xcodegen generate && open UniAttendAI.xcodeproj"
