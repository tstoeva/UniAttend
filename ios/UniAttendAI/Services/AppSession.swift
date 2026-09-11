import Foundation

@MainActor
final class AppSession: ObservableObject {
    @Published var token: String?
    @Published var user: AppUser?
    @Published var dashboard: StudentDashboard?
    @Published var errorMessage: String?
    @Published var loading = false

    func login(email: String, password: String) async {
        loading = true; defer { loading = false }
        do {
            let response: LoginResponse = try await APIClient.shared.request("auth/login", method: "POST", body: LoginBody(email: email, password: password))
            guard response.user.role == "STUDENT" else { throw APIError.server("This iOS MVP is the student app. Use the web portal for lecturers.") }
            token = response.accessToken; user = response.user
            await refresh()
        } catch { errorMessage = error.localizedDescription }
    }

    func refresh() async {
        guard let token else { return }
        do { dashboard = try await APIClient.shared.request("student/dashboard", token: token) }
        catch { errorMessage = error.localizedDescription }
    }

    func logout() { token = nil; user = nil; dashboard = nil }
}
