import SwiftUI

@main
struct UniAttendAIApp: App {
    @StateObject private var session = AppSession()
    var body: some Scene {
        WindowGroup {
            RootView().environmentObject(session)
        }
    }
}
