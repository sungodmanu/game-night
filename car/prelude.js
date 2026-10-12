/* Game Night car mode, part 1 (runs right after three.js, before the game creates its renderer).
   - caps devicePixelRatio (1 by default; lower if the adaptive step kicks in)
   - wraps THREE.WebGLRenderer: pixel-ratio cap, cheaper shadows, no MSAA on weak Tesla GPUs
   - quality: 'low' on a Tesla whose GPU is not AMD/NVIDIA (older Intel Atom MCU), else 'mid'
     overrides: ?q=low | ?q=mid | ?adaptive=0
   - adaptive: if the frame rate stays low, drop shadows, then render at 0.75 resolution */
(function () {
  'use strict';
  var CAR = window.__CAR = window.__CAR || {};
  var qs = location.search || '';
  var ua = navigator.userAgent || '';
  CAR.events = CAR.events || [];
  CAR.renderers = [];
  CAR.scenes = [];
  CAR.tesla = /Tesla/i.test(ua) || /[?&]car=tesla\b/.test(qs);
  CAR.realDpr = window.devicePixelRatio || 1;
  CAR.maxDpr = 1;
  CAR.adaptive = !/[?&]adaptive=0\b/.test(qs);
  CAR.gpu = '';
  var forced = (qs.match(/[?&]q=(low|mid)\b/) || [])[1];
  if (CAR.tesla && !forced) {
    try { // read the GPU name once from a throw-away context
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        CAR.gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
    } catch (e) { /* unknown GPU: treat as weak */ }
  }
  CAR.quality = forced || (CAR.tesla && !/AMD|Radeon|NVIDIA|GeForce/i.test(CAR.gpu) ? 'low' : 'mid');
  CAR.low = CAR.quality === 'low';
  CAR.shadowSize = CAR.low ? 512 : 1024;
  CAR.particleScale = (CAR.low || CAR.tesla) ? 0.5 : 1;
  function log(s) { CAR.events.push(s); }
  log('quality ' + CAR.quality + (CAR.gpu ? ' gpu=' + CAR.gpu : ''));

  try {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      get: function () { return Math.min(CAR.realDpr, CAR.maxDpr); }
    });
  } catch (e) { log('dpr override failed'); }

  if (!window.THREE || !THREE.WebGLRenderer) return;
  var Orig = THREE.WebGLRenderer;

  function tuneScene(scene) {
    if (CAR.scenes.indexOf(scene) >= 0) return;
    CAR.scenes.push(scene);
    scene.traverse(function (o) {
      if (o.isLight && o.castShadow && o.shadow && o.shadow.mapSize) {
        var s = Math.min(o.shadow.mapSize.x, CAR.shadowSize);
        o.shadow.mapSize.set(s, s);
        if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
      }
    });
    if (CAR.particleScale < 1) { // free-floating sprites added straight to the scene are particles: draw every other one
      var add = scene.add, n = 0;
      scene.add = function (o) {
        if (arguments.length === 1 && o && o.isSprite && o.visible !== false && (n++ % 2)) { o.userData.carSkipped = true; return this; }
        return add.apply(this, arguments);
      };
    }
  }

  function CarRenderer(params) {
    var p = {};
    for (var k in (params || {})) p[k] = params[k];
    if (CAR.low) p.antialias = false;
    var r = new Orig(p);
    var setPR = r.setPixelRatio;
    r.setPixelRatio = function (v) { return setPR.call(r, Math.min(v || 1, CAR.maxDpr)); };
    r.setPixelRatio(1);
    try { // PCF (not PCF-soft) shadows: same look, far fewer texture taps
      Object.defineProperty(r.shadowMap, 'type', { configurable: true, get: function () { return THREE.PCFShadowMap; }, set: function () {} });
    } catch (e) {}
    var render = r.render;
    r.render = function (scene, cam) {
      if (scene && scene.isScene && CAR.scenes.indexOf(scene) < 0) tuneScene(scene);
      return render.call(r, scene, cam);
    };
    CAR.renderers.push(r);
    return r;
  }
  CarRenderer.prototype = Orig.prototype;
  THREE.WebGLRenderer = CarRenderer;

  // ---- adaptive fallback for slow GPUs ------------------------------------------------------
  var frames = 0, t0 = 0, step = 0, slow = 0;
  CAR.fps = 0;
  function dropShadows() {
    var any = false;
    CAR.renderers.forEach(function (r) { if (r.shadowMap.enabled) { r.shadowMap.enabled = false; any = true; } });
    if (!any) return false;
    CAR.scenes.forEach(function (s) { s.traverse(function (o) {
      var m = o.material; if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach(function (mm) { mm.needsUpdate = true; });
    }); });
    log('adaptive: shadows off');
    return true;
  }
  function lowerRes() {
    if (CAR.maxDpr <= 0.75) return false;
    CAR.maxDpr = 0.75;
    CAR.renderers.forEach(function (r) { r.setPixelRatio(1); });
    window.dispatchEvent(new Event('resize'));
    log('adaptive: resolution 0.75');
    return true;
  }
  CAR.degrade = function () { return dropShadows() || lowerRes(); };
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) { t0 = 0; return; }
    if (!t0) { t0 = now; frames = 0; return; }
    frames++;
    if (now - t0 >= 2000) {
      CAR.fps = Math.round(frames * 1000 / (now - t0));
      t0 = now; frames = 0; step++;
      if (!CAR.adaptive || step < 3) return; // let the scene warm up first
      slow = CAR.fps < 24 ? slow + 1 : 0;
      if (slow >= 2) { slow = 0; CAR.degrade(); }
    }
  }
  requestAnimationFrame(tick);
})();
