import SwiftUI

struct RootView: View {
    @EnvironmentObject var session: AppSession
    var body: some View {
        Group {
            if session.token == nil { LoginView() }
            else { StudentTabView() }
        }
        .alert("UniAttend AI", isPresented: Binding(get: { session.errorMessage != nil }, set: { if !$0 { session.errorMessage = nil } })) {
            Button("OK") { session.errorMessage = nil }
        } message: { Text(session.errorMessage ?? "") }
    }
}
