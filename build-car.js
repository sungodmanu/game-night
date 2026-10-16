#!/usr/bin/env node
// build-car.js - builds the car-friendly copies of every game into this folder.
//
//   node build-car.js
//
// Inputs (never modified):
//   - each game's built, offline index.html (paths below; override with env vars)
//   - the Muggle Studies app files (fetched from its private repo into the private folder)
//   - codenames.json (in this repo): the two code names shown on the public site
//   - <private>/realnames.json (NOT in this repo): the real names the build must replace
// The private folder defaults to ../car-games-private (override with CAR_PRIVATE=/path).
//
// What it does per game: copy -> replace real names with the code names (identifiers, keys, text,
// comments; whole-word/identifier forms only) -> inject the car-mode layer -> verify that no real
// name survives anywhere in the output.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PRIVATE = path.resolve(process.env.CAR_PRIVATE || path.join(ROOT, '..', 'car-games-private'));
const SRC = {
  flytrap: process.env.FLYTRAP_SRC || path.join(ROOT, '..', 'venus-flytrap-3d', 'index.html'),
  fort: process.env.FORT_SRC || path.join(ROOT, '..', 'snowball-fort', 'index.html'),
  hogwarts: process.env.HOGWARTS_SRC || path.join(ROOT, '..', 'battle-for-hogwarts', 'release-v2', 'index.html'),
  snap: process.env.SNAP_SRC || path.join(ROOT, '..', 'venus-flytrap', 'index.html'),
  // built with the public code names (cheetah-run: node build.js --public)
  cheetah: process.env.CHEETAH_SRC || path.join(ROOT, '..', 'cheetah-run', 'release-v1', 'index-public.html'),
  muggle: process.env.MUGGLE_SRC || path.join(PRIVATE, 'muggle-studies')
};
const read = (p) => fs.readFileSync(p, 'utf8');
const carFile = (p) => read(path.join(ROOT, 'car', p));
function fail(msg) { console.error('build-car: ' + msg); process.exit(1); }

// ---------- names ---------------------------------------------------------------------------------
const SLOTS = ['older', 'younger'];
const RESERVED = new Set(('break case catch class const continue debugger default delete do else export extends false finally for ' +
  'function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static ' +
  'await enum implements package protected interface private public undefined NaN Infinity arguments eval window document').split(' '));

