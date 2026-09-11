import SwiftUI

struct StudentTabView: View {
    var body: some View {
        TabView {
            HomeView().tabItem { Label("Home", systemImage: "house.fill") }
            CredentialView().tabItem { Label("Card", systemImage: "wallet.pass.fill") }
            CatchupsView().tabItem { Label("Catch-up", systemImage: "sparkles") }
            ProfileView().tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }.tint(.green)
    }
}
