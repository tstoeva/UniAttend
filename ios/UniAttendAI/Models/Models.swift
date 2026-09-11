import Foundation

struct AppUser: Codable {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let role: String
}

struct LoginResponse: Codable {
    let accessToken: String
    let user: AppUser
}

struct StudentProfile: Codable {
    let id: String
    let userId: String
    let facultyNumber: String
    let program: String
    let year: Int
    let walletSerial: String
}

struct Attendance: Codable, Identifiable {
    let id: String
    let status: String
    let checkedAt: String?
}

struct ClassSession: Codable, Identifiable {
    let id: String
    let title: String
    let startsAt: String
    let endsAt: String
    let room: String
    let status: String
    let attendance: [Attendance]
}

struct Course: Codable, Identifiable {
    let id: String
    let code: String
    let name: String
    let requiredSessions: Int
    let sessions: [ClassSession]
}

struct QuizQuestion: Codable, Identifiable {
    var id: String { question }
    let question: String
    let options: [String]
    let correctIndex: Int
    let explanation: String
}

struct Catchup: Codable, Identifiable {
    let id: String
    let title: String
    let summary: String
    let keyConcepts: [String]
    let quiz: [QuizQuestion]
    let status: String
    let score: Int?
    let maxScore: Int?
}

struct BadgeCourse: Codable { let name: String }
struct BadgeRule: Codable { let name: String; let benefit: String; let course: BadgeCourse }
struct StudentBadge: Codable, Identifiable {
    let id: String
    let verificationCode: String
    let issuedAt: String
    let badgeRule: BadgeRule
}

struct StudentDashboard: Codable {
    let student: StudentProfile
    let courses: [Course]
    let catchups: [Catchup]
    let badges: [StudentBadge]
}

struct CredentialResponse: Codable {
    let credential: String
    let student: CredentialStudent
}
struct CredentialStudent: Codable { let name: String; let facultyNumber: String }
struct WalletStatus: Codable { let available: Bool; let missing: [String] }
