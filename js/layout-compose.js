/**
 * layout-compose.js — Interactive layout composition demo for slide 13
 *
 * Click anywhere (or press C) while on the layout slide to trigger:
 *   text snaps left, camera pans right so planets cluster visually right.
 */
(function() {
  'use strict';

  var composed = false;

  function getSlide() {
    return document.querySelector('[data-interactive="layout-compose"]');
  }

  function activateCompose() {
    if (composed) return;
    var slide = getSlide();
    if (!slide || !slide.classList.contains('active')) return;
    composed = true;
    slide.classList.add('composed');
    PRES.layoutComposeActive = true;
    if (PRES.composePlanets) PRES.composePlanets();

    var hint = document.getElementById('layoutComposeHint');
    if (hint) hint.style.opacity = '0';
    var label = document.getElementById('layoutComposeLabel');
    if (label) label.style.opacity = '1';
  }

  function resetCompose() {
    if (!composed) return;
    composed = false;
    PRES.layoutComposeActive = false;
    var slide = getSlide();
    if (slide) slide.classList.remove('composed');
    if (PRES.deComposePlanets) PRES.deComposePlanets();
    var hint = document.getElementById('layoutComposeHint');
    if (hint) hint.style.opacity = '1';
    var label = document.getElementById('layoutComposeLabel');
    if (label) label.style.opacity = '0';
  }

  PRES.resetLayoutCompose = resetCompose;

  // Canvas absorbs pointer events in space mode — attach directly (no DOMContentLoaded needed,
  // scripts at bottom of body run after DOM is parsed)
  var canvas = document.getElementById('three-canvas');
  if (canvas) {
    canvas.addEventListener('click', function() {
      if (PRES.current3DMode === 'space') activateCompose();
    });
  }

  // Also catch clicks on the slide section itself
  document.addEventListener('click', function(e) {
    if (e.target.closest('#design-editor')) return;
    if (e.target.closest('[data-interactive="layout-compose"]')) activateCompose();
  });

  // 'C' key — no conditions, just fire if there's a compose slide
  document.addEventListener('keydown', function(e) {
    if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
      var t = document.getElementById('layoutComposeText');
      if (!t || t._composed) return;
      t._composed = true;
      t.style.left = '5%';
      t.style.transform = 'translateY(-50%)';
      t.style.textAlign = 'left';
      var hint = document.getElementById('layoutComposeHint');
      if (hint) hint.style.opacity = '0';
      var label = document.getElementById('layoutComposeLabel');
      if (label) label.style.opacity = '1';
      if (window.PRES) PRES.layoutComposeActive = true;
    }
  });

}());
