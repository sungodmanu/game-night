// Game Night - end-to-end checks for the car builds.
// Serves the repo root with `python3 -m http.server` on 127.0.0.1, drives headless Chrome with the
// Tesla UA at 1180x600 and 770x600 (touch enabled), and checks: menu + every card, boot with zero
// console errors and zero non-same-origin requests, the back button, >= 64px tap targets, nothing
// covering the back button, saves persisting across reloads, Snowball Fort play, and no real names in
// the DOM or storage. Screenshots: ../_screens/ (gitignored).
//   node run.mjs            all checks        CHROME=/path/to/chrome   use another Chrome
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENS = path.join(ROOT, '_screens');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 Tesla/2026.32';
const VIEWPORTS = [{ width: 1180, height: 600 }, { width: 770, height: 600 }];
const MIN_TAP = 64;

// The real names are never written in this repo; they are read from the private folder next to it.
let REAL = null;
try {
  const r = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'car-games-private', 'realnames.json'), 'utf8'));
  REAL = new RegExp('(' + [r.older, r.younger].filter(Boolean).join('|') + ')', 'i');
} catch (e) { /* no private folder: the name check is skipped */ }
const CODE = JSON.parse(fs.readFileSync(path.join(ROOT, 'codenames.json'), 'utf8'));

const results = [];
function check(name, ok, extra) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !ok ? '  ' + JSON.stringify(extra) : ''));
}

