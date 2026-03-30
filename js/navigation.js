/**
 * navigation.js — Slide State Machine & Navigation
 *
 * Handles: slides array, currentIndex, goToSlide, next, prev,
 * updateUI, keyboard/touch event listeners, progress bar.
 *
 * Exports to PRES: slides, currentIndex, totalSlides, goToSlide,
 * next, prev, init
 *
 * Depends on (lazy): PRES.update3DVisibility, PRES.fetchWeather,
 * PRES.initThreeJS
 */
(function() {
  'use strict';

  var slides = Array.from(document.querySelectorAll('.slide'));
  var totalSlides = slides.length;
  var currentIndex = 0;
  var transitioning = false;

  // UI elements
  var slideNumberEl = document.getElementById('slideNumber');
  var nextTopicEl = document.getElementById('nextTopic');
  var progressBar = document.getElementById('progressBar');
  var navHint = document.getElementById('navHint');

  function goToSlide(newIndex) {
    if (transitioning) return;
    if (newIndex < 0 || newIndex >= totalSlides) return;
    if (newIndex === currentIndex) return;

    transitioning = true;

    var outgoing = slides[currentIndex];
    var incoming = slides[newIndex];

    outgoing.classList.add('exiting');
    outgoing.classList.remove('active');

    setTimeout(function() {
      outgoing.classList.remove('exiting');
    }, 600);

    setTimeout(function() {
      incoming.classList.add('active');
      currentIndex = newIndex;
      PRES.currentIndex = newIndex;
      updateUI();

      if (PRES.update3DVisibility) {
        PRES.update3DVisibility(newIndex);
      }

      transitioning = false;
    }, 200);
  }

  function next() {
    goToSlide(currentIndex + 1);
  }

  function prev() {
    goToSlide(currentIndex - 1);
  }

  function updateUI() {
    slideNumberEl.textContent = (currentIndex + 1) + ' / ' + totalSlides;

    if (currentIndex < totalSlides - 1) {
      var nextSlide = slides[currentIndex + 1];
      var nextBeat = nextSlide.getAttribute('data-beat');
      var nextTitle = nextSlide.getAttribute('data-title');
      var currentBeat = slides[currentIndex].getAttribute('data-beat');
      if (nextBeat !== currentBeat) {
        nextTopicEl.textContent = 'Next: ' + nextTitle;
      } else {
        nextTopicEl.textContent = '';
      }
    } else {
      nextTopicEl.textContent = '';
    }

    var progress = ((currentIndex + 1) / totalSlides) * 100;
    progressBar.style.width = progress + '%';

    // Lazy-load/unload splat viewer iframe for performance
    var splatIframe = document.getElementById('splatViewer');
    if (splatIframe) {
      var splatSlide = splatIframe.closest('.slide');
      var splatIndex = slides.indexOf(splatSlide);
      if (currentIndex === splatIndex) {
        // Load it
        if (!splatIframe.src && splatIframe.dataset.src) {
          splatIframe.src = splatIframe.dataset.src;
        }
        splatIframe.style.pointerEvents = 'auto';
      } else {
        // Unload it to free GPU
        if (splatIframe.src) {
          splatIframe.removeAttribute('src');
        }
        splatIframe.style.pointerEvents = 'none';
      }
    }
  }

  /* Keyboard navigation */
  document.addEventListener('keydown', function(e) {
    // On weather slide: don't intercept Space or ArrowDown/Up (let them scroll)
    var currentSlide = slides[currentIndex];
    if (currentSlide && currentSlide.classList.contains('slide-weather')) {
      if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        return;
      }
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        prev();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;
    }
  });

  // Touch/swipe support
  var touchStartX = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    var touchEndX = e.changedTouches[0].clientX;
    var diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  }, { passive: true });

  function init() {
    slides[0].classList.add('active');
    updateUI();

    setTimeout(function() {
      navHint.style.opacity = '0';
    }, 5000);

    // Non-blocking weather fetch
    if (PRES.fetchWeather) PRES.fetchWeather();

    // Initialize Three.js
    if (PRES.initThreeJS) PRES.initThreeJS();

    // Check if first slide has 3D
    if (PRES.update3DVisibility) PRES.update3DVisibility(0);
  }

  // Export to PRES
  PRES.slides = slides;
  PRES.currentIndex = currentIndex;
  PRES.totalSlides = totalSlides;
  PRES.goToSlide = goToSlide;
  PRES.next = next;
  PRES.prev = prev;
  PRES.init = init;
})();
