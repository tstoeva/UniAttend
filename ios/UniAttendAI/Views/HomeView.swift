import SwiftUI

struct HomeView: View {
    @EnvironmentObject var session: AppSession
    var body: some View {
        NavigationStack {
            ScrollView {
                if let d = session.dashboard {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("GOOD DAY").font(.caption.bold()).foregroundStyle(.secondary)
                            Text(session.user.map { "\($0.firstName) \($0.lastName)" } ?? "Student").font(.largeTitle.bold())
                            Text("\(d.student.program) · Year \(d.student.year)").foregroundStyle(.secondary)
                        }
                        ForEach(d.courses) { course in CourseCard(course: course) }
                        if !d.badges.isEmpty {
                            Text("Achievements").font(.title2.bold())
                            ForEach(d.badges) { badge in
                                HStack(spacing: 14) {
                                    Image(systemName: "checkmark.seal.fill").font(.largeTitle).foregroundStyle(.green)
                                    VStack(alignment: .leading) { Text(badge.badgeRule.name).bold(); Text(badge.badgeRule.course.name); Text(badge.badgeRule.benefit).font(.caption).foregroundStyle(.secondary) }
                                }.padding().frame(maxWidth: .infinity, alignment: .leading).background(.green.opacity(0.08), in: RoundedRectangle(cornerRadius: 18))
                            }
                        }
                    }.padding()
                } else { ProgressView().padding() }
            }.navigationTitle("UniAttend AI").refreshable { await session.refresh() }
        }
    }
}

private struct CourseCard: View {
    let course: Course
    var present: Int { course.sessions.filter { $0.attendance.first?.status == "PRESENT" }.count }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack { VStack(alignment: .leading) { Text(course.code).font(.caption.bold()).foregroundStyle(.secondary); Text(course.name).font(.title3.bold()) }; Spacer(); Text("\(present)/\(course.requiredSessions)").font(.title2.bold()).foregroundStyle(.green) }
            ProgressView(value: Double(present), total: Double(course.requiredSessions)).tint(.green)
            ForEach(course.sessions) { s in HStack { Text(s.title); Spacer(); Text(s.attendance.first?.status ?? s.status).font(.caption.bold()).foregroundStyle(s.attendance.first?.status == "ABSENT" ? .red : .secondary) } }
        }.padding().background(.background, in: RoundedRectangle(cornerRadius: 18)).shadow(color: .black.opacity(0.06), radius: 10, y: 3)
    }
}
