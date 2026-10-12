/* Snap & Sip - car mode */
(function () {
  'use strict';
  var CAR = window.__CAR;
  var KEY = 'snap-and-sip-v1';
  CAR.ready(function () {
    var header = document.querySelector('header');
    if (header) CAR.backButton('inflow', header, header.firstChild); else CAR.backButton('tl');
  });
  // "Start over": a big in-page question instead of window.confirm, and it really clears the save
  // (the original sets a fresh state and reloads without saving it, so the old plants come back).
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#reset');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (document.querySelector('.car-ask')) return;
    var ask = document.createElement('div');
    ask.className = 'car-ask';
    ask.innerHTML = '<div class="box" role="dialog" aria-modal="true"><p>Start both plants over?<br>Their story will be forgotten.</p>' +
      '<div class="row"><button type="button" class="danger" data-car="yes">Start over</button><button type="button" class="good" data-car="no">Keep them</button></div></div>';
    ask.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-car]');
      if (!t && ev.target !== ask) return;
      ev.stopPropagation();
      if (t && t.getAttribute('data-car') === 'yes') {
        try { localStorage.removeItem(KEY); } catch (err) {}
        location.reload();
        return;
      }
      ask.remove();
    });
    document.body.appendChild(ask);
  }, true);
})();
