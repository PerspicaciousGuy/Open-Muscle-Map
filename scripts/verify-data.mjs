// Dependency-free data checks: SVG, JSON data, regions.json and muscles.json must agree.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = p => readFileSync(new URL('../muscle-map/' + p, import.meta.url), 'utf8');
const muscles = new Map(JSON.parse(read('muscles.json')).muscles.map(m => [m.id, m]));
const panels = Object.values(JSON.parse(read('regions.json')).regions).flat();
let n = 0;

for (const sex of ['male', 'female']) {
  const data = JSON.parse(read(`${sex}-map-data.json`));
  const svg = read(`${sex}-muscle-map.svg`);
  const shapes = data.shapes.filter(s => s.region);
  const ids = shapes.map(s => s.region.regionId);
  const svgIds = [...svg.matchAll(/data-region-id="([^"]+)"/g)].map(m => m[1]);

  assert.equal(new Set(ids).size, ids.length, `${sex}: duplicate regionId in JSON`);
  assert.deepEqual([...ids].sort(), [...svgIds].sort(), `${sex}: SVG and JSON regions differ`);
  assert.deepEqual([...ids].sort(), panels.filter(p => p.sex === sex).map(p => p.regionId).sort(), `${sex}: regions.json differs from JSON data`);
  for (const { region: r } of shapes) {
    assert.ok(muscles.has(r.muscleId), `${sex}: unknown muscleId ${r.muscleId}`);
    assert.equal(r.selectable, muscles.get(r.muscleId).selectable, `${sex}: selectable mismatch for ${r.regionId}`);
    assert.ok(r.selectionKey.endsWith(':' + r.muscleId), `${sex}: bad selectionKey ${r.selectionKey}`);
    assert.ok(['left', 'right'].includes(r.side), `${sex}: bad side on ${r.regionId}`);
  }
  console.log(`${sex}: ${shapes.length} panels, ${shapes.filter(s => s.region.selectable).length} selectable`);
  n++;
}
// The female map must describe the same regions as the male map
const byKey = sex => new Map(panels.filter(p => p.sex === sex).map(p => [p.regionKey, `${p.muscleId}|${p.side}|${p.view}|${p.selectable}`]));
const [m, f] = [byKey('male'), byKey('female')];
assert.deepEqual([...m.keys()].sort(), [...f.keys()].sort(), 'male and female region keys differ');
for (const [k, v] of m) assert.equal(f.get(k), v, `male/female mismatch for ${k}`);
const used = new Set(panels.map(p => p.muscleId));
for (const id of muscles.keys()) assert.ok(used.has(id), `muscles.json entry never used in regions.json: ${id}`);
// The artwork is transparent by default (v1.1.0): the background rectangle must stay fill="none".
for (const sex of ['male', 'female']) {
  assert.match(read(`${sex}-muscle-map.svg`), /<rect [^>]*fill="none"[^>]*data-background/, `${sex} SVG background must be transparent`);
  assert.equal(JSON.parse(read(`${sex}-map-data.json`)).background, 'none', `${sex} JSON background must be "none"`);
}
// The controller is embedded in both WebView pages; they must match muscle-map.js.
const controller = read('muscle-map.js').replace(/^\/\*.*\*\/\n/, '').trimEnd();
for (const sex of ['male', 'female']) assert.ok(read(`${sex}-webview.html`).includes(controller), `${sex}-webview.html embeds a stale controller`);
console.log(`OK: ${n} maps, ${muscles.size} muscle entries`);
