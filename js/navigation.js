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

    // Let GSAP cover the screen before anything changes (prevents flash)
    if (window.PRES && PRES.onSlideTransitionStart) {
      PRES.onSlideTransitionStart(outgoing, incoming);
    }

    // Update 3D immediately so the scene is ready
    if (PRES.update3DVisibility) {
      PRES.update3DVisibility(newIndex);
    }

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

      transitioning = false;
    }, 200);
  }

  // Zoom from a card rect into a slide (index → slide)
  function zoomToSlide(newIndex, cardRect) {
    if (transitioning) return;
    if (newIndex < 0 || newIndex >= totalSlides) return;
    transitioning = true;

    var outgoing = slides[currentIndex]; // the index slide
    var incoming = slides[newIndex];

    // Calculate transform to place the slide at the card's position
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scaleX = cardRect.width / vw;
    var scaleY = cardRect.height / vh;
    var scale = Math.max(scaleX, scaleY);
    var tx = cardRect.left + cardRect.width / 2 - vw / 2;
    var ty = cardRect.top + cardRect.height / 2 - vh / 2;

    // Set up the incoming slide at the card's position (no transition)
    incoming.classList.add('zoom-enter', 'zoom-no-stagger');
    incoming.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale.toFixed(4) + ')';

    // Set 3D visibility immediately so the right scene is ready
    if (PRES.update3DVisibility) {
      PRES.update3DVisibility(newIndex);
    }

    // Force reflow then animate to fullscreen
    incoming.offsetWidth;
    requestAnimationFrame(function() {
      incoming.classList.add('zoom-enter-active');

      // Fade out the index
      outgoing.style.transition = 'opacity 300ms ease';
      outgoing.style.opacity = '0';
      outgoing.classList.remove('active');
    });

    // Clean up after animation
    setTimeout(function() {
      incoming.classList.remove('zoom-enter', 'zoom-enter-active', 'zoom-no-stagger');
      incoming.style.transform = '';
      incoming.classList.add('active');
      outgoing.style.transition = '';
      outgoing.style.opacity = '';
      outgoing.classList.remove('exiting');

      currentIndex = newIndex;
      PRES.currentIndex = newIndex;
      updateUI();

      if (PRES.update3DVisibility) {
        PRES.update3DVisibility(newIndex);
      }

      transitioning = false;
    }, 750);
  }

  // Zoom from a slide back to the index, targeting a card rect
  function zoomToIndex(cardRect) {
    if (transitioning) return;
    transitioning = true;

    var outgoing = slides[currentIndex];
    var indexSlide = slides[1]; // the index

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scaleX = cardRect.width / vw;
    var scaleY = cardRect.height / vh;
    var scale = Math.max(scaleX, scaleY);
    var tx = cardRect.left + cardRect.width / 2 - vw / 2;
    var ty = cardRect.top + cardRect.height / 2 - vh / 2;

    // Show index behind (faded in)
    indexSlide.classList.add('zoom-reveal');
    indexSlide.style.opacity = '0';
    indexSlide.offsetWidth;
    indexSlide.style.opacity = '1';

    // Shrink current slide to card position
    outgoing.classList.remove('active');
    outgoing.classList.add('zoom-exit');
    outgoing.offsetWidth;
    outgoing.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale.toFixed(4) + ')';
    outgoing.style.opacity = '0.4';

    setTimeout(function() {
      outgoing.classList.remove('zoom-exit');
      outgoing.style.transform = '';
      outgoing.style.opacity = '';

      indexSlide.classList.remove('zoom-reveal');
      indexSlide.classList.add('active');

      currentIndex = 1;
      PRES.currentIndex = 1;
      updateUI();

      if (PRES.update3DVisibility) {
        PRES.update3DVisibility(1);
      }

      transitioning = false;
    }, 650);
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

    // Notify design editor of slide change
    document.dispatchEvent(new CustomEvent('slidechange', { detail: { index: currentIndex } }));

    // Lazy-load/unload splat viewer iframe for performance
    var splatIframe = document.getElementById('splatViewer');
    if (splatIframe) {
      var splatSlide = splatIframe.closest('.slide');
      var splatIndex = slides.indexOf(splatSlide);
      if (currentIndex === splatIndex) {
        // Load it when we arrive
        if (splatIframe.dataset.src && splatIframe.getAttribute('src') !== splatIframe.dataset.src) {
          splatIframe.src = splatIframe.dataset.src;
        }
        // Keep pointer-events off so iframe doesn't steal keyboard focus
        splatIframe.style.pointerEvents = 'none';
      } else {
        // Unload it to free GPU
        if (splatIframe.getAttribute('src')) {
          splatIframe.removeAttribute('src');
        }
        splatIframe.style.pointerEvents = 'none';
      }
    }
  }

  /* Keyboard navigation */
  document.addEventListener('keydown', function(e) {
    // Block all slide navigation when design editor is active
    if (document.body.classList.contains('de-active')) return;

    // On weather slide: don't intercept Space or ArrowDown/Up (let them scroll)
    var currentSlide = slides[currentIndex];
    if (currentSlide && currentSlide.classList.contains('slide-weather')) {
      if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        return;
      }
    }

    // On game slide: don't intercept Space (let it jump)
    if (currentSlide && currentSlide.classList.contains('slide-game')) {
      if (e.key === ' ') {
        return;
      }
    }

    // Blur any focused interactive element so arrows always navigate slides
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
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
  }, true);

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

  // Listen for arrow key messages from iframes
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'keydown') {
      if (e.data.key === 'ArrowRight' || e.data.key === 'ArrowDown') {
        next();
      } else if (e.data.key === 'ArrowLeft' || e.data.key === 'ArrowUp') {
        prev();
      }
    }
  });

  // Export to PRES
  PRES.slides = slides;
  PRES.currentIndex = currentIndex;
  PRES.totalSlides = totalSlides;
  PRES.goToSlide = goToSlide;
  PRES.zoomToSlide = zoomToSlide;
  PRES.zoomToIndex = zoomToIndex;
  PRES.next = next;
  PRES.prev = prev;
  PRES.init = init;
})();
