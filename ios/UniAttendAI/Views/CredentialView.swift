import SwiftUI
import CoreImage.CIFilterBuiltins
import PassKit

struct CredentialView: View {
    @EnvironmentObject var session: AppSession
    @State private var credential: CredentialResponse?
    @State private var walletStatus: WalletStatus?
    @State private var pass: PKPass?
    @State private var showWallet = false
    private let context = CIContext(); private let filter = CIFilter.qrCodeGenerator()

    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                if let c = credential {
                    Text(c.student.name).font(.title2.bold())
                    Text(c.student.facultyNumber).foregroundStyle(.secondary)
                    if let image = qrImage(c.credential) { Image(uiImage: image).interpolation(.none).resizable().scaledToFit().frame(width: 250, height: 250).padding().background(.white, in: RoundedRectangle(cornerRadius: 20)) }
                    Text("Show this credential to the attendance terminal.").font(.footnote).foregroundStyle(.secondary)
                } else { ProgressView() }
                Button("Add to Apple Wallet") { Task { await loadPass() } }.buttonStyle(.borderedProminent).tint(.green).disabled(walletStatus?.available != true)
                if walletStatus?.available == false { Text("Wallet pass signing is not configured on the backend yet. The QR demo remains fully functional.").font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center) }
            }.padding().navigationTitle("Student Card").task { await load() }.sheet(isPresented: $showWallet) { if let pass { AddPassView(pass: pass) } }
        }
    }

    func load() async {
        guard let token = session.token else { return }
        do {
            async let c: CredentialResponse = APIClient.shared.request("attendance/credential", token: token)
            async let w: WalletStatus = APIClient.shared.request("wallet/status", token: token)
            credential = try await c; walletStatus = try await w
        } catch { session.errorMessage = error.localizedDescription }
    }
    func loadPass() async {
        guard let token = session.token else { return }
        do { pass = try PKPass(data: await APIClient.shared.passData(token: token)); showWallet = true }
        catch { session.errorMessage = error.localizedDescription }
    }
    func qrImage(_ text: String) -> UIImage? {
        filter.message = Data(text.utf8)
        guard let output = filter.outputImage?.transformed(by: CGAffineTransform(scaleX: 8, y: 8)), let cg = context.createCGImage(output, from: output.extent) else { return nil }
        return UIImage(cgImage: cg)
    }
}

struct AddPassView: UIViewControllerRepresentable {
    let pass: PKPass
    func makeUIViewController(context: Context) -> PKAddPassesViewController { PKAddPassesViewController(pass: pass)! }
    func updateUIViewController(_ uiViewController: PKAddPassesViewController, context: Context) {}
}
