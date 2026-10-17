# Integrating Open-Muscle-Map (instructions for AI coding agents)

You are adding a tappable muscle map to someone's app. Follow this file literally. Everything you need is in `muscle-map/`. Do not redraw, flip, re-color paths in the SVG, or invent muscle names.

## 1. Facts you must not get wrong

- **Join key:** `muscleId` (for example `lateral_deltoid`). It is identical on male and female, front and rear. Map it to the app's own data. The full list is `muscle-map/muscles.json`; 31 are selectable (`selectable: true`), 5 are joints, fascia or tendons and are not.
- **Selection key:** `side:muscleId` (`right:lateral_deltoid`). In bilateral mode it is `both:muscleId`.
- **Sides are the person's, not the screen's.** Anatomical right is screen-left in the front view and screen-right in the rear view. The `side` field already accounts for this. Never mirror an SVG or swap sides.
- **One muscle is many panels.** Several drawn tiles share one `muscleId` (abs, triceps, glutes). Count muscles by `muscleId`, never by tile.
- **Inline the SVG.** An `<img>` or native image loses the per-region paths. Web and WebView use the controller; React Native uses `MuscleMap.tsx`; do not parse the SVG by hand.
- **The map is schematic.** Do not present it as medically exact. Forearm flexors and extensors, hip adductors, medial hamstrings, fibularis, posterior rotator cuff and erector spinae are groups on purpose.

## 2. Pick the path

| Target | Use | Copy these files |
|---|---|---|
| Web, any framework | `muscle-map.js` controller + inline SVG | `muscle-map.js`, `male-muscle-map.svg`, `female-muscle-map.svg` |
| React (web) | same controller inside an effect, `destroy()` on unmount | same as web |
| React Native / Expo | native component, no WebView | `MuscleMap.tsx`, `muscle-map.d.ts`, `male-map-data.json`, `female-map-data.json`; install `react-native-svg` |
| SwiftUI / WKWebView | WebView page + `muscleMap` message handler | `male-webview.html`, `female-webview.html` |
| Android WebView | WebView page + JS interface shim | `male-webview.html`, `female-webview.html` |

Code for each path is in `site/code/` (and on the live site under Guides). Start from it; adapt names and wiring to the host app.

## 3. Implement

1. Read the host app's conventions first (framework, state, styling, how assets are bundled). Match them.
2. Copy only the files for your path into the app's own folder. Keep `muscle-map/` files unmodified so they can be updated later.
3. Wire the callback: on select you receive `{ muscleId, muscleName, side, view, selected, selectionKey, ... }`. Translate `muscleId` into the app's own concept (exercise filter, heatmap key). Put that mapping in one table in the app, with an explicit entry for every selectable `muscleId` you support and a visible fallback for the rest.
4. Selected color: set the CSS variable `--muscle-active` (web) or `activeColor` (React Native). Hover and focus: `--muscle-hover`, `--muscle-focus`. Do not edit the SVG fills.
5. Heatmap: `controller.setColors({ muscleId: 0..1 | 'css colour' })` (web, WebView) or the `colors` prop (React Native, any colour string). Unknown `muscleId`s and non-finite numbers throw. Selection colour wins over heat. `clearColors()` removes them.
6. Single vs several selections: `multiple`. Left and right together: `bilateral`.

## 4. Verify (do all of it, report what you could not run)

Run these from the repo root of this project before touching the host app:

```bash
node scripts/verify-data.mjs      # SVG, JSON data, regions.json and muscles.json agree (no dependencies)
node scripts/build-site.mjs       # builds _site/ (the demo, guides and ID table)
```

Browser checks (needs `npm install --no-save playwright && npx playwright install chromium`):

```bash
node scripts/verify-browser.mjs   # selection modes, keyboard, guide snippet, phone layout, no console errors
node scripts/verify-react.mjs     # React guide built with Vite and tapped (needs network for npm install)
```

Then verify the integration in the host app:

- **Web / React:** `muscle-map.js` is a classic script with no ES exports: import it for its side effect and use `window.MuscleMap` (a default import fails under the Vite dev server). Open the page over HTTP (`fetch()` fails from `file://`). Tap a muscle: the `onSelect` payload has the expected `muscleId` and `side`. Tap a front-view and a rear-view panel of the same muscle: both highlight. Press Tab to a region, then Enter: it selects. Press Escape: it clears. Check the browser console is clean.
- **React Native:** `npx tsc --noEmit` passes (enable `resolveJsonModule`). Run on a simulator, tap, and log `region.muscleId`.
- **SwiftUI:** the snippet must compile for an iOS target (CI runs `xcrun --sdk iphonesimulator swiftc -typecheck`). Run in the simulator: the `muscleMap` handler receives `type == "musclemap:select"`. Confirm `male-webview.html` is in the app bundle's resources, or nothing loads.
- **Android:** the page must be loaded from assets; confirm `evaluateJavascript` that defines `window.ReactNativeWebView` runs after page load, then tap and check the Kotlin callback.

## 5. What has and has not been tested (do not claim more)

| Path | Status |
|---|---|
| Data consistency, controller, JavaScript guide, demo site | Tested in headless Chromium by `scripts/verify-*.mjs` (CI: `.github/workflows/verify.yml`) |
| `MuscleMap.tsx` and the React Native guide | Type-checked in CI; not run on a device |
| React guide | Built with Vite and run under both the production build and the dev server in headless Chromium by `scripts/verify-react.mjs` (CI: `verify.yml`); not run in other bundlers or frameworks |
| SwiftUI guide | Compiled by `.github/workflows/verify-swift.yml` once it has run; not run in a simulator |
| Android guide | Compiled against the Android SDK by `verify.yml` once it has run; not run on a device |

If you run a path that is listed as not run, say so in your report with the result, and fix `site/code/` if the snippet was wrong.

## 6. Common mistakes

- Expecting a white backdrop: the artwork is transparent. Give it a neutral surface, or set `[data-background] { fill: ... }` / React Native `backgroundColor`.
- Loading the SVG as `<img>`: nothing is tappable.
- Creating the controller twice on the same SVG: call `destroy()` before rebinding (React effects in strict mode do this).
- Counting `data-region-id` elements as muscles: there are 100 selectable panels but 31 muscles.
- Treating `selectable: false` entries (knee, back of knee, iliotibial band, Achilles) as muscles.
- Hard-coding hex colors in the SVG instead of the CSS variables.
- Using `@main` in a CDN URL in production: pin a tag or commit.
