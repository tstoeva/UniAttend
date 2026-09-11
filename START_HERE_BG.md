# UniAttend AI - как да стартираш проекта

Това е MVP код за дипломния проект UniAttend AI. Най-лесната демонстрация е web версията: студентски портал, преподавателски портал и QR терминал в браузъра.

## Какво трябва да имаш

- Node.js 22 или по-нова версия
- npm
- Docker Desktop
- Visual Studio Code

За iOS приложението допълнително трябва Mac с Xcode. За дипломното демо web версията е достатъчна.

## Къде да го отвориш

1. Разархивирай проекта.
2. Отвори папката `UniAttendAI_MVP` във Visual Studio Code.
3. Отвори Terminal в VS Code.

## Стартиране на Windows

В главната папка на проекта изпълни:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./scripts/setup-windows.ps1
```

След това отвори два отделни терминала.

Първи терминал - backend:

```powershell
cd backend
npm run start:dev
```

Втори терминал - web приложение:

```powershell
cd web
npm run dev
```

Отвори адреса, който Vite покаже, обикновено:

```text
http://localhost:5173
```

Backend API-то работи на:

```text
http://localhost:3000/api
```

## Ако setup скриптът не тръгне

Изпълни ръчно:

```powershell
docker compose up -d db
Copy-Item backend/.env.example backend/.env
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

В нов терминал:

```powershell
cd web
npm install
npm run dev
```

## Демо потребители

Студент:

```text
anna@uni.demo
Student123!
```

Втори студент:

```text
boris@uni.demo
Student123!
```

Преподавател:

```text
lecturer@uni.demo
Lecturer123!
```

## Какво да покажеш на защита

1. Влез като `lecturer@uni.demo`.
2. Отвори занятие `Microservices Basics`.
3. Натисни `Open attendance`.
4. Отвори scanner/terminal страницата.
5. В друг браузър или прозорец влез като `anna@uni.demo`.
6. Покажи студентската карта с QR код.
7. Сканирай QR кода през преподавателския терминал.
8. Върни се в преподавателския портал и затвори занятието.
9. Системата автоматично:
   - записва Anna като PRESENT;
   - записва Boris като ABSENT, ако не е сканиран;
   - генерира Smart Catch-up за отсъстващия;
   - издава Perfect Attendance badge при 5/5 присъствия.

## AI модул

Проектът работи и без OpenAI API key, защото има demo fallback. Ако искаш реална AI генерация, добави в `backend/.env`:

```env
OPENAI_API_KEY="your_api_key_here"
OPENAI_MODEL="gpt-5.6"
```

След промяната рестартирай backend-а.

## Apple Wallet

Apple Wallet частта е включена като код, но за реален `.pkpass` ти трябва Apple Developer account и certificates. За дипломното демо QR картата в web приложението е достатъчна и е най-лесна за показване.