function loadJson(p, what) {
  try { return JSON.parse(read(p)); } catch (e) { fail('cannot read ' + what + ' at ' + p + ' (' + e.message + ')'); }
}
const code = loadJson(path.join(ROOT, 'codenames.json'), 'codenames.json');
const real = loadJson(path.join(PRIVATE, 'realnames.json'), 'the private realnames.json');
const NAMES = SLOTS.map((slot) => {
  const c = String(code[slot] || '').trim(), r = String(real[slot] || '').trim();
  if (!/^[A-Za-z][A-Za-z0-9 '\-]{0,19}$/.test(c)) fail(`codenames.json "${slot}" must be 1-20 chars: letters, digits, spaces, ' or - (starting with a letter). Got: ${JSON.stringify(c)}`);
  if (!/^[A-Za-z]{2,}$/.test(r)) fail(`realnames.json "${slot}" must be a plain word`);
  const ident = c.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!/^[a-z][a-z0-9]*$/.test(ident) || RESERVED.has(ident)) fail(`code name ${JSON.stringify(c)} gives an unusable identifier "${ident}"`);
  return { slot, code: c, codeUpper: c.toUpperCase(), ident, identUpper: ident.toUpperCase(), real: r,
    realLower: r.toLowerCase(), realUpper: r.toUpperCase(), realCap: r[0].toUpperCase() + r.slice(1).toLowerCase() };
});
if (NAMES[0].ident === NAMES[1].ident) fail('the two code names must differ (after removing spaces/punctuation)');
const realRe = new RegExp(NAMES.map((n) => n.real).join('|'), 'i');

// Text outside data: URIs (base64 blobs are never edited or scanned for words).
function mapOutsideDataUris(s, fn) {
  return s.split(/(data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+)/i).map((part, i) => (i % 2 ? part : fn(part))).join('');
}
function textOnly(s) { return mapOutsideDataUris(s, (t) => t).replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, ''); }

// Replace every real-name form with the code-name form. Only whole tokens: a name glued to other
// letters (e.g. inside a longer word) is not touched, and the final check then fails the build.
//   'REALNAME' / "Realname" (whole string literal)  -> display string ("CODENAME" / "Codename")
//   'realname'               (whole string literal)  -> identifier string ("codename")
//   realname                 (identifier / key / class) -> codename
//   REALNAME_ORIGIN          (constant prefix)       -> CODENAME_ORIGIN
//   Realname / REALNAME      (prose, comments)       -> Codename / CODENAME
function applyNames(text, label, counts) {
  return mapOutsideDataUris(text, (t) => {
    for (const n of NAMES) {
      const B = '(?<![A-Za-z0-9$])', A = '(?![A-Za-z0-9$])';
      const rules = [
        [new RegExp(`(['"])${n.realUpper}\\1`, 'g'), (m, q) => JSON.stringify(n.codeUpper)],
        [new RegExp(`(['"])${n.realCap}\\1`, 'g'), (m, q) => JSON.stringify(n.code)],
        [new RegExp(`(['"])${n.realLower}\\1`, 'g'), (m, q) => q + n.ident + q],
        [new RegExp(`${B}${n.realUpper}(?=_)`, 'g'), () => n.identUpper],
        [new RegExp(`${B}${n.realLower}${A}`, 'g'), () => n.ident],
        [new RegExp(`${B}${n.realCap}(?![a-z0-9$])`, 'g'), () => n.code],
        [new RegExp(`${B}${n.realUpper}(?![A-Za-z0-9$])`, 'g'), () => n.codeUpper]
      ];
      for (const [re, fn] of rules) t = t.replace(re, (...a) => { counts[n.slot] = (counts[n.slot] || 0) + 1; return fn(...a); });
    }
    return t;
  });
}
// The code-name identifiers must not already exist in a file that gets names replaced.
function checkCollisions(text, label, skipBiggestScript) {
  let t = textOnly(text);
  if (skipBiggestScript) { // three.js is inlined as the largest <script>; its own words don't matter
    let best = null;
    t.replace(/<script>([\s\S]*?)<\/script>/g, (m, body, off) => { if (!best || body.length > best.len) best = { off, len: m.length }; return m; });
    if (best) t = t.slice(0, best.off) + t.slice(best.off + best.len);
  }
  for (const n of NAMES) {
    for (const id of [n.ident, n.identUpper]) {
      if (new RegExp(`(?<![A-Za-z0-9$_])${id}(?![A-Za-z0-9$])`).test(t)) fail(`${label}: the identifier "${id}" (from code name ${JSON.stringify(n.code)}) already exists in the source; pick another code name`);
    }
  }
}

// ---------- car-mode layer ------------------------------------------------------------------------
function noScriptClose(name, s) { if (/<\/script/i.test(s)) fail(name + ' contains </script'); return s; }
function tailBlock(game) {
  const css = carFile('core.css') + '\n' + carFile('games/' + game + '.css');
  const js = 'window.__CAR_GAME = ' + JSON.stringify(game) + ';\n' + carFile('core.js') + '\n' + carFile('games/' + game + '.js');
  return '\n<!-- Game Night car mode -->\n<style id="car-mode-css">\n' + css + '</style>\n<script id="car-mode-js">\n' + noScriptClose(game, js) + '</script>\n';
}
function preludeBlock() { return '<script id="car-mode-prelude">\n' + noScriptClose('prelude', carFile('prelude.js')) + '</script>\n'; }
function injectTail(html, game) {
  const i = html.lastIndexOf('</body>');
  if (i < 0) fail(game + ': no </body>');
  return html.slice(0, i) + tailBlock(game) + html.slice(i);
}
// The prelude goes right before the game's own script (the last <script> before the tail), i.e. after
// the inlined three.js, so THREE exists but the game has not created its renderer yet.
function injectPrelude(html, game) {
  const i = html.lastIndexOf('<script>');
  if (i < 0 || !/THREE/.test(html.slice(0, i))) fail(game + ': could not find the game script after three.js');
  return html.slice(0, i) + preludeBlock() + html.slice(i);
}

const ICON_LINK = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%230e121b%27/%3E%3Ccircle cx=%2732%27 cy=%2732%27 r=%2718%27 fill=%27%23ffd77a%27/%3E%3Ccircle cx=%2740%27 cy=%2726%27 r=%2716%27 fill=%27%230e121b%27/%3E%3C/svg%3E">';
// ---------- games ---------------------------------------------------------------------------------
const GAMES = [
  { id: 'flytrap', dir: 'flytrap', src: SRC.flytrap, webgl: true },
  { id: 'snowball-fort', dir: 'snowball-fort', src: SRC.fort, webgl: true },
  { id: 'hogwarts', dir: 'hogwarts', src: SRC.hogwarts, webgl: true },
  { id: 'snap-and-sip', dir: 'snap-and-sip', src: SRC.snap, webgl: false },
  { id: 'cheetah', dir: 'cheetah', src: SRC.cheetah, webgl: true }
];
const report = [];
const outputs = [];
function write(rel, data) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  outputs.push(rel);
}

