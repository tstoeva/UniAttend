# UniAttend AI — complete diploma-project MVP

UniAttend AI is a university attendance platform with:

- Student iOS app (SwiftUI)
- Lecturer web portal (React/Vite)
- NestJS REST backend
- PostgreSQL + Prisma
- Wallet pass integration (`.pkpass`) with QR fallback
- Attendance check-in terminal (browser camera; optional Python/OpenCV terminal)
- Smart Catch-up: AI summary + quiz from lecturer materials
- Perfect Attendance badge with server-side verification code

## 1. What is already implemented

### Student
- Login
- Dashboard with courses and attendance
- Student credential QR
- Optional Apple Wallet pass download
- Smart Catch-up list
- Five-question catch-up quiz
- Score submission
- Attendance badges

### Lecturer
- Login
- Course/session dashboard
- Open attendance session
- Browser-camera QR scanner
- Manual scanner fallback
- Upload lecturer material
- Close session
- Automatic `ABSENT` creation for students who did not check in
- Automatic Smart Catch-up generation for absent students
- Automatic badge evaluation after required sessions

### AI
- Uses OpenAI Responses API when `OPENAI_API_KEY` is configured
- Uploads lecturer files with purpose `user_data`
- Supplies those files as `input_file`
- Uses strict JSON Schema output for summary/key concepts/quiz
- Demo fallback works without an API key

### Apple Wallet
- Server-side `.pkpass` generation
- Signed QR student credential embedded in pass
- PassKit add-to-Wallet flow in the iOS app
- Safe fallback to in-app QR when Apple certificates are not configured

## 2. Architecture

```text
SwiftUI iOS App ─────────────┐
                             │
React Lecturer Portal ───────┼──> NestJS REST API ───> PostgreSQL
                             │          │
Browser/Pi QR Terminal ──────┘          ├──> OpenAI Responses API
                                        └──> Apple Wallet pass generator
```

The backend is the source of truth. The Wallet card and QR are only credentials; attendance, badges and exam benefits are always verified server-side.

## 3. Requirements

### Development machine
- Node.js 22+
- npm 10+
- Docker Desktop
- Git

### For native iOS
- macOS
- Xcode
- iOS 17+ target
- optional: XcodeGen (`brew install xcodegen`)

### For real Apple Wallet `.pkpass`
- Apple Developer Program account
- Pass Type ID
- Pass Type certificate
- Apple WWDR certificate

Without these Apple credentials the application still works with the in-app QR credential.

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
2. Open `Student credential`.
3. Anna initially has four `PRESENT` records in `Software Architecture`.
4. The fifth session, `Microservices Basics`, is planned.

### B. Lecturer opens the final session
1. Sign out.
2. Sign in as `lecturer@uni.demo`.
3. Find `Microservices Basics`.
4. Click `Open attendance`.
5. Click `Open scanner`.

### C. Attendance
Use a second browser/device for Anna's QR.

Scan Anna's credential in the lecturer terminal.

Expected result:

```text
Anna Petrova (F12345) checked in
```

### D. Close the session
Return to lecturer dashboard and press `Close session`.

The backend:
1. Changes the session to `CLOSED`.
2. Keeps Anna as `PRESENT`.
3. Creates `ABSENT` for Boris if he did not check in.
4. Generates a Smart Catch-up for Boris.
5. Counts Anna's attendance.
6. Because Anna is now 5/5, issues `Perfect Attendance`.

### E. Show the result
Sign in as Anna again.

You should see:

```text
Software Architecture
5 / 5

Perfect Attendance ✓
Benefit: One optional exam question may be skipped.
```

Sign in as Boris to show the new Smart Catch-up for `Microservices Basics`.

## 8. Enable real OpenAI Smart Catch-up

Edit `backend/.env`:

```env
OPENAI_API_KEY="YOUR_API_KEY"
OPENAI_MODEL="gpt-5.6"
```

Restart backend.

