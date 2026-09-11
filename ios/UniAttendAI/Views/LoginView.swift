import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: AppSession
    @State private var email = "anna@uni.demo"
    @State private var password = "Student123!"
    var body: some View {
        NavigationStack {
            VStack(spacing: 22) {
                Spacer()
                Image(systemName: "checkmark.seal.fill").font(.system(size: 62)).foregroundStyle(.green)
                Text("UniAttend AI").font(.largeTitle.bold())
                Text("Attendance · Wallet · Smart Catch-up").foregroundStyle(.secondary)
                TextField("Email", text: $email).textInputAutocapitalization(.never).keyboardType(.emailAddress).textFieldStyle(.roundedBorder)
                SecureField("Password", text: $password).textFieldStyle(.roundedBorder)
                Button { Task { await session.login(email: email, password: password) } } label: {
                    if session.loading { ProgressView().frame(maxWidth: .infinity) }
                    else { Text("Sign in").frame(maxWidth: .infinity) }
                }.buttonStyle(.borderedProminent).tint(.green).controlSize(.large)
                Spacer()
            }.padding(28)
        }
    }
}
