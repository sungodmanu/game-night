/* Cheetah Cub Dash - car mode. Renderer, DPR and shadow/particle tuning happen in the prelude. */
(function () {
  'use strict';
  var CAR = window.__CAR;
  CAR.ready(function () { CAR.backButton('tl'); });
  CAR.beforeLeave = function () { try { if (window.CC && CC.flow) CC.flow.autosave(); } catch (e) {} };
})();
