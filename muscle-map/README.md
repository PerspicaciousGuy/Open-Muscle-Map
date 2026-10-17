# Tappable muscle maps (package reference)

Smooth male and female diagrams with muscle names, stable region IDs, anatomical left/right metadata, and accessible tap targets.

Each map contains **112 named panels: 102 selectable muscle panels and 10 non-muscle panels**, covering **32 named muscles or muscle groups**. Several panels can represent the same muscle. There are not 100 different muscles.

## Try it

Open the [live demo](https://perspicaciousguy.github.io/Open-Muscle-Map/), or build it locally with `node scripts/build-site.mjs` and serve `_site/`. Switch male/female and front/rear, tap a muscle, use the name search, or select both anatomical sides together. Matching panels across front and rear highlight as one muscle selection. Enter/Space activate a focused region; Escape clears the selection.

## Files

- `male-muscle-map.svg`, `female-muscle-map.svg`: smooth vectors with semantic `data-*` attributes, titles, keyboard focus, and selection styling.
- `muscles.json`: names, anatomical terms, groups, structure kinds, and mapping notes.
- `regions.json`: every panel's name, ID, anatomical side, view, selection key, center, and bounds.
- `male-map-data.json`, `female-map-data.json`: the same SVG paths, transforms, gradients, and metadata in a renderer-friendly format.
- `muscle-map.js`, `muscle-map.d.ts`: dependency-free browser controller and TypeScript declarations.
- `MuscleMap.tsx`: native React Native component using `react-native-svg`, with real per-region `onPress` handlers.
- `male-webview.html`, `female-webview.html`: self-contained app WebView assets with message bridges enabled.
- `../docs/SOURCES.md`: anatomy and integration references, plus mapping limits.

## IDs and selection

Example region ID: `male-front-right-lateral_deltoid-01`.

- `regionId`: unique artwork panel, prefixed with sex.
- `regionKey`: panel identity without the sex prefix; equivalent on both maps.
- `muscleId`: shared name, such as `lateral_deltoid` or `rectus_abdominis`.
- `selectionKey`: anatomical side and muscle, such as `right:lateral_deltoid`.
- `subregion`: an optional drawn portion, such as `medial_head`, `lateral_head`, or `upper`.
- `kind`: `muscle`, `muscle_group`, `joint`, `fascia`, or `tendon`.
- `mappingPrecision`: `schematic_region` for every panel.

**Anatomical right is screen-left in the front view, and screen-right in the rear view.** Side metadata already handles this reversal. Do not flip the assets horizontally without also remapping their side semantics.

The same `muscleId` is used in front/rear and male/female. Deltoid anterior, lateral, and posterior portions have separate IDs. Upper/lower abdominal tiles share `rectus_abdominis`; the tiles are parts of the same muscle.

## React Native / Expo

Install `react-native-svg` using your project's normal dependency workflow (for Expo, `npx expo install react-native-svg`). Copy `MuscleMap.tsx`, `muscle-map.d.ts`, and both `*-map-data.json` files together. Enable TypeScript's `resolveJsonModule` if your project does not already support JSON imports.

```tsx
import React, { useState } from 'react';
import MuscleMap from './muscle-map/MuscleMap';

export default function BodySelector() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <MuscleMap
      sex="male"
      view="both"
      width={360}
      multiple
      selectedKeys={selected}
      onChange={setSelected}
      onMusclePress={(region) => {
        console.log(region.muscleId, region.side, region.view);
        // Use muscleId to filter your exercise catalog.
      }}
    />
  );
}
```

Use `sex="female"` for the female map, `view="front"` / `"rear"` for a single view, and `bilateral` to select both sides together. Bilateral keys use `both:muscle_id`. Without `selectedKeys`, the component maintains its own state. The default is one selection. With `multiple`, a tap toggles that muscle while preserving other selections. The component preserves SVG geometry and gradient fills and highlights the selected panels only.

## Browser / inline SVG

Use the SVG as inline markup. Loading it as an `<img>` or a native image displays the picture but does not expose the individual paths to your app. The SVG files contain targets and metadata; **the controller or native component supplies the tap behavior**.

```html
<div id="body-map"></div>
<script src="./muscle-map.js"></script>
<script>
(async () => {
  // Serve these local files from your app or a local development server.
  const response = await fetch('./male-muscle-map.svg');
  if (!response.ok) throw new Error('Could not load muscle map');
  document.querySelector('#body-map').innerHTML = await response.text();
  const svg = document.querySelector('#body-map svg');
  const map = MuscleMap.createMuscleMap(svg, {
    multiple: true,
    bilateral: false,
    onSelect: (region) => console.log(region),
    onChange: (selected) => console.log(selected)
  });
  map.setSelected(['right:lateral_deltoid']);
  // map.setView('front'); map.clear(); map.destroy();
})();
</script>
```

The controller also emits bubbling `musclemap:select` and `musclemap:change` DOM events. Initial artwork colors remain unchanged. Customize selected fill using `--muscle-active`; use `--muscle-hover` and `--muscle-focus` for hover/focus colors. Instantiate once per inline SVG, and call `destroy()` before rebinding.

Each tap payload contains:

```json
{
  "regionId": "male-front-right-lateral_deltoid-01",
  "regionKey": "front-right-lateral_deltoid-01",
  "muscleId": "lateral_deltoid",
  "muscleName": "Lateral deltoid",
  "muscleGroup": "shoulders",
  "side": "right",
  "view": "front",
  "sex": "male",
  "subregion": null,
  "kind": "muscle",
  "mappingPrecision": "schematic_region",
  "selectable": true,
  "selectionKey": "right:lateral_deltoid",
  "selected": true
}
```

`musclemap:change` / `onChange` returns the current logical selections, not one item per drawn tile. In bilateral mode, the callback still reports the side that was tapped; `selectionKey` becomes `both:lateral_deltoid`.

## WebView bridge

The included `*-webview.html` assets run without external resources. When loaded in an app, the controller sends `{ type: 'musclemap:select', payload: ... }` through:

- React Native WebView: `window.ReactNativeWebView.postMessage(JSON.stringify(message))`. Configure the WebView's `onMessage` callback and parse `event.nativeEvent.data`.
- Native iOS WKWebView: `window.webkit.messageHandlers.muscleMap.postMessage(message)`. Register a `WKScriptMessageHandler` named `muscleMap`.

The page exposes `window.muscleMap` for programmatic `setView`, `setSelected`, `setColors` (heatmap) and `clear`. Each WebView asset defaults to single-muscle, per-side selection; adjust the controller options when integrating if you want multiple or bilateral selection.

## Mapping limits

These assets are schematic fitness selectors. Their original generated shapes do not encode medically exact surface anatomy, so the naming is a semantic interpretation of the artwork. Forearm flexors/extensors, posterior rotator cuff, hip adductors, medial hamstrings, fibularis muscles, and lumbar erectors use group labels where individual muscles cannot be reliably separated. A precise muscle atlas would require revised artwork and anatomical review.

Front knee, the patellar tendon / upper shin region, back-of-knee, iliotibial band, and Achilles tendon panels remain drawn and have names/metadata, but are not selectable as muscles. Heads, hands, feet, body silhouettes, and the background are not muscle tap targets. Deep muscles absent from the artwork are not represented as separate targets. Use `muscles.json` notes when extending the map.

## Verification

- Every visible gray panel has a name and semantic ID; panel and ID counts are consistent between `regions.json`, the SVGs and the `*-map-data.json` files.
- The demo site and both WebView pages were loaded in a headless browser without errors; tapping a panel selects it and its matching panels.
- Name accuracy is reviewed in [`../docs/VERIFICATION.md`](../docs/VERIFICATION.md).
- The unit tests mentioned in earlier drafts are not part of this repository, and the React Native component has not been run on an iOS or Android device.
