/**
 * scaler.js — Presentation Scale-to-Fit
 *
 * Locks the slide canvas to a 1920×1080 design surface and uses
 * CSS transform scale to fit any viewport, maintaining 16:9 perfectly.
 * Handles everything: rem, px, inline styles, SVGs — all scale as one unit.
 *
 * Loaded at end of <body> so DOM is guaranteed ready on first call.
 */
(function () {
  'use strict';

  var DESIGN_W = 1920;
  var DESIGN_H = 1080;
  var container = document.getElementById('slidesContainer');

  function scalePresentation() {
    if (!container) return;
    var scale = Math.min(
      window.innerWidth  / DESIGN_W,
      window.innerHeight / DESIGN_H
    );
    var x = Math.round((window.innerWidth  - DESIGN_W * scale) / 2);
    var y = Math.round((window.innerHeight - DESIGN_H * scale) / 2);
    container.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  }

  scalePresentation();
  window.addEventListener('resize', scalePresentation);
})();
