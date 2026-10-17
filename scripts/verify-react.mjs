// Runs the React guide (site/code/react.jsx) in a temp Vite project, as a production build and under the dev server
// (the dev server does not convert local CommonJS, which is what broke the old default import), and taps a muscle in Chromium.
// Needs network for npm and `playwright`. Locally: PLAYWRIGHT_PATH=<playwright/index.mjs> CHROMIUM_PATH=<chromium> node scripts/verify-react.mjs
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const repo = fileURLToPath(new URL('../', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'omm-react-'));
const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
mkdirSync(join(dir, 'src/muscle-map'), { recursive: true });
for (const f of ['muscle-map.js', 'male-muscle-map.svg']) copyFileSync(join(repo, 'muscle-map', f), join(dir, 'src/muscle-map', f));
copyFileSync(join(repo, 'site/code/react.jsx'), join(dir, 'src/BodyMap.jsx'));
writeFileSync(join(dir, 'package.json'), '{"private":true,"type":"module"}');
writeFileSync(join(dir, 'vite.config.js'), "export default { esbuild: { jsx: 'automatic' } };");
writeFileSync(join(dir, 'index.html'), '<link rel="icon" href="data:,"><div id="root"></div><script type="module" src="/src/main.jsx"></script>');
// StrictMode runs the effect twice, which is why the guide destroys the controller on cleanup.
writeFileSync(join(dir, 'src/main.jsx'),
  "import { StrictMode } from 'react';import { createRoot } from 'react-dom/client';import BodyMap from './BodyMap.jsx';\n" +
  "createRoot(document.getElementById('root')).render(<StrictMode><BodyMap onSelect={r => { window.last = r; }} /></StrictMode>);");
run('npm', ['install', '--no-audit', '--no-fund', 'vite', 'react', 'react-dom']);
run('npx', ['vite', 'build']);

const dist = join(dir, 'dist/');
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const file = join(dist, req.url.split('?')[0].replace(/\/$/, '/index.html'));
  if (!file.startsWith(dist) || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
}).listen(0);
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
async function check(url, label) {
  const problems = [];
  const page = await browser.newPage();
  page.on('pageerror', e => problems.push(e.message));
  page.on('console', m => m.type() === 'error' && problems.push(m.text()));
  await page.goto(url);
  await page.click('[data-muscle-id="lateral_deltoid"][data-selectable="true"]', { timeout: 15000 })
    .catch(e => assert.fail(`${label}: ${problems.join('; ') || e.message}`));
  const last = await page.evaluate(() => window.last);
  assert.equal(last?.muscleId, 'lateral_deltoid', `${label}: tap reaches onSelect through the React guide`);
  assert.equal(last.selected, true);
  assert.deepEqual(problems, [], `${label}: no console errors`);
  await page.close();
}
let dev;
try {
  await check(`http://localhost:${server.address().port}/`, 'production build');
  assert.equal(await fetch('http://localhost:5199/').then(() => true, () => false), false, 'port 5199 is already in use');
  // Run vite's entry directly (not through npx) so dev.kill() stops the server itself.
  dev = spawn(process.execPath, [join(dir, 'node_modules/vite/bin/vite.js'), '--port', '5199', '--strictPort'], { cwd: dir, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { if (await fetch('http://localhost:5199/').then(r => r.ok, () => false)) break; await new Promise(r => setTimeout(r, 500)); }
  await check('http://localhost:5199/', 'dev server');
  console.log('OK: React guide builds with Vite, runs under the dev server and selects a muscle');
} finally { dev?.kill(); await browser.close(); server.close(); }
