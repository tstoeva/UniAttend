import Foundation

final class APIClient {
    static let shared = APIClient()
    // Simulator: localhost works. Real iPhone: replace with your Mac's LAN IP, e.g. http://192.168.1.20:3000/api
    var baseURL = URL(string: "http://localhost:3000/api")!
    private init() {}

    func request<T: Decodable>(_ path: String, method: String = "GET", body: Encodable? = nil, token: String? = nil) async throws -> T {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body { req.httpBody = try JSONEncoder().encode(AnyEncodable(body)) }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.server(String(data: data, encoding: .utf8) ?? "Server error")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func passData(token: String) async throws -> Data {
        var req = URLRequest(url: baseURL.appendingPathComponent("wallet/pass"))
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.server(String(data: data, encoding: .utf8) ?? "Wallet pass unavailable")
        }
        return data
    }
}

enum APIError: LocalizedError {
    case server(String)
    var errorDescription: String? { if case .server(let s) = self { return s }; return "Unknown error" }
}

struct AnyEncodable: Encodable {
    private let encodeBlock: (Encoder) throws -> Void
    init(_ value: Encodable) { encodeBlock = value.encode }
    func encode(to encoder: Encoder) throws { try encodeBlock(encoder) }
}

struct LoginBody: Codable { let email: String; let password: String }
struct SubmitQuizBody: Codable { let answers: [Int] }
