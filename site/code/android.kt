// Put male-webview.html in app/src/main/assets/. Call setUpMuscleMap from your Activity or Fragment.
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient

class MuscleBridge(private val onSelect: (String) -> Unit) {
    @JavascriptInterface
    fun postMessage(json: String) = onSelect(json)   // {"type":"musclemap:select","payload":{...}}
}

fun setUpMuscleMap(webView: WebView, onSelect: (String) -> Unit) {
    webView.settings.javaScriptEnabled = true
    webView.addJavascriptInterface(MuscleBridge(onSelect), "AndroidMuscleMap")
    webView.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView, url: String) {
            // The controller posts through window.ReactNativeWebView when it exists; point that at Android.
            view.evaluateJavascript(
                "window.ReactNativeWebView = { postMessage: m => AndroidMuscleMap.postMessage(m) };", null)
        }
    }
    webView.loadUrl("file:///android_asset/male-webview.html")
}

// Drive the map from Kotlin:
// webView.evaluateJavascript("window.muscleMap.setSelected(['right:lateral_deltoid'])", null)
// webView.evaluateJavascript("window.muscleMap.clear()", null)
