// Builds _site/ for GitHub Pages: one page with the demo, guides and a muscle ID table generated from muscles.json.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const svg = p => read(p).replace(/^<\?xml[^>]*\?>\s*/, '');

const catalog = JSON.parse(read('muscle-map/muscles.json')).muscles;
const selectable = catalog.filter(m => m.selectable);
const rows = catalog.map(m =>
  `<tr><td>${esc(m.name)}</td><td><code>${esc(m.id)}</code></td><td>${esc(m.group)}</td><td>${esc(m.kind.replace('_', ' '))}</td><td>${m.selectable ? 'Yes' : 'No'}</td></tr>`).join('');

const out = read('site/index.template.html')
  .replace(/\{\{CODE:([\w.-]+)\}\}/g, (_, f) => esc(read('site/code/' + f).trimEnd()))
  .replace('{{MALE_SVG}}', () => svg('muscle-map/male-muscle-map.svg'))
  .replace('{{FEMALE_SVG}}', () => svg('muscle-map/female-muscle-map.svg'))
  .replace('{{CONTROLLER}}', () => read('muscle-map/muscle-map.js'))
  .replace('{{CATALOG}}', () => JSON.stringify(catalog).replace(/</g, '\\u003c'))
  .replace('{{MUSCLE_ROWS}}', () => rows)
  .replace('{{AGENTS_MD}}', () => esc(read('AGENTS.md').trimEnd()))
  .replace('{{MUSCLE_COUNT}}', String(selectable.length));

if (/\{\{[A-Z_:.a-z-]+\}\}/.test(out)) throw new Error('Unreplaced placeholder in template');

const dir = new URL('../_site/', import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('index.html', dir), out);
cpSync(new URL('../site/og.png', import.meta.url), new URL('og.png', dir));
writeFileSync(new URL('AGENTS.md', dir), read('AGENTS.md'));
cpSync(new URL('../muscle-map/', import.meta.url), new URL('muscle-map/', dir), { recursive: true, filter: p => !p.endsWith('demo.html') });
console.log(`Built _site/index.html (${(out.length / 1024).toFixed(0)} KB), ${selectable.length} selectable muscles`);