// ---------- static server ----------
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORT = await freePort();
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${PORT}/`;
for (let i = 0; i < 50; i++) { try { await fetch(BASE); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }

const exe = process.env.CHROME || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const browser = await chromium.launch({ headless: true, executablePath: exe,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

// ---------- games ----------
const GAMES = [
  { id: 'flytrap', key: 'snappy-flytrap-3d-v1', ready: () => !!(window.__game && window.__CAR && window.__game.fps), fixed: true },
  { id: 'snowball-fort', key: 'snowball-fort-together-v1', ready: () => !!(window.__game && window.__game.frames && window.__game.frames() > 3), fixed: true },
  { id: 'hogwarts', key: 'battle-for-hogwarts-v1', ready: () => !!(window.__game && window.__game.frames && window.__game.frames() > 3), fixed: true },
  { id: 'cheetah', key: 'cheetah-run:', keyPrefix: true, ready: () => !!(window.__game && window.__game.frames && window.__game.frames() > 3 && window.__CAR), fixed: true },
  { id: 'snap-and-sip', key: 'snap-and-sip-v1', ready: () => document.querySelectorAll('#plants .card').length === 2, fixed: false },
  { id: 'muggle-studies', key: 'muggle-studies-state-v1', ready: () => !!(window.muggleStudies && document.querySelector('#app button')), fixed: false }
];

async function newPage(vp) {
  const ctx = await browser.newContext({ viewport: vp, userAgent: UA, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const log = { errors: [], external: [] };
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('pageerror', (e) => log.errors.push(String(e)));
  ctx.on('request', (req) => { const u = req.url(); if (!u.startsWith(BASE) && !/^(data|blob|about):/.test(u)) log.external.push(u); });
  return { ctx, page, log };
}
const settle = (page, ms = 400) => page.waitForTimeout(ms);
async function boot(page, g) {
  await page.waitForFunction(g.ready, null, { timeout: 45000 });
  await settle(page, 800);
}

// interactive elements that are smaller than MIN_TAP, cut off (fixed-layout games), or covering the back button
async function audit(page, fixed) {
  return page.evaluate(([MIN, fixed]) => {
    const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
      for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; }
      return getComputedStyle(el).pointerEvents !== 'none'; };
    const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + [...el.classList].join('.')) + ' "' + (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 20) + '"';
    const inScroller = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e);
      if ((/(auto|scroll)/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 1) || (/(auto|scroll)/.test(c.overflowX) && e.scrollWidth > e.clientWidth + 1)) return true; } return false; };
    const els = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [data-act]')].filter(vis);
    const small = [], cut = [];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width < MIN - 0.5 || r.height < MIN - 0.5) small.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (fixed && !inScroller(el) && (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5)) cut.push(name(el));
    }
    const back = document.getElementById('car-back');
    let covered = 'no back button';
    if (back) {
      const r = back.getBoundingClientRect(); covered = null;
      for (const [fx, fy] of [[0.5, 0.5], [0.15, 0.5], [0.85, 0.5], [0.5, 0.2], [0.5, 0.8]]) {
        const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
        if (!hit || !back.contains(hit)) { covered = hit ? name(hit) : 'nothing'; break; }
      }
      const br = back.getBoundingClientRect();
      for (const el of els) { if (back.contains(el) || el.contains(back)) continue; const q = el.getBoundingClientRect();
        if (q.left < br.right && q.right > br.left && q.top < br.bottom && q.bottom > br.top) { covered = covered || 'overlaps ' + name(el); } }
      if (br.width < MIN - 0.5 || br.height < MIN - 0.5) small.push('#car-back ' + br.width + 'x' + br.height);
    }
    return { small, cut, covered, count: els.length };
  }, [MIN_TAP, fixed]);
}
async function auditCheck(page, label, fixed, modal) {
  const a = await audit(page, fixed);
  check(`${label}: ${a.count} tap targets all >= ${MIN_TAP}px`, a.small.length === 0, a.small);
  if (fixed) check(`${label}: nothing cut off`, a.cut.length === 0, a.cut);
  if (!modal) check(`${label}: back button visible and uncovered`, a.covered === null, a.covered);
}
async function noNames(page, label) {
  if (!REAL) return;
  const hit = await page.evaluate((src) => { const re = new RegExp(src, 'i'); const s = document.documentElement.outerHTML + JSON.stringify({ ...localStorage }) + document.title; const m = s.match(re); return m ? m[0] : null; }, REAL.source);
  check(`${label}: no real names in DOM/storage`, hit === null, hit);
}
async function shot(page, name) { fs.mkdirSync(SCREENS, { recursive: true }); await page.screenshot({ path: path.join(SCREENS, name + '.png') }); }

// ---------- per-game state walks (for tap-target audits) and save tests ----------
const STATES = {
  'flytrap': [
    ['namer open', async (p) => { await p.locator('.tag').first().tap(); await p.waitForSelector('#nm-ok', { state: 'visible' }); },
     async (p) => { await p.tap('#nm-x'); await settle(p); }],
    ['two plants grown', async (p) => { await p.evaluate(() => window.__game.setEaten(40)); await settle(p, 1200); }]
  ],
  'snowball-fort': [
    ['boss', async (p) => { await p.evaluate(() => { window.__game.setAutoSpawn(false); window.__game.setMeter(9); window.__game.spawn(1, 0, -8); }); await settle(p, 1500); }]
  ],
  'hogwarts': [
    ['picker', async (p) => { await p.evaluate(() => window.__game.start({ path: 'picker' })); await settle(p); }],
    ['years', async (p) => { await p.evaluate(() => { window.__game.start({ hero: 'harry', path: 'years', years: [1] }); window.__game.advance(3); }); await settle(p); }],
    ['duel', async (p) => { await p.evaluate(() => { window.__game.start({ hero: 'harry', path: 'duel' }); window.__game.advance(3); }); await settle(p); }],
    ['lord', async (p) => { await p.evaluate(() => { window.__game.start({ hero: 'voldemort', path: 'lord' }); window.__game.advance(3); }); await settle(p); }],
    ['hunt', async (p) => { await p.evaluate(() => { window.__game.start({ hero: 'harry', path: 'hunt' }); window.__game.advance(3); }); await settle(p); }]
  ],
  'cheetah': [
    ['start', async (p) => { await p.locator('.pcard[data-id=p1]').tap(); await settle(p, 800); }],
    ['editor', async (p) => { await p.locator('#b-edit').tap(); await settle(p, 800); }, async (p) => { await p.locator('#b-done').tap(); await settle(p); }],
    ['race setup', async (p) => { await p.locator('#b-race').tap(); await settle(p); }, async (p) => { await p.locator('#b-race-x').tap(); await settle(p); }],
    ['leaderboard', async (p) => { await p.locator('#b-board').tap(); await settle(p); }, async (p) => { await p.locator('#b-board-x').tap(); await settle(p); }],
    ['running', async (p) => { await p.locator('#b-play').tap(); await p.evaluate(() => { __game.pause(); __game.auto(); __game.advance(8); __game.pause(false); }); await settle(p, 800); }]
  ],
  'snap-and-sip': [
    ['start-over dialog', async (p) => { await p.tap('#reset'); await p.waitForSelector('.car-ask', { state: 'visible' }); },
     async (p) => { await p.locator('.car-ask button').filter({ hasText: /keep|no|cancel/i }).first().tap(); await settle(p); }, true]
  ],
  'muggle-studies': [
    ['home', async (p) => { await p.tap('[data-act=pick][data-id=alpha]'); await settle(p); }],
    ['levels', async (p) => { await p.locator('[data-act=subject]').first().tap(); await settle(p); }],
    ['question', async (p) => { await p.locator('[data-act=level]').first().tap(); await settle(p); }],
    ['reveal', async (p) => { await p.locator('[data-act=choice]').first().tap(); await settle(p); }]
  ]
};

async function reload(page, g) { await page.reload({ waitUntil: 'load' }); await boot(page, g); }
const SAVES = {
  async 'flytrap'(page, g) {
    await page.evaluate(() => window.__game.setEaten(7));
    await page.locator('.tag').first().tap();
    await page.fill('#nm-input', 'Chompers');
    await page.tap('#nm-ok');
    await page.tap('#mute');
    await settle(page);
    const before = await page.evaluate(() => window.__game.getState());
    await reload(page, g);
    const after = await page.evaluate(() => window.__game.getState());
    return { ok: after.eaten === 7 && after.names[0] === 'Chompers' && after.muted === before.muted && before.muted === true, before: { e: before.eaten, n: before.names[0], m: before.muted }, after: { e: after.eaten, n: after.names[0], m: after.muted } };
  },
  async 'snowball-fort'(page, g) {
    await page.tap('.mute');
    await settle(page);
    const before = await page.evaluate(() => window.__game.state().muted);
    await reload(page, g);
    const after = await page.evaluate(() => window.__game.state().muted);
    return { ok: before === true && after === true, before, after };
  },
  async 'hogwarts'(page, g) {
    await page.evaluate(() => window.__game.start({ hero: 'voldemort', path: 'title' }));
    await page.tap('.mute');
    await settle(page);
    const before = await page.evaluate(() => ({ muted: window.__game.state().muted, raw: localStorage.getItem('battle-for-hogwarts-v1') }));
    await reload(page, g);
    const after = await page.evaluate(() => ({ muted: window.__game.state().muted, hero: JSON.parse(localStorage.getItem('battle-for-hogwarts-v1') || '{}').hero }));
    return { ok: before.muted === true && after.muted === true && after.hero === 'voldemort', before: before.muted, after };
  },
  async 'cheetah'(page, g) {
    await page.locator('.pcard[data-id=p1]').tap();
    await page.locator('#b-edit').tap(); await page.locator('#s-edit [data-v=Dash]').tap(); await page.locator('#s-edit [data-v=glow]').tap(); await page.locator('#b-done').tap();
    await page.locator('#b-play').tap();
    await page.evaluate(() => { __game.pause(); __game.auto(); __game.advance(15); __game.autosave(); });
    const before = await page.evaluate(() => __game.profile('p1'));
    await reload(page, g);
    const after = await page.evaluate(() => __game.profile('p1'));
    const shown = await page.evaluate(() => document.body.innerText);
    return { ok: after.cubName === 'Dash' && after.fur === 'glow' && !!after.run && Math.abs(after.run.dist - before.run.dist) < 2,
      before: { n: before.cubName, d: before.run && before.run.dist }, after: { n: after.cubName, d: after.run && after.run.dist }, codeNamesShown: shown.includes(CODE.older) && shown.includes(CODE.younger) };
  },
  async 'snap-and-sip'(page, g) {
    const name = page.locator('input.name').nth(1);
    await name.fill('Snappy Jr');
    await name.dispatchEvent('change');
    await page.locator('[data-act=distilled][data-i="0"]').tap();
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('snap-and-sip-v1')).plants.map(p => [p.name, Math.round(p.water)]));
    await reload(page, g);
    const after = await page.evaluate(() => [...document.querySelectorAll('input.name')].map(i => i.value));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('snap-and-sip-v1')).plants.map(p => [p.name, Math.round(p.water)]));
    return { ok: after[1] === 'Snappy Jr' && stored[0][1] === before[0][1], before, after, stored };
  },
  async 'muggle-studies'(page, g) {
    await page.tap('[data-act=pick][data-id=beta]');
    await page.locator('[data-act=subject]').first().tap();
    await page.locator('[data-act=level]').first().tap();
    await page.locator('[data-act=choice]').first().tap();
    await settle(page);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('muggle-studies-state-v1') || 'null'));
    await reload(page, g);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('muggle-studies-state-v1') || 'null'));
    const shown = await page.evaluate(() => document.body.innerText);
    const ids = after ? Object.keys(after.profiles) : [];
    return { ok: !!before && before.history.length >= 1 && !!after && after.history.length === before.history.length,
      history: after && after.history.length, profiles: ids, codeNamesShown: shown.includes(CODE.older) && shown.includes(CODE.younger) };
  }
};

// ---------- Snowball Fort play (real pointer events) ----------
async function fortPlay(page) {
  const G = (f, a) => page.evaluate(f, a);
  await G(() => { window.__game.setAutoSpawn(false); window.__game.clearSnowmen(); });
  for (let i = 0; i < 3; i++) { const p = await G(() => window.__game.screenOf('pile')); await page.mouse.click(p.x, p.y); await page.waitForTimeout(160); }
  let ok = true;
  try { await page.waitForFunction(() => window.__game.state().thrower.received >= 1, null, { timeout: 20000 }); } catch (e) { ok = false; }
  check('fort play: 3 taps on the pile roll a ball across to the thrower', ok, await G(() => window.__game.state().thrower));
  if (!ok) await G(() => window.__game.give(1));
  await page.waitForFunction(() => window.__game.state().thrower.pouch > 0, null, { timeout: 20000 });
  await G(() => { window.__game.spawn(1, 0, -8); window.__game.setSpeed(null, 0); });
  await page.waitForTimeout(700);
  const p = await G(() => window.__game.screenOf('pouch'));
  const v = await G(() => window.__game.aimFor(0, -8));
  await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(p.x + v.x * i / 6, p.y + v.y * i / 6);
  await page.waitForTimeout(60); await page.mouse.up();
  let hit = true;
  try { await page.waitForFunction(() => window.__game.state().poofs >= 1 && window.__game.state().confetti > 0, null, { timeout: 15000 }); } catch (e) { hit = false; }
  const s = await G(() => window.__game.state());
  check('fort play: slingshot hit poofs the snowman (confetti, meter up)', hit && s.confetti > 0 && s.meter > 0, { poofs: s.poofs, confetti: s.confetti, meter: s.meter });
  check('fort: renderer pixel ratio capped at 1', s.dpr === 1, s.dpr);
}

// ---------- run ----------
try {
  for (const vp of VIEWPORTS) {
    const W = vp.width, tag = `[${W}x${vp.height}]`;
    console.log(`\n=== ${tag} ===`);
    // menu
    {
      const { ctx, page, log } = await newPage(vp);
      await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 600);
      const m = await page.evaluate(() => ({ title: document.title, cards: [...document.querySelectorAll('a.card')].map(a => { const r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), w: r.width, h: r.height, right: r.right, bottom: r.bottom }; }),
        parked: document.body.innerText.includes('Plays while parked.'), sw: document.documentElement.scrollWidth }));
      check(`${tag} menu: title "Game Night"`, m.title === 'Game Night', m.title);
      check(`${tag} menu: six cards with relative links`, m.cards.length === 6 && m.cards.every(c => /^[a-z-]+\/$/.test(c.href)), m.cards.map(c => c.href));
      check(`${tag} menu: "Plays while parked." note`, m.parked);
      check(`${tag} menu: cards are big (>= 64px) and nothing overflows sideways`, m.cards.every(c => c.w >= 64 && c.h >= 64 && c.right <= W + 0.5) && m.sw <= W, m.cards);
      if (W === 1180) await shot(page, 'menu'); else await shot(page, 'menu-770');
      await noNames(page, `${tag} menu`);
      check(`${tag} menu: zero console errors`, log.errors.length === 0, log.errors);
      check(`${tag} menu: zero external requests`, log.external.length === 0, log.external);
      await ctx.close();
    }

    for (const g of GAMES) {
      const { ctx, page, log } = await newPage(vp);
      const L = `${tag} ${g.id}`;
      // navigate from the menu card (a real tap)
      await page.goto(BASE, { waitUntil: 'load' }); await settle(page, 300);
      await Promise.all([page.waitForURL(BASE + g.id + '/', { timeout: 15000 }), page.locator(`a.card[href="${g.id}/"]`).tap()]);
      check(`${L}: menu card navigates to ${g.id}/`, page.url() === BASE + g.id + '/', page.url());
      await boot(page, g);
      const info = await page.evaluate(() => ({ car: document.documentElement.classList.contains('car-mode'), tesla: document.documentElement.classList.contains('car-tesla'), dpr: window.devicePixelRatio, q: window.__CAR && window.__CAR.quality }));
      check(`${L}: boots in car mode (Tesla UA detected, DPR <= 1)`, info.car && info.tesla && info.dpr <= 1, info);
      await auditCheck(page, `${L} start`, g.fixed);
      if (W === 1180) await shot(page, g.id); else await shot(page, g.id + '-770');
      for (const [sname, enter, leave, modal] of STATES[g.id] || []) {
        await enter(page);
        await auditCheck(page, `${L} ${sname}`, g.fixed, modal);
        await shot(page, `${g.id}-${sname.replace(/\W+/g, '-')}${W === 1180 ? '' : '-770'}`);
        if (leave) await leave(page);
      }
      await noNames(page, L);
      // back button: a real tap returns to the menu
      await page.reload({ waitUntil: 'load' }); await boot(page, g);
      await Promise.all([page.waitForURL(BASE, { timeout: 15000 }), page.locator('#car-back').tap()]);
      check(`${L}: "← Games" returns to the menu`, page.url() === BASE && (await page.title()) === 'Game Night', page.url());
      // saves
      await page.goto(BASE + g.id + '/', { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'load' }); await boot(page, g);
      const sv = await SAVES[g.id](page, g);
      check(`${L}: save persists across reload`, sv.ok, sv);
      const keys = await page.evaluate(() => Object.keys(localStorage));
      if (g.keyPrefix) check(`${L}: saves only under its own keys "${g.key}*"`, keys.length >= 1 && keys.every(k => k.startsWith(g.key)), keys);
      else check(`${L}: saves only under its own key "${g.key}"`, keys.length === 1 && keys[0] === g.key, keys);
      if (g.id === 'cheetah') check(`${L}: profiles show the code names`, sv.codeNamesShown, sv);
      if (g.id === 'muggle-studies') check(`${L}: profiles use the code names`, sv.profiles.join() === [CODE.older, CODE.younger].map(n => n.toLowerCase().replace(/[^a-z0-9]/g, '')).join() && sv.codeNamesShown, sv);
      if (g.id === 'snowball-fort') {
        await page.reload({ waitUntil: 'load' }); await boot(page, g);
        const names = await page.evaluate(() => [...document.querySelectorAll('.tag')].map(t => t.textContent.trim()));
        check(`${L}: player tags show the code names`, names.includes(CODE.older.toUpperCase()) || names.includes(CODE.older), names);
        await fortPlay(page);
      }
      await noNames(page, L + ' after play');
      check(`${L}: zero console errors`, log.errors.length === 0, log.errors);
      check(`${L}: zero external requests`, log.external.length === 0, log.external);
      await ctx.close();
    }
  }
} catch (e) {
  check('test run finished without an exception', false, String(e && e.stack || e));
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter(r => !r.ok);
console.log(`\nRESULT: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.log('FAILED:\n  ' + failed.map(f => f.name).join('\n  ')); process.exitCode = 1; }
console.log('Screenshots: ' + SCREENS);
