/**
 * scaler.js — Presentation Scale-to-Fit
 *
 * Locks the slide canvas to a 1920×1080 design surface and uses
 * CSS transform scale to fit any viewport, maintaining 16:9 perfectly.
 *
 * When the design editor is active (body.de-active), the available area
 * shrinks to account for left/right panels and bottom toolbar.
 */
(function () {
  'use strict';

  var DESIGN_W = 1920;
  var DESIGN_H = 1080;
  var container = document.getElementById('slidesContainer');

  // Editor panel dimensions (must match css/design-editor.css)
  var DE_LEFT  = 264;
  var DE_RIGHT = 288;
  var DE_BOTTOM = 48;
  var DE_PAD = 24; // breathing room on each side

  function scalePresentation() {
    if (!container) return;

    var editorOn = document.body.classList.contains('de-active');

    var availW, availH, originX, originY;

    if (editorOn) {
      // Stage area = viewport minus panels
      var stageW = window.innerWidth - DE_LEFT - DE_RIGHT;
      var stageH = window.innerHeight - DE_BOTTOM;

      availW = stageW - DE_PAD * 2;
      availH = stageH - DE_PAD * 2;

      var scale = Math.min(availW / DESIGN_W, availH / DESIGN_H);

      // Center the scaled slide within the stage area
      originX = DE_LEFT + Math.round((stageW - DESIGN_W * scale) / 2);
      originY = Math.round((stageH - DESIGN_H * scale) / 2);

      container.style.transform = 'translate(' + originX + 'px,' + originY + 'px) scale(' + scale + ')';
    } else {
      var scale2 = Math.min(
        window.innerWidth  / DESIGN_W,
        window.innerHeight / DESIGN_H
      );
      var x = Math.round((window.innerWidth  - DESIGN_W * scale2) / 2);
      var y = Math.round((window.innerHeight - DESIGN_H * scale2) / 2);
      container.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale2 + ')';
    }

    container.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
  }

  scalePresentation();
  window.addEventListener('resize', scalePresentation);

  // Expose for design editor to trigger rescale
  window.PRES = window.PRES || {};
  window.PRES.rescale = scalePresentation;
})();