Lecturer materials are saved locally. On catch-up generation, the backend uploads them to the OpenAI Files API and sends the resulting file IDs as `input_file` content to the Responses API.

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

## 9. iOS setup

### Option A — XcodeGen

On a Mac:

```bash
brew install xcodegen
cd ios
xcodegen generate
open UniAttendAI.xcodeproj
```

Run on an iOS Simulator.

For the simulator, the default API URL is:

```text
http://localhost:3000/api
```

For a physical iPhone, edit:

```text
ios/UniAttendAI/Services/APIClient.swift
```

Replace:

```swift
http://localhost:3000/api
```

with the LAN address of the computer running the backend, for example:

```swift
http://192.168.1.20:3000/api
```

The iPhone and development machine must be on the same network.

### Option B — Create the Xcode project manually
1. Xcode → New Project → iOS App.
2. Product name: `UniAttendAI`.
3. Interface: SwiftUI.
4. Language: Swift.
5. Delete the generated Swift files except project metadata.
6. Drag the complete `ios/UniAttendAI` directory into the target.
7. Run.

## 10. Configure Apple Wallet signing

Create a Pass Type Identifier in Apple Developer, for example:

```text
pass.com.yourname.uniattend
```

Create/download its certificate and export it with the private key as `.p12`.

Create PEM files. Exact OpenSSL options can differ by OpenSSL version; a common workflow is:

```bash
openssl pkcs12 -in pass.p12 -clcerts -nokeys -out signerCert.pem
openssl pkcs12 -in pass.p12 -nocerts -out signerKey.pem
```

Download the current Apple WWDR intermediate certificate and convert it if necessary to PEM.

Place only local copies here:

```text
wallet/certs/wwdr.pem
wallet/certs/signerCert.pem
wallet/certs/signerKey.pem
```

Never commit the private key.

Edit `backend/.env`:

```env
APPLE_PASS_TYPE_IDENTIFIER="pass.com.yourname.uniattend"
APPLE_TEAM_IDENTIFIER="YOUR_TEAM_ID"
APPLE_ORGANIZATION_NAME="Your University"
APPLE_WWDR_CERT_PATH="../wallet/certs/wwdr.pem"
APPLE_SIGNER_CERT_PATH="../wallet/certs/signerCert.pem"
APPLE_SIGNER_KEY_PATH="../wallet/certs/signerKey.pem"
APPLE_SIGNER_KEY_PASSPHRASE="YOUR_KEY_PASSPHRASE_IF_USED"
```

Restart backend.

The iOS `Student Card` screen will then enable `Add to Apple Wallet`.

### Important design limitation

The MVP Wallet pass uses a QR barcode because this is demonstrable without Apple's special NFC-pass entitlement. NFC-enabled Wallet passes require additional Apple authorization. The backend intentionally treats the credential transport as replaceable: QR can later be replaced by an approved NFC/Student ID flow without changing attendance, AI or badge logic.

## 11. Optional Raspberry Pi / physical terminal

A laptop webcam is sufficient for the diploma demo. For a more physical prototype:

```bash
cd terminal
pip install opencv-python requests
python qr_terminal.py \
  --api http://192.168.1.20:3000/api \
  --session YOUR_SESSION_ID \
  --token YOUR_LECTURER_JWT
```

Use a Raspberry Pi 4/5 + USB camera or Pi Camera.

For an even more polished physical setup add:
- 5–7 inch display
- Raspberry Pi case / 3D-printed stand
- green/red LED
- buzzer
- printed `UniAttend AI Attendance Terminal` label

Do **not** design the MVP around RC522 reading an Apple Wallet pass. Standard low-cost RFID readers do not provide the same Apple Wallet NFC redemption protocol.

## 12. Database entities

Core entities:

```text
User
StudentProfile
LecturerProfile
Course
Enrollment
ClassSession
AttendanceRecord
Material
CatchupPackage
BadgeRule
StudentBadge
```

