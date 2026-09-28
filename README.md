# UniAttend AI — complete diploma-project MVP

UniAttend AI is a university attendance platform with:

- Lecturer + student web portal (React/Vite)
- NestJS REST backend
- PostgreSQL + Prisma
- **RFID attendance check-in** (ESP32 + RC522 reader) — the active, working check-in method
- Smart Catch-up: AI summary + quiz from lecturer materials, generated automatically for absent students
- Student iOS app (SwiftUI) — present in the repo but currently **not wired up** (see §10)
- QR credential, Apple Wallet pass and attendance badges — **prototype / future-functionality only**, not currently issued automatically (see §11)

## 1. What is already implemented

### Student (web)
- Login
- Dashboard with enrolled courses and per-session attendance (real for course `SA101`, demo data for the other listed subjects)
- Smart Catch-up list + five-question quiz + server-side scoring
- "Card" tab — a visual-only student ID mockup (no live QR/Wallet data behind it)

### Lecturer (web)
- Login
- Course/session dashboard with attendance roster
- Open a session (sets it `OPEN` for 90 minutes)
- Close a session — this automatically:
  - creates `ABSENT` records for enrolled students without a check-in
  - generates a Smart Catch-up for each newly-absent student
- Link to the RFID terminal status screen

There is currently **no lecturer UI/endpoint to create a new session or upload materials** — sessions and materials come from the seed data (`backend/prisma/seed.ts`). Add a session directly via `prisma studio` or the seed script if you need more than the five seeded ones.

### AI (Smart Catch-up)
- Uses the OpenAI Responses API when `OPENAI_API_KEY` is configured
- Uploads lecturer files with purpose `user_data`, supplies them as `input_file`
- Uses strict JSON Schema output for summary/key concepts/quiz (exactly 5 questions)
- Deterministic demo fallback works with no API key, so the demo never depends on an external service

### Prototype / not currently active
- **QR credential & Apple Wallet pass** — the backend module for this was removed; the web "Card" tab and the `wallet/` folder are kept only as a visual mock-up / future-direction reference.
- **Attendance badges** — the `BadgeRule`/`StudentBadge` data model and the student-facing read endpoints still exist, but closing a session no longer evaluates or issues a badge automatically. Nothing will populate this in a fresh demo run.
- **iOS app** — still present under `ios/`, but its credential/Wallet screens call backend endpoints that no longer exist. Not part of the current demo (see §10).

## 2. Architecture

```text
ESP32 + RC522 reader --USB serial--> rfid_terminal.py (bridge, on a PC) --HTTP--> NestJS REST API ───> PostgreSQL
                                                                                        │
React web portal (student + lecturer) ------------------------HTTP--------------------┤
                                                                                        │
                                                                                  OpenAI Responses API
```

The backend is the source of truth. Attendance is recorded only from a verified RFID scan and is always decided server-side.

## 3. Requirements

### Development machine
- Node.js 22+
- npm 10+
- Docker Desktop
- Git

### For the RFID terminal
- An ESP32 dev board + MFRC522 (RC522) reader module, wired over SPI
- [PlatformIO](https://platformio.org/) (CLI or VS Code extension) to build/flash `esp32-rfid-terminal/`
- A PC connected to the ESP32 over USB, with Python 3 + `pyserial` + `requests` to run the bridge script
- At least one RFID card/tag registered to a student's `rfidUid` (Anna's demo card is seeded as `EA:97:24:06`)

### For the (currently unused) iOS app
- macOS, Xcode, iOS 17+ target, optional XcodeGen — see the caveat in §10 before investing time here.

## 4. Fast start on Windows

Open PowerShell in the project root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./scripts/setup-windows.ps1
```

Then open two terminals:

```powershell
cd backend
npm run start:dev
```

```powershell
cd web
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## 5. Manual backend setup

Start PostgreSQL:

```bash
docker compose up -d db
```

Create environment file:

```bash
cp backend/.env.example backend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Install and initialize:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

Backend URL:

```text
http://localhost:3000/api
```

## 6. Web setup

```bash
cd web
npm install
npm run dev
```

Demo users:

```text
Student Anna
anna@uni.demo
Student123!

Student Boris
boris@uni.demo
Student123!

