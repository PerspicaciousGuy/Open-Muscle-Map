# Changes from the original package

Name corrections after checking the panels against anatomy sources (applied to male and female maps; geometry unchanged):

| Panel | Was | Now | Why |
|---|---|---|---|
| Front, lowest flank piece left/right of the abs (`external_oblique-01`) | External oblique | Serratus anterior (subregion `lower`) | It continues the stacked serratus digitations; the real external oblique is the panel below it. Ambiguous in the art. |
| Front, shape below each kneecap (`gastrocnemius-01`) | Gastrocnemius (selectable) | Patellar tendon / upper shin region (tendon, not selectable) | Gastrocnemius arises behind the knee. |
| Rear, small shape on top of each shoulder (`posterior_deltoid-01`) | Posterior deltoid | Trapezius (subregion `upper_lateral`) | A posterior deltoid panel already sits below it; this is the trapezius acromial fibres. |

Region ids of these 6 panels per sex changed accordingly. Counts per sex: 110 panels, 100 selectable, 10 non-muscle, 31 muscle ids.

## 2026-10-17: verification pass

No geometry or name changes. Re-checked the four uncertain entries (brachialis, hip adductors, soleus, patellar tendon region) against the sources in `SOURCES.md`: three moved to partly verified, brachialis stays uncertain. Added a male/female consistency check to `scripts/verify-data.mjs`.

## 2026-10-17: v1.0.0

Added `setColors` / `clearColors` / `heatColor` (heatmap) to the controller, the `colors` prop to the React Native component, hover and focus name labels and a heatmap toggle in the demo, Open Graph tags with a share image, contributing docs and issue templates. Workflow actions bumped to their Node 24 majors.

## 2026-10-17: fixes found by an integration in a React app

The React guide used a default import of `muscle-map.js`, which has no ES exports and fails under the Vite dev server; it now imports the file for its side effect and uses `window.MuscleMap`. `scripts/verify-browser.mjs` built its server root from `URL.pathname`, which breaks on Windows; it now uses `fileURLToPath`. New `scripts/verify-react.mjs` and a CI job build and run the React guide with Vite.

## 2026-10-17: v1.1.0 transparent background

The background rectangle in both SVGs, the `background` field in both `*-map-data.json` files (`"none"`), the React Native default and the WebView pages' body are now transparent instead of `#fdfdfd`. Apps that relied on the white backdrop must set one: `[data-background] { fill: ... }` in CSS, `backgroundColor` in React Native, or a background on the WebView.

## 2026-10-17: site restyle

The demo site drops component borders (cards, buttons, inputs, code boxes, tags, table) in favour of soft shadows, in both themes.

Softer shadows; phone nav no longer overflows below 380px with wide system fonts (GitHub and Guides links hide at 480px and 340px); `html{overflow-x:clip}` keeps the layout viewport at device width; browser checks now stress-test phone widths with widened text.
