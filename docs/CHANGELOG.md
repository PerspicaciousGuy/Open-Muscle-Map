# Changes from the original package

Name corrections after checking the panels against anatomy sources (applied to male and female maps; geometry unchanged):

| Panel | Was | Now | Why |
|---|---|---|---|
| Front, lowest flank piece left/right of the abs (`external_oblique-01`) | External oblique | Serratus anterior (subregion `lower`) | It continues the stacked serratus digitations; the real external oblique is the panel below it. Ambiguous in the art. |
| Front, shape below each kneecap (`gastrocnemius-01`) | Gastrocnemius (selectable) | Patellar tendon / upper shin region (tendon, not selectable) | Gastrocnemius arises behind the knee. |
| Rear, small shape on top of each shoulder (`posterior_deltoid-01`) | Posterior deltoid | Trapezius (subregion `upper_lateral`) | A posterior deltoid panel already sits below it; this is the trapezius acromial fibres. |

Region ids of these 6 panels per sex changed accordingly. Counts per sex: 110 panels, 100 selectable, 10 non-muscle, 31 muscle ids.

## 2026-10-17: iliopsoas and lower soleus

Two corrections after a panel-by-panel review, applied to the male and female maps. Every muscle is now tappable where it is drawn.

| Panel | Was | Now | Why |
|---|---|---|---|
| Front, upper strap from the hip bone into the groin (`hip_adductors-01`) | Hip adductors | Iliopsoas (hip flexors), new `muscleId` `iliopsoas`, new region ids `front-left/right-iliopsoas-01` | It lies directly medial to the sartorius panel: the lateral floor of the femoral triangle is the iliopsoas; the adductors arise from the pubis (StatPearls, Femoral Triangle). The small inner-thigh panel (`hip_adductors-02`) stays the adductors. |
| Rear, central calf shape (`achilles_tendon-01`) | One non-selectable Achilles tendon panel from just below the gastrocnemius to the heel | Split at the shape's narrowest point: the broad upper part is a new selectable soleus panel (`rear-left/right-soleus-02`, subregion `lower_central`); the narrow lower part keeps the `achilles_tendon-01` key | The tendon narrows from about 6.6 cm at the gastrocnemius to about 2.9 cm at the soleus junction (cadaveric study in `SOURCES.md`), so the broad upper part is soleus. Before, tapping the lower calf did nothing. The cut leaves the artwork's usual ~2-unit gap with rounded ends. |

Counts per sex: 112 panels, 102 selectable, 10 non-muscle, 32 muscle ids (37 catalog entries). Region ids changed for the 2 iliopsoas panels per sex; 2 soleus panels per sex were added; all other keys are unchanged. `docs/preview-*.png` and `site/og.png` were not regenerated (the changes are small: one renamed panel, one new seam on each calf).

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

Code boxes wrap long lines instead of scrolling sideways; scrollbars are hidden on code boxes and the tab row; the tab row no longer overflows by 1px (which showed a vertical scrollbar). Browser checks fail if a code box scrolls sideways.