Lecturer
lecturer@uni.demo
Lecturer123!
```

## 7. The exact demo flow

### A. Student preparation
1. Sign in as Anna.
2. Open the `Присъствия` (Attendance) tab.
3. Anna already has four `PRESENT` sessions in `Софтуерна архитектура` (course `SA101`).
4. The fifth session, `Microservices Basics`, is `PLANNED`.

### B. Lecturer opens the final session
1. Sign out.
2. Sign in as `lecturer@uni.demo`.
3. Find `Microservices Basics`.
4. Click `Отвори присъствия` (Open attendance).
5. Click `Отвори скенер` (Open scanner) — this just links to the RFID terminal status page; the actual scan happens on the ESP32 hardware.

### C. Attendance (RFID)
Run the active RFID bridge with the ESP32 reader connected over USB:

```powershell
pip install pyserial requests
python terminal/rfid_terminal.py --port COM8 --api http://localhost:3000/api --session SESSION_ID --token LECTURER_JWT
```

Present Anna's RFID card (`EA:97:24:06`) to the reader.

Expected console output:

```text
CHECKED IN: Anna Petrova (F12345) [EA972406]
```

### D. Close the session
Return to the lecturer dashboard and press `Затвори сесия` (Close session).

The backend:
1. Changes the session to `CLOSED`.
2. Keeps Anna as `PRESENT`.
3. Creates `ABSENT` for Boris (and anyone else who did not scan).
4. Generates a Smart Catch-up for each newly-absent student.

Badges are **not** issued automatically at this point — that logic was removed from the MVP scope (see §1).

### E. Show the result
Sign in as Boris to show his new Smart Catch-up for `Microservices Basics`, including the five-question quiz and server-side score.

## 8. Enable real OpenAI Smart Catch-up

Edit `backend/.env`:

```env
OPENAI_API_KEY="YOUR_API_KEY"
OPENAI_MODEL="gpt-5.6"
```

Restart backend.

Lecturer materials are saved locally (seeded under `backend/uploads/`). On catch-up generation, the backend uploads them to the OpenAI Files API and sends the resulting file IDs as `input_file` content to the Responses API.

The output is constrained to:

```json
{
  "title": "...",
  "summary": "...",
  "keyConcepts": ["..."],
  "quiz": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
```

Exactly five quiz questions are requested.

If no API key exists, a deterministic demo catch-up is generated so the diploma demo never depends on an external service.

## 9. RFID hardware terminal (ESP32 + RC522)

This is the active attendance check-in method — not optional polish.

### 9.1 Flash the ESP32
```bash
cd esp32-rfid-terminal
pio run --target upload
pio device monitor
```
(`pio` = PlatformIO CLI; the VS Code PlatformIO extension can do the same from the UI.) The firmware (`src/main.cpp`) initializes the RC522 over SPI and, whenever a card is presented, prints its UID over USB serial as `UID: XX:XX:XX:XX`. It has no WiFi/HTTP logic — it only talks over the USB cable.

### 9.2 Run the bridge script
On a PC connected to the ESP32 over USB:

```bash
cd terminal
pip install pyserial requests
python rfid_terminal.py --port COM8 --api http://localhost:3000/api --session SESSION_ID --token LECTURER_JWT
```

The script reads UID lines from the serial port, de-duplicates repeated scans within 3 seconds, and POSTs `{sessionId, rfidUid}` to `POST /attendance/rfid-check-in` using the lecturer's JWT.

### 9.3 Register a student's card
A student's `StudentProfile.rfidUid` must be set before their card will be recognized (`NotFoundException: RFID card is not registered` otherwise). Anna's demo card (`EA972406`) is pre-registered by the seed script and by migration `20260926120000_add_rfid_uid`. To register another card, update `StudentProfile.rfidUid` for that student (e.g. via `npx prisma studio`).

## 10. iOS app — known status

The SwiftUI project under `ios/` still exists but is currently **out of sync with the backend**: its credential (`GET /attendance/credential`) and Wallet screens call endpoints that were removed along with the Wallet module. Building and running it as-is will fail on those screens. It is not part of the current demo plan. If you want to revive it later, either point it at the RFID flow (there is currently no student-facing RFID enrollment API) or restore the QR credential endpoint in `attendance.controller.ts`/`attendance.service.ts`.

## 11. Apple Wallet & QR credential — removed from MVP scope

The Apple Wallet pass generator (`backend/src/wallet/`) and the JWT-based QR credential (`GET /attendance/credential`, `POST /attendance/check-in`) have been deleted from the backend. Only static leftovers remain on disk:
- `wallet/UniAttend.pass/`, `wallet/assets/`, `wallet/certs/` — the old pass template/assets, unused by any code now.
- The web "Card" tab shows a purely visual student-ID mock-up with a disabled "Apple Wallet · future functionality" button.

This is intentional, current project scope — not a bug. If you want it back, the pattern to follow is the same one used to restore the AI module: recover the deleted files from git history (`git log -- backend/src/wallet`), re-import `WalletModule` in `app.module.ts`, and re-wire `AttendanceModule`'s export the way `WalletService` originally consumed it.

## 12. Database entities

Core entities:

```text
User
StudentProfile   (now includes a unique, nullable rfidUid)
LecturerProfile
Course
Enrollment
ClassSession
AttendanceRecord (source defaults to "WALLET_QR"; RFID scans are recorded with source: "RFID")
Material
CatchupPackage
BadgeRule
StudentBadge
```

Important constraints:
- one enrollment per student/course
- one attendance record per student/session
- one catch-up package per absent student/session
- one issued badge per student/rule (enforced at the DB level; nothing currently writes new rows here)
- unique badge verification code
- unique `rfidUid` per student

## 13. Security rules implemented

- Password hashing with bcrypt
- JWT authentication for login sessions
- Role guards for STUDENT / LECTURER / ADMIN
- RFID check-in requires a valid lecturer JWT, an `OPEN` session, and an enrolled student — verified server-side, never trusted from the terminal script
- Check-in only while session status is `OPEN` (plus a 15-minute grace window after `endsAt`)
- Enrollment validation during check-in
- Server-side quiz scoring

### Recommended next hardening before production

For the diploma, discuss these as future work:
- login rate limiting
- audit log entity
- object storage instead of local uploads
- malware scanning for lecturer uploads
- GDPR retention policies
- university SSO / OAuth2 / SAML
- HTTPS everywhere
- restoring and hardening the Wallet/QR credential path if pursued further

## 14. Functional test checklist

### Authentication
- [ ] Correct student login works
- [ ] Wrong password returns 401
- [ ] Student cannot access lecturer endpoints
- [ ] Lecturer cannot access student-only endpoints

### Attendance
- [ ] Lecturer can open a session
- [ ] A registered RFID card checks in successfully
- [ ] An unregistered RFID UID is rejected (`RFID card is not registered`)
- [ ] Non-enrolled student is rejected
- [ ] Closed session rejects check-in
- [ ] Duplicate scan within a few seconds does not create duplicate attendance rows
- [ ] Closing marks missing students absent

### Smart Catch-up
- [ ] Absent student receives a catch-up automatically when the session is closed
- [ ] Present student does not receive a catch-up for that session
- [ ] Quiz has five questions
- [ ] Quiz is scored server-side
- [ ] Catch-up does not convert `ABSENT` to `PRESENT`

### Not currently exercised (feature removed/inactive)
- Badge issuance and verification
- Apple Wallet pass download
- iOS app end-to-end flow

## 15. Suggested Git history

Do not commit the entire diploma as one commit. A believable engineering history:

```text
01 init monorepo and postgres
02 add prisma domain model
03 implement jwt authentication
04 implement lecturer course sessions
05 implement student dashboard
06 implement attendance credential and check-in
07 add QR scanner terminal
08 add absence detection
09 add Smart Catch-up generation
10 add catch-up quiz scoring
11 add attendance badge rules
12 add Apple Wallet pass generator
13 add SwiftUI student app
14 replace QR/Wallet credential with ESP32 + RFID hardware terminal
15 add validation and error handling
16 add tests and documentation
```

## 16. Recommended project completion order

### Phase 1 — Local backend
- run DB
- migrate
- seed
- verify login endpoints

### Phase 2 — Attendance
- flash and run the ESP32 RFID terminal
- open the final session
- scan Anna's card
- close the session
- confirm Boris gets marked absent and receives a Smart Catch-up

### Phase 3 — AI
- add an API key
- verify a grounded catch-up is generated instead of the demo fallback

### Phase 4 — Testing
- execute the checklist above
- capture screenshots
- record expected/actual results in the thesis

### Phase 5 — Deployment
- PostgreSQL: managed DB
- backend: Render/Railway/Azure/AWS or university server
- web: Vercel/Netlify/static host
- use HTTPS

### Phase 6 — Diploma writing
Write the implementation chapter only after the MVP is stable so screenshots and diagrams match the actual code — including the fact that QR/Wallet/badges are documented as a deliberate, discussed scope reduction rather than missing work.

### Phase 7 — Defense rehearsal
Practice the flow from `docs/DEFENSE_DEMO.md`, updated to the RFID-based demo in §7 above.

## 17. What not to overbuild

For a bachelor diploma, do not spend most of the time on:
- a full university ERP/SIS
- real grade management
- payment functions
- complicated social features
- reviving the iOS app or Apple Wallet unless there's time left over
- custom machine-learning model training

The current strongest scope is:

```text
RFID hardware attendance + absence detection + grounded AI catch-up
```

That is one coherent software-engineering problem and is large enough for a bachelor diploma.
