/* Game Night car mode, part 2 (shared): back button + helpers. window.__CAR_GAME is set by the build. */
(function () {
  'use strict';
  var CAR = window.__CAR = window.__CAR || {};
  CAR.game = window.__CAR_GAME || '';
  CAR.events = CAR.events || [];
  if (CAR.tesla === undefined) CAR.tesla = /Tesla/i.test(navigator.userAgent || '') || /[?&]car=tesla\b/.test(location.search);
  var root = document.documentElement;
  root.classList.add('car-mode', 'car-' + CAR.game);
  if (CAR.tesla) root.classList.add('car-tesla');

  CAR.leave = function () {
    if (CAR.leaving) return;
    CAR.leaving = true;
    try { if (CAR.beforeLeave) CAR.beforeLeave(); } catch (e) {}
    location.href = '../';
  };

  // The big "<- Games" button. Navigation is done on pointerup as well as click, because some games
  // lock the page down (preventDefault on touches) which can swallow the synthetic click.
  CAR.backButton = function (cls, parent, before) {
    var a = document.createElement('a');
    a.href = '../';
    a.id = 'car-back';
    a.className = 'car-back ' + (cls || 'tl');
    a.setAttribute('aria-label', 'Back to the games menu');
    a.innerHTML = '<span class="car-back-arrow" aria-hidden="true">\u2190</span><span class="car-back-label">Games</span>';
    var downId = null;
    a.addEventListener('pointerdown', function (e) { downId = e.pointerId; a.classList.add('down'); e.stopPropagation(); });
    a.addEventListener('pointerup', function (e) {
      a.classList.remove('down');
      if (downId === e.pointerId) { e.preventDefault(); e.stopPropagation(); CAR.leave(); }
      downId = null;
    });
    a.addEventListener('pointercancel', function () { downId = null; a.classList.remove('down'); });
    a.addEventListener('pointerleave', function () { a.classList.remove('down'); });
    a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); CAR.leave(); });
    ['touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(function (t) { a.addEventListener(t, function (e) { e.stopPropagation(); }); });
    parent = parent || document.body;
    if (before) parent.insertBefore(a, before); else parent.appendChild(a);
    CAR.back = a;
    return a;
  };

  CAR.ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };
})();
