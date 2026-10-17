// Builds the site, serves _site/ and drives it in headless Chromium. Needs `playwright` (see .github/workflows/verify.yml).
// Locally: PLAYWRIGHT_PATH=<path to playwright/index.mjs> CHROMIUM_PATH=<chromium binary> node scripts/verify-browser.mjs
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/build-site.mjs'], { stdio: 'inherit' });
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');

const root = fileURLToPath(new URL('../_site/', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const file = join(root, req.url.split('?')[0].replace(/\/$/, '/index.html'));
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const problems = [];
const open = async (width, height, colorScheme = 'light') => {
  const page = await (await browser.newContext({ viewport: { width, height }, colorScheme })).newPage();
  page.on('pageerror', e => problems.push(e.message));
  page.on('console', m => m.type() === 'error' && problems.push(m.text()));
  await page.goto(base);
  return page;
};
const keys = page => page.evaluate(() => demoController.getSelected().map(x => x.selectionKey));
const tap = (page, sex, id) => page.click(`#${sex}-container [data-muscle-id="${id}"][data-selectable="true"]`);

try {
  // Selection modes
  const p = await open(1360, 900);
  await tap(p, 'male', 'lateral_deltoid');
  assert.deepEqual(await keys(p), ['right:lateral_deltoid'], 'one tap selects one side of one muscle');
  await p.click('.seg[data-key=sex] [data-v=female]');
  await p.click('.seg[data-key=mode] [data-v=multiple]');
  await tap(p, 'female', 'pectoralis_major');
  await tap(p, 'female', 'biceps_brachii');
  assert.equal((await keys(p)).length, 2, 'multiple mode keeps both muscles');
  await p.check('#bilateral');
  await tap(p, 'female', 'rectus_abdominis');
  assert.deepEqual(await keys(p), ['both:rectus_abdominis'], 'bilateral key');
  await p.keyboard.press('Escape');
  await p.focus('#female-container [data-muscle-id="trapezius"][data-selectable="true"]');
  await p.keyboard.press('Enter');
  assert.equal((await keys(p)).length, 1, 'Enter selects a focused region');
  await p.click('#clear');
  assert.equal((await keys(p)).length, 0, 'Clear empties the selection');

  // Heatmap: colours apply, selection and clearing still work, bad input throws
  const fillOf = (sel) => p.$eval(sel, e => getComputedStyle(e.querySelector('path')).fill);
  const del = '#female-container [data-muscle-id="lateral_deltoid"][data-selectable="true"]';
  const before = await fillOf(del);
  await p.check('#heat');
  const heated = await fillOf(del);
  assert.notEqual(heated, before, 'heatmap changes the fill');
  assert.equal(await p.isVisible('#legend'), true, 'legend shows');
  await p.evaluate(() => demoController.setColors({ lateral_deltoid: '#00ff00' }));
  assert.equal(await fillOf(del), 'rgb(0, 255, 0)', 'string colour is used as given');
  await p.evaluate(() => demoController.setSelected(['right:lateral_deltoid']));
  assert.match(await fillOf('#female-container [data-muscle-id="lateral_deltoid"][data-side="right"]'), /^rgb\(255, 107, 53\)/, 'selection beats heat');
  await p.evaluate(() => demoController.clear());
  assert.equal(await p.evaluate(() => { try { demoController.setColors({ nope: 1 }); return 'no throw'; } catch (e) { return e.name; } }), 'RangeError', 'unknown muscleId throws');
  assert.equal(await p.evaluate(() => { try { demoController.setColors({ biceps_brachii: NaN }); return 'no throw'; } catch (e) { return e.name; } }), 'TypeError', 'NaN throws');
  await p.uncheck('#heat');
  assert.equal(await fillOf(del), before, 'clearColors restores the artwork');

  // Hover label
  await p.hover(del);
  assert.match(await p.textContent('#tip'), /lateral deltoid/i, 'hover label names the muscle');

  // Guides, filter, theme
  await p.focus('#t-vanilla');
  await p.keyboard.press('ArrowRight');
  assert.equal(await p.evaluate(() => document.activeElement.id), 't-react', 'arrow key moves between tabs');
  await p.fill('#filter', 'hamstring');
  assert.equal(await p.locator('#table tbody tr:not([hidden])').count(), 2, 'ID table filter');
  await p.click('#theme');
  assert.ok(['dark', 'light'].includes(await p.evaluate(() => document.documentElement.dataset.theme)), 'theme toggle');

  // Agent guide is on the page and served as plain markdown
  assert.ok((await p.locator('#agents pre').nth(1).textContent()).includes('muscleId'), 'AGENTS.md is embedded on the page');
  const md = await p.request.get(base + 'AGENTS.md');
  assert.ok(md.ok() && (await md.text()).startsWith('# Integrating Open-Muscle-Map'), 'AGENTS.md is served');

  // The JavaScript guide must work exactly as written
  const snippet = await p.evaluate(() => document.querySelector('#p-vanilla pre').textContent);
  const q = await (await browser.newContext()).newPage();
  q.on('pageerror', e => problems.push('snippet: ' + e.message));
  await q.goto(base);
  await q.setContent('<!doctype html><body>' + snippet.replaceAll('./muscle-map/', base + 'muscle-map/'));
  await q.waitForFunction(() => document.querySelector('[data-selected="true"]'), null, { timeout: 5000 });

  // Phone layout in both themes: no horizontal scroll, even after a tap
  for (const scheme of ['light', 'dark']) {
    const m = await open(390, 844, scheme);
    await tap(m, 'male', 'trapezius');
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${scheme}: horizontal scroll on phone`);
  }
  assert.deepEqual(problems, [], 'console or page errors');
  console.log('OK: browser checks passed');
} finally {
  await browser.close();
  server.close();
}
