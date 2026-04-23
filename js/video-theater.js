/**
 * video-theater.js — Video Sync, Ambilight, Auto-Play/Pause
 *
 * Handles: video sync (play/pause/seek), ambilight canvas renderer,
 * auto-play/pause via MutationObserver.
 *
 * No exports to PRES. Self-contained.
 */
(function() {
  'use strict';

  var main = document.getElementById('bretVideo');
  var reflection = document.getElementById('bretVideoReflection');
  var ambCanvas = document.getElementById('ambilightCanvas');
  if (!main) return;

  // Sync reflection with main video
  if (reflection) {
    main.addEventListener('timeupdate', function() {
      if (Math.abs(reflection.currentTime - main.currentTime) > 0.3) {
        reflection.currentTime = main.currentTime;
      }
    });
    main.addEventListener('play', function() {
      reflection.currentTime = main.currentTime;
      reflection.play().catch(function(){});
    });
    main.addEventListener('pause', function() { reflection.pause(); });
    main.addEventListener('seeked', function() { reflection.currentTime = main.currentTime; });
  }

  // Ambilight — sample video edges and project blurred color glow
  var ambCtx = ambCanvas ? ambCanvas.getContext('2d', { willReadFrequently: true }) : null;
  var samplerCanvas = document.createElement('canvas');
  samplerCanvas.width = 8;
  samplerCanvas.height = 6;
  var samplerCtx = samplerCanvas.getContext('2d', { willReadFrequently: true });

  function updateAmbilight() {
    requestAnimationFrame(updateAmbilight);
    if (!ambCanvas || !ambCtx || main.paused || main.ended) return;

    var slide = main.closest('.slide');
    if (!slide || !slide.classList.contains('active')) return;

    try {
      samplerCtx.drawImage(main, 0, 0, 8, 6);
    } catch(e) { return; }

    var w = ambCanvas.parentElement.offsetWidth;
    var h = ambCanvas.parentElement.offsetHeight;
    if (ambCanvas.width !== w || ambCanvas.height !== h) {
      ambCanvas.width = w;
      ambCanvas.height = h;
    }
    ambCtx.drawImage(samplerCanvas, 0, 0, 8, 6, 0, 0, w, h);
  }
  updateAmbilight();

  // Pause video when leaving slide — user clicks play manually
  var videoSlide = main.closest('.slide');
  if (videoSlide) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class') {
          if (!videoSlide.classList.contains('active')) {
            main.pause();
          }
        }
      });
    });
    observer.observe(videoSlide, { attributes: true });
  }
})();
