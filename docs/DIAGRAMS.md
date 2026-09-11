# Diagrams for the thesis

These Mermaid diagrams can be pasted into Mermaid Live Editor, GitHub, Notion, Obsidian or exported as SVG/PNG.

## Component architecture

```mermaid
flowchart LR
    S[iOS Student App\nSwiftUI] --> API[NestJS REST API]
    L[Lecturer Portal\nReact] --> API
    T[Attendance Terminal\nBrowser / Raspberry Pi] --> API
    API --> DB[(PostgreSQL)]
    API --> AI[OpenAI Responses API]
    API --> W[Apple Wallet Pass Generator]
    W --> S
```

## Attendance sequence

```mermaid
sequenceDiagram
    actor Lecturer
    actor Student
    participant Portal as Lecturer Portal
    participant App as Student App/Wallet
    participant API as NestJS API
    participant DB as PostgreSQL

    Lecturer->>Portal: Open session
    Portal->>API: POST /lecturer/sessions/:id/open
    API->>DB: status = OPEN
    Student->>App: Show student credential
    Lecturer->>Portal: Scan QR
    Portal->>API: POST /attendance/check-in
    API->>API: Verify signed credential
    API->>DB: Verify enrollment + open session
    API->>DB: Upsert PRESENT attendance
    API-->>Portal: Checked in
```

## Absence + Smart Catch-up sequence

```mermaid
sequenceDiagram
    actor Lecturer
    participant Portal
    participant API
    participant DB
    participant OpenAI
    actor Student

    Lecturer->>Portal: Close session
    Portal->>API: POST /lecturer/sessions/:id/close
    API->>DB: Find enrolled students
    API->>DB: Create ABSENT for missing check-ins
    API->>DB: Load lecturer materials
    API->>OpenAI: Files + grounded catch-up prompt
    OpenAI-->>API: Strict JSON summary + quiz
    API->>DB: Save CatchupPackage
    Student->>API: GET /student/dashboard
    API-->>Student: Catch-up ready
```

## Badge sequence

```mermaid
flowchart TD
    A[Session closed] --> B{Required sessions closed?}
    B -- No --> X[No badge evaluation]
    B -- Yes --> C[Count PRESENT records]
    C --> D{Present >= badge rule?}
    D -- No --> Y[No badge]
    D -- Yes --> E[Create/Upsert StudentBadge]
    E --> F[Unique verification code]
    F --> G[Show green badge in app]
```

## Simplified ER diagram

```mermaid
erDiagram
    USER ||--o| STUDENT_PROFILE : has
    USER ||--o| LECTURER_PROFILE : has
    LECTURER_PROFILE ||--o{ COURSE : teaches
    STUDENT_PROFILE ||--o{ ENROLLMENT : has
    COURSE ||--o{ ENROLLMENT : has
    COURSE ||--o{ CLASS_SESSION : contains
    CLASS_SESSION ||--o{ ATTENDANCE_RECORD : records
    STUDENT_PROFILE ||--o{ ATTENDANCE_RECORD : receives
    CLASS_SESSION ||--o{ MATERIAL : uses
    CLASS_SESSION ||--o{ CATCHUP_PACKAGE : generates
    STUDENT_PROFILE ||--o{ CATCHUP_PACKAGE : receives
    COURSE ||--o{ BADGE_RULE : defines
    BADGE_RULE ||--o{ STUDENT_BADGE : awards
    STUDENT_PROFILE ||--o{ STUDENT_BADGE : owns
```

## Deployment diagram

```mermaid
flowchart TB
    subgraph StudentDevice[iPhone]
      IOS[SwiftUI App]
      Wallet[Apple Wallet]
    end
    subgraph LecturerDevice[Laptop / Tablet]
      Web[React Portal]
      Cam[Camera Scanner]
    end
    subgraph Server[Cloud / University Server]
      API[NestJS]
      DB[(PostgreSQL)]
      Uploads[Object/File Storage]
    end
    OpenAI[OpenAI API]
    IOS -->|HTTPS| API
    Web -->|HTTPS| API
    Cam --> Web
    API --> DB
    API --> Uploads
    API -->|HTTPS| OpenAI
    API -->|signed pkpass| IOS
    IOS --> Wallet
```
