# Seven-minute defense demo

## 0:00–0:45 — Problem
University attendance is often manual, disconnected from student learning support, and difficult to verify later.

## 0:45–1:30 — Architecture
Show one slide: iOS + lecturer portal + terminal -> NestJS -> PostgreSQL; optional OpenAI and Wallet services.

## 1:30–2:15 — Student before class
Login as Anna. Show 4/5 attendance and Student Card QR/Wallet.

## 2:15–3:15 — Live check-in
Login as lecturer. Open `Microservices Basics`. Open terminal. Scan Anna's credential. Show `PRESENT`.

## 3:15–4:15 — Absence automation
Do not scan Boris. Close session. Explain that the backend creates Boris's `ABSENT` record and starts Smart Catch-up from lecturer material.

## 4:15–5:15 — AI learning support
Login as Boris. Open generated summary and five-question quiz. Emphasize that it uses lecturer-supplied material and does not erase the absence.

## 5:15–6:00 — Perfect Attendance
Login as Anna. Show 5/5 and green `Perfect Attendance` badge. Show verification code and explain that exam staff validates it server-side.

## 6:00–6:40 — Apple Wallet
Show real `.pkpass` on iPhone if certificates are configured. Explain that MVP uses Wallet QR; production can replace the credential transport with Apple-approved NFC without changing core backend logic.

## 6:40–7:00 — Conclusion
One system connects attendance verification, student identity and AI-assisted recovery after missed classes.
