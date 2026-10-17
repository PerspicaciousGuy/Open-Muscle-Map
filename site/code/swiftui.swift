import SwiftUI
import WebKit

/// Loads male-webview.html (or female-webview.html) from the app bundle.
/// Add the file to the target as a bundle resource.
struct MuscleMapView: UIViewRepresentable {
    var onSelect: (_ muscleId: String, _ selected: Bool) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onSelect: onSelect) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "muscleMap")
        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .clear
        if let url = Bundle.main.url(forResource: "male-webview", withExtension: "html") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler {
        let onSelect: (String, Bool) -> Void
        init(onSelect: @escaping (String, Bool) -> Void) { self.onSelect = onSelect }

        func userContentController(_ controller: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  body["type"] as? String == "musclemap:select",
                  let payload = body["payload"] as? [String: Any],
                  let id = payload["muscleId"] as? String else { return }
            onSelect(id, payload["selected"] as? Bool ?? true)
        }
    }
}

// Drive the map from Swift:
// webView.evaluateJavaScript("window.muscleMap.setSelected(['right:lateral_deltoid'])")
// webView.evaluateJavaScript("window.muscleMap.clear()")
