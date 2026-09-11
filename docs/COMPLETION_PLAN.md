# Completion plan

## Milestone 1 — Working local MVP
Definition of done:
- PostgreSQL starts in Docker
- Prisma migration succeeds
- demo seed succeeds
- web student and lecturer login work
- final attendance session can be opened/scanned/closed
- Anna receives 5/5 badge
- Boris receives Smart Catch-up

## Milestone 2 — Real AI
Definition of done:
- OpenAI key is configured only in backend `.env`
- lecturer uploads at least one PDF or text file
- generated summary matches that file
- output validates against strict JSON schema
- catch-up is stored in PostgreSQL

## Milestone 3 — Native iOS
Definition of done:
- Xcode project builds
- login works on simulator
- dashboard loads from backend
- QR credential renders
- catch-up quiz can be submitted

## Milestone 4 — Apple Wallet
Definition of done:
- Pass Type ID exists
- certificate/private key exported locally
- backend `/api/wallet/status` reports available
- `/api/wallet/pass` returns a valid `.pkpass`
- pass is added on a real iPhone
- pass QR scans in lecturer terminal

## Milestone 5 — Diploma-quality engineering
Add:
- Jest unit tests for badge and attendance rules
- integration tests against a test PostgreSQL DB
- API error logging
- audit log model
- file MIME allowlist
- upload size limits (already 20 MB)
- `.env` secrets review
- GitHub repository with clean commits
- architecture diagram
- ER diagram
- sequence diagrams
- screenshots of all major flows

## Milestone 6 — Evaluation
Measure:
- average check-in processing time
- duplicate scan behavior
- session closing time for 10/50/100 students
- AI generation latency
- AI output usefulness using a small lecturer/student questionnaire
- groundedness: manually verify claims against source materials

## Milestone 7 — Final defense package
Prepare:
- 8–12 slide presentation
- 7-minute live demo
- 2-minute backup screen recording
- screenshots in case internet/Apple/OpenAI is unavailable
- local demo mode with no external API dependency
