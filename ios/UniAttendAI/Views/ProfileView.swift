import SwiftUI
struct ProfileView: View {
    @EnvironmentObject var session: AppSession
    var body: some View {
        NavigationStack { Form {
            if let u = session.user { Section("Student") { LabeledContent("Name", value: "\(u.firstName) \(u.lastName)"); LabeledContent("Email", value: u.email) } }
            if let s = session.dashboard?.student { Section("University") { LabeledContent("Faculty number", value: s.facultyNumber); LabeledContent("Program", value: s.program); LabeledContent("Year", value: String(s.year)) } }
            Section { Button("Log out", role: .destructive) { session.logout() } }
        }.navigationTitle("Profile") }
    }
}
