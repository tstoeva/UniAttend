import SwiftUI

struct CatchupsView: View {
    @EnvironmentObject var session: AppSession
    var body: some View {
        NavigationStack {
            List(session.dashboard?.catchups ?? []) { item in NavigationLink(item.title) { CatchupDetail(item: item) } }
                .navigationTitle("Smart Catch-up")
                .overlay { if (session.dashboard?.catchups.isEmpty ?? true) { ContentUnavailableView("No catch-ups", systemImage: "checkmark.circle", description: Text("You are up to date.")) } }
        }
    }
}

struct CatchupDetail: View {
    @EnvironmentObject var session: AppSession
    let item: Catchup
    @State private var answers: [Int]
    @State private var result = ""
    init(item: Catchup) { self.item = item; _answers = State(initialValue: Array(repeating: -1, count: item.quiz.count)) }
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 18) {
            Text(item.summary).font(.body)
            Text("Key concepts").font(.headline)
            ForEach(item.keyConcepts, id: \.self) { Text("• \($0)") }
            Text("Quiz").font(.title2.bold())
            ForEach(Array(item.quiz.enumerated()), id: \.offset) { qi, q in
                VStack(alignment: .leading, spacing: 8) { Text("\(qi + 1). \(q.question)").bold(); ForEach(Array(q.options.enumerated()), id: \.offset) { oi, option in Button { answers[qi] = oi } label: { HStack { Image(systemName: answers[qi] == oi ? "largecircle.fill.circle" : "circle"); Text(option); Spacer() } }.buttonStyle(.plain).padding(8).background(.secondary.opacity(0.06), in: RoundedRectangle(cornerRadius: 10)) } }
            }
            Button("Submit quiz") { Task { await submit() } }.buttonStyle(.borderedProminent).tint(.green).disabled(answers.contains(-1) || item.status == "COMPLETED")
            if !result.isEmpty { Text(result).font(.headline).foregroundStyle(.green) }
        }.padding() }.navigationTitle(item.title).navigationBarTitleDisplayMode(.inline)
    }
    func submit() async {
        guard let token = session.token else { return }
        do {
            let updated: Catchup = try await APIClient.shared.request("student/catchups/\(item.id)/submit", method: "POST", body: SubmitQuizBody(answers: answers), token: token)
            result = "Score: \(updated.score ?? 0)/\(updated.maxScore ?? item.quiz.count)"
            await session.refresh()
        } catch { session.errorMessage = error.localizedDescription }
    }
}
