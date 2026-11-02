// Smoke-test menu + every game: loads with no console errors; start UI visible.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 Tesla/2026.32';
const VIEWPORTS = [
  { name: 'tesla', width: 1180, height: 600 },
  { name: 'phone', width: 390, height: 844 },
];

const GAMES = [
  'flytrap', 'snowball-fort', 'hogwarts', 'cheetah', 'snap-and-sip', 'muggle-studies',
  'ninja-parkour', 'map-makers', 'diwali-games', 'not-a-robot', 'spooky-merge',
  'rocket-mail', 'f1-champs', 'pizza-rush', 'dragon-keeper', 'dino-dig',
  'diwali-lotus', 'build-a-bot', 'build-a-bot-mini',
];

const freePort = () => new Promise((res) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});
const PORT = await freePort();
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${PORT}/`;
for (let i = 0; i < 50; i++) {
  try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
}

const exe = process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const browser = await chromium.launch({
  headless: true, executablePath: exe,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const results = [];
function log(ok, name, extra) {
  results.push({ ok, name, extra });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + JSON.stringify(extra) : ''));
}

async function smoke(rel, vp) {
  const label = rel + '@' + vp.name;
  const ctx = await browser.newContext({ viewport: vp, userAgent: UA, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    const resp = await page.goto(BASE + rel, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!resp || !resp.ok()) {
      log(false, label, { status: resp && resp.status() });
      await ctx.close();
      return;
    }
    await page.waitForTimeout(1200);
    const rendered = await page.evaluate(() => {
      const body = document.body;
      if (!body) return { ok: false, why: 'no body' };
      const text = (body.innerText || '').replace(/\s+/g, ' ').trim();
      const canvas = document.querySelector('canvas');
      const btn = document.querySelector('button, a.card, #car-back, [role=button]');
      const hasPaint = !!(canvas || text.length > 8 || btn);
      return {
        ok: hasPaint,
        title: document.title || '',
        textLen: text.length,
        hasCanvas: !!canvas,
        hasBtn: !!btn,
        sample: text.slice(0, 80),
      };
    });
    const filtered = errors.filter((e) => !/favicon/i.test(e));
    if (filtered.length) log(false, label, { errors: filtered.slice(0, 5), rendered });
    else if (!rendered.ok) log(false, label, { rendered });
    else log(true, label, { title: rendered.title, sample: rendered.sample });
  } catch (e) {
    log(false, label, { error: String(e) });
  }
  await ctx.close();
}

await smoke('', VIEWPORTS[0]);
for (const g of GAMES) {
  for (const vp of VIEWPORTS) await smoke(g + '/', vp);
}

await browser.close();
server.kill('SIGTERM');
const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' passed');
if (failed.length) {
  console.log('FAILED:');
  for (const f of failed) console.log(' -', f.name, f.extra);
  process.exit(1);
}
