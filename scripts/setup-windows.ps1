$ErrorActionPreference = "Stop"
Write-Host "Starting PostgreSQL..."
docker compose up -d db
Copy-Item backend/.env.example backend/.env -ErrorAction SilentlyContinue
Push-Location backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
Pop-Location
Push-Location web
npm install
Pop-Location
Write-Host "Done. Open two terminals:"
Write-Host "1) cd backend; npm run start:dev"
Write-Host "2) cd web; npm run dev"
