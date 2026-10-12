/* Battle for Hogwarts v2 - car mode. Runs before the game boots (the game waits for DOMContentLoaded). */
(function () {
  'use strict';
  var CAR = window.__CAR, BH = window.BH;
  if (!BH || !BH.config) return;
  BH.config.maxDpr = 1;
  // fewer sparkle / smoke particles on the car
  if (CAR.particleScale < 1 && BH.fx) {
    var s = CAR.particleScale, fx = BH.fx;
    var scaleArg = function (name, idx, dflt) {
      var f = fx[name]; if (typeof f !== 'function') return;
      fx[name] = function () {
        var a = Array.prototype.slice.call(arguments);
        a[idx] = Math.max(1, Math.round((a[idx] || dflt) * s));
        return f.apply(fx, a);
      };
    };
    scaleArg('sparkle', 2, 24); scaleArg('burst', 2, 30); scaleArg('darkSmoke', 1, 3);
    ['glow', 'smoke'].forEach(function (name) {
      var f = fx[name]; if (typeof f !== 'function') return;
      fx[name] = function (o) {
        if (o && o.count > 1) { var c = {}; for (var k in o) c[k] = o[k]; c.count = Math.max(1, Math.round(o.count * s)); o = c; }
        return f.call(fx, o);
      };
    });
  }
  CAR.ready(function () {
    var bar = document.querySelector('.topbar');
    if (bar) CAR.backButton('inflow', bar, bar.firstChild); else CAR.backButton('tl');
  });
})();
