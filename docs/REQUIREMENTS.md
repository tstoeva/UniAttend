# Requirements specification

## Actors
- Student
- Lecturer
- Administrator (future production role)
- Exam invigilator (can be represented by lecturer role in MVP)
- External AI service
- Apple Wallet platform

## Functional requirements

### FR-01 Authentication
The system shall authenticate students and lecturers and issue role-scoped access tokens.

### FR-02 Course enrollment
The system shall associate students with courses.

### FR-03 Session management
A lecturer shall create, open and close class sessions for courses they teach.

### FR-04 Attendance credential
A student shall receive a signed digital attendance credential.

### FR-05 Attendance check-in
The system shall accept a credential only for an open session and an enrolled student.

### FR-06 Attendance uniqueness
At most one attendance record shall exist per student/session pair.

### FR-07 Absence detection
When a session closes, enrolled students without attendance shall be marked absent.

### FR-08 Materials
The lecturer shall upload materials associated with a class session.

### FR-09 Smart Catch-up
For an absent student, the system shall generate a material-grounded summary and quiz.

### FR-10 Catch-up result
The system shall score the quiz server-side and persist completion state. Completing it shall not change ABSENT to PRESENT.

### FR-11 Attendance badge
The system shall issue a badge when the configured course attendance rule is met.

### FR-12 Badge verification
The system shall provide a server-verified badge verification code and benefit description.

### FR-13 Apple Wallet
When signing credentials are configured, the system shall generate a signed `.pkpass` student card.

## Non-functional requirements

### NFR-01 Security
Passwords must not be stored in plaintext. Private signing keys must remain server-side.

### NFR-02 Integrity
Attendance and badge decisions must be made server-side.

### NFR-03 Availability
Core attendance demo must remain functional when AI or Wallet external configuration is unavailable.

### NFR-04 Maintainability
Credential transport (QR/NFC) must remain decoupled from attendance domain logic.

### NFR-05 Usability
A normal attendance scan should require no more than a few user actions.

### NFR-06 Privacy
Only data required for academic attendance and learning support should be processed; production deployments require explicit retention and access policies.
