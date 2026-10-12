/* Snowball Fort Together - car mode. Runs before the game boots (the game waits for DOMContentLoaded). */
(function () {
  'use strict';
  var CAR = window.__CAR, SF = window.SF;
  if (!SF || !SF.config) return;
  SF.config.maxDpr = 1;
  // a wider divider so the 64px mute and the back button fit inside it
  SF.config.layout.dividerMin = 88;
  SF.config.layout.dividerMax = 88;
  // fewer confetti / snow-puff particles on the car
  if (CAR.particleScale < 1 && SF.fx && SF.fx.create) {
    var create = SF.fx.create;
    SF.fx.create = function (scene) {
      var fx = create.apply(this, arguments);
      ['confetti', 'sparkle', 'puff'].forEach(function (k) {
        var f = fx[k]; if (typeof f !== 'function') return;
        fx[k] = function (p, count) {
          var a = Array.prototype.slice.call(arguments);
          a[1] = Math.max(1, Math.round((count || 1) * CAR.particleScale));
          return f.apply(fx, a);
        };
      });
      return fx;
    };
  }
  CAR.ready(function () {
    var dv = document.querySelector('.divider');
    if (dv) CAR.backButton('inflow', dv); else CAR.backButton('bl');
  });
})();
