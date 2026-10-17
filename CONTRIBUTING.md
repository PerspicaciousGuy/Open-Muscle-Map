# Contributing

## Report a wrong muscle name

Use the "Wrong muscle name" issue template. Give the `regionId` (shown in the demo's payload box), what the panel is called now, what it should be called, and a source such as a textbook or reference page. Names change only with a source; see `docs/VERIFICATION.md` for how each muscle is currently rated.

## Change the code or data

1. Edit files under `muscle-map/` or `site/`. `muscle-map.js` is also embedded in `male-webview.html` and `female-webview.html`; keep the three copies identical (minus the first comment line).
2. Run the checks before opening a pull request:

```bash
node scripts/verify-data.mjs
npm install --no-save playwright && npx playwright install chromium
node scripts/verify-browser.mjs
node scripts/verify-react.mjs   # builds the React guide with Vite; needs network
```

CI (`.github/workflows/verify.yml`) runs the same checks, type-checks the React Native component and compiles the Android and SwiftUI guides.
3. Keep `docs/CHANGELOG.md` current for name or geometry changes.

The artwork is a schematic diagram. Pull requests that redraw it need a clear before/after and must keep the panel keys stable.