for (const g of GAMES) {
  if (!fs.existsSync(g.src)) fail(`${g.id}: source not found at ${g.src}`);
  let html = read(g.src);
  const counts = {};
  if (realRe.test(textOnly(html))) checkCollisions(html, g.id, g.webgl);
  html = applyNames(html, g.id, counts);
  if (g.webgl) html = injectPrelude(html, g.id);
  html = injectTail(html, g.id);
  // a tiny inline icon, so the browser never asks the server for /favicon.ico (a 404 outside the site)
  if (!/rel=["'](?:shortcut )?icon["']/i.test(html)) html = html.replace(/<head>/i, '<head>\n' + ICON_LINK);
  write(g.dir + '/index.html', html);
  report.push({ game: g.id, bytes: Buffer.byteLength(html), replaced: counts });
}

// Muggle Studies: a small multi-file app.
{
  const m = SRC.muggle;
  const need = ['index.html', 'app.js', 'data.js', 'styles.css', 'manifest.webmanifest', 'sw.js',
    'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
  for (const f of need) if (!fs.existsSync(path.join(m, f))) fail('muggle-studies: missing ' + path.join(m, f));
  const counts = {};
  const files = {};
  for (const f of ['app.js', 'data.js', 'styles.css', 'manifest.webmanifest']) {
    let s = read(path.join(m, f));
    if (realRe.test(s)) { checkCollisions(s, 'muggle-studies/' + f, false); s = applyNames(s, f, counts); }
    files[f] = s;
  }
  let index = read(path.join(m, 'index.html'));
  index = applyNames(index, 'index.html', counts);
  files['index.html'] = injectTail(index, 'muggle-studies');
  for (const f of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) files[f] = fs.readFileSync(path.join(m, f));
  // Service worker: same relative asset list (scope = /muggle-studies/ wherever the site lives), but
  // network-first so an updated site is picked up right away, with the cache as the offline fallback.
  const hash = crypto.createHash('sha256');
  for (const f of Object.keys(files).sort()) hash.update(f).update(files[f]);
  const version = hash.digest('hex').slice(0, 10);
  files['sw.js'] = `// Muggle Studies service worker (car build). Scope: this folder. Network first, cache as offline fallback.
const CACHE = 'muggle-studies-car-${version}';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './data.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(() => {}));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('muggle-studies') && k !== CACHE)
    .map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (!req.url.startsWith(self.registration.scope)) return;
  event.respondWith(fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))));
});
`;
  for (const f of Object.keys(files)) write('muggle-studies/' + f, files[f]);
  report.push({ game: 'muggle-studies', bytes: Object.values(files).reduce((a, b) => a + Buffer.byteLength(b), 0), replaced: counts });
}

// ---------- verification over everything this repo publishes -----------------------------------------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_screens'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const problems = [];
for (const p of walk(ROOT)) {
  const rel = path.relative(ROOT, p);
  if (realRe.test(rel)) problems.push('real name in file name: ' + rel);
  if (/\.(png|jpg|ico)$/i.test(p)) continue;
  const s = read(p);
  if (realRe.test(textOnly(s))) {
    const m = textOnly(s).match(new RegExp('.{0,30}(' + realRe.source + ').{0,30}', 'i'));
    problems.push('real name left in ' + rel + ': ' + JSON.stringify(m && m[0]));
  }
  if (/\.(html|js|css|webmanifest)$/.test(p) && /(?:src|href)\s*=\s*["']\s*(?:https?:)?\/\//i.test(s)) problems.push('absolute/external URL in ' + rel);
  if (/\.(html|css)$/.test(p) && /url\(\s*["']?\s*(?:https?:)?\/\//i.test(s)) problems.push('external url() in ' + rel);
  if (/\.(html)$/.test(p) && /(?:src|href)\s*=\s*["']\/(?!\/)/i.test(s)) problems.push('root-absolute path in ' + rel + ' (breaks under a project-pages subpath)');
}
if (problems.length) { console.error(problems.join('\n')); fail('verification failed'); }

const kb = (b) => (b / 1024).toFixed(0) + ' KB';
for (const r of report) {
  const rep = NAMES.map((n) => `${n.code}:${r.replaced[n.slot] || 0}`).join(' ');
  console.log(`built ${r.game.padEnd(15)} ${kb(r.bytes).padStart(8)}   name replacements ${rep}`);
}
console.log(`code names: older=${JSON.stringify(NAMES[0].code)} (id ${NAMES[0].ident}), younger=${JSON.stringify(NAMES[1].code)} (id ${NAMES[1].ident})`);
console.log('verified: no real names, no external URLs, all paths relative');