Important constraints:
- one enrollment per student/course
- one attendance record per student/session
- one catch-up package per absent student/session
- one issued badge per student/rule
- unique badge verification code

## 13. Security rules implemented

- Password hashing with bcrypt
- JWT authentication
- Role guards for STUDENT / LECTURER / ADMIN
- Signed student credential token
- Check-in only while session status is `OPEN`
- Enrollment validation during check-in
- Server-side badge evaluation
- Server-side quiz scoring
- Apple private keys excluded by `.gitignore`

### Recommended next hardening before production

For the diploma, discuss these as future work:
- short-lived rotating attendance credentials
- device binding / App Attest
- HTTPS everywhere
- refresh tokens
- login rate limiting
- audit log entity
- object storage instead of local uploads
- malware scanning for lecturer uploads
- GDPR retention policies
- university SSO / OAuth2 / SAML
- Apple-approved NFC Student ID integration

## 14. Functional test checklist

### Authentication
- [ ] Correct student login works
- [ ] Wrong password returns 401
- [ ] Student cannot access lecturer endpoints
- [ ] Lecturer cannot access student-only endpoints

### Attendance
- [ ] Lecturer can open a session
- [ ] Student credential scans successfully
- [ ] Non-enrolled student is rejected
- [ ] Closed session rejects check-in
- [ ] Duplicate scan does not create duplicate attendance rows
- [ ] Closing marks missing students absent

### Smart Catch-up
- [ ] Material upload works
- [ ] Absent student receives catch-up
- [ ] Present student does not receive catch-up for that session
- [ ] Quiz has five questions
- [ ] Quiz is scored server-side
- [ ] Catch-up does not convert `ABSENT` to `PRESENT`

### Badge
- [ ] 4/5 does not issue perfect-attendance badge
- [ ] 5/5 issues badge
- [ ] Badge has unique verification code
- [ ] Badge benefit comes from `BadgeRule`, not hard-coded UI

### Wallet
- [ ] QR fallback works without certificates
- [ ] Wallet status shows unavailable without certs
- [ ] Signed `.pkpass` downloads when certs are configured
- [ ] iOS presents Apple's add-pass controller

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
14 add validation and error handling
15 add tests and documentation
```

## 16. Recommended project completion order

Follow this order exactly:

### Phase 1 — Local backend
- run DB
- migrate
- seed
- verify login endpoints

### Phase 2 — Attendance
- open final session
- scan Anna
- close session
- confirm 5/5 badge

### Phase 3 — AI
- add API key
- upload a PDF/notes document
- miss a session with Boris
- verify grounded catch-up

### Phase 4 — iOS
- generate/open Xcode project
- connect to backend
- verify login/dashboard/QR

### Phase 5 — Wallet
- create Apple Pass Type ID/certificate
- configure backend PEM files
- add generated pass to real iPhone

### Phase 6 — Physical polish
- run terminal on laptop or Pi
- add branded enclosure/screen

### Phase 7 — Testing
- execute the checklist above
- capture screenshots
- record expected/actual results in thesis

### Phase 8 — Deployment
- PostgreSQL: managed DB
- backend: Render/Railway/Azure/AWS or university server
- web: Vercel/Netlify/static host
- use HTTPS
- update iOS API URL

### Phase 9 — Diploma writing
Write the implementation chapter only after the MVP is stable so screenshots and diagrams match the actual code.

### Phase 10 — Defense rehearsal
Practice the seven-minute flow from `docs/DEFENSE_DEMO.md`.

## 17. What not to overbuild

For a bachelor diploma, do not spend most of the time on:
- a full university ERP/SIS
- real grade management
- payment functions
- complicated social features
- real Apple NFC entitlement approval
- custom machine-learning model training

The strongest scope is:

```text
Attendance + Wallet identity + absence detection + grounded AI catch-up + verifiable attendance badge
```

That is one coherent software-engineering problem and is large enough for a bachelor diploma.
