/**
 * gsap-enhance.js — GSAP-powered slide animation system
 *
 * Systems:
 *   1. Physics stagger — replaces CSS revealUp on all slides
 *   2. Perm-card toss  — Wide & Deep (slide-permutations)
 *   3. Case Study toss — handled in casestudy.js (inter-generation only)
 *   4. Iris background — 3D circle in the Three.js scene that scales up,
 *      changing the canvas background color from behind the planets.
 *
 * Adds `gsap-on` to <html> so transitions.css can suppress its own keyframe.
 */
(function() {
  'use strict';

  if (typeof window.gsap === 'undefined') {
    console.warn('[gsap-enhance] GSAP not loaded; falling back to CSS animations.');
    return;
  }

  document.documentElement.classList.add('gsap-on');
  var gsap = window.gsap;

  /** Single source of truth for a slide's background color. */
  function getSlideBackground(slide) {
    return slide.dataset.bg || '#0f0d0b';
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  1. Physics stagger entrance (all slides)
  // ─────────────────────────────────────────────────────────────────────────

  function animateSlide(slide) {
    var fadeEls = slide.querySelectorAll(
      '.fade-in, .fade-in-1, .fade-in-2, .fade-in-3, .fade-in-4, .fade-in-5, .fade-in-6'
    );
    if (!fadeEls.length) return;

    var groups = [[], [], [], [], [], [], []];
    fadeEls.forEach(function(el) {
      var idx = 0;
      for (var n = 1; n <= 6; n++) {
        if (el.classList.contains('fade-in-' + n)) { idx = n; break; }
      }
      groups[idx].push(el);
    });

    gsap.set(fadeEls, { opacity: 0, y: 30, filter: 'blur(4px)' });
    var tl = gsap.timeline();
    groups.forEach(function(group, idx) {
      if (!group.length) return;
      tl.to(group, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.75, ease: 'back.out(1.4)', stagger: 0.04
      }, idx * 0.09);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  2. Perm-card toss — Wide & Deep
  // ─────────────────────────────────────────────────────────────────────────

  function setupPermToss() {
    var stage = document.getElementById('permStage');
    if (!stage) return;

    var tossedCards = new WeakSet();
    var cardIndex = 0;

    var permObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          var el = m.target;
          if (el.classList.contains('perm-card') &&
              el.classList.contains('perm-card--in') &&
              !tossedCards.has(el)) {
            tossedCards.add(el);
            var i = cardIndex++;
            gsap.fromTo(el,
              { x: -220, y: 40 + Math.random() * 20, rotation: -18 + Math.random() * 8, opacity: 0 },
              {
                x: 0, y: 0, rotation: 0, opacity: 1,
                duration: 0.65, ease: 'power3.out',
                delay: i * 0.045,
                clearProps: 'x,y,rotation,opacity'
              }
            );
          }
        }
        if (m.type === 'childList' && m.removedNodes.length) {
          cardIndex = 0;
        }
      });
    });

    permObserver.observe(stage, {
      subtree: true, attributes: true,
      attributeFilter: ['class'], childList: true
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  3. Iris background — in-scene 3D circle
  //
  //  Creates a flat circle mesh deep in the scene (z = -50), behind the
  //  planets. GSAP scales it from nearly-zero to viewport-filling. The old
  //  setClearColor stays visible around it while it grows. On completion,
  //  setClearColor snaps to the new color and the mesh is removed.
  //
  //  Result: the canvas background color changes via an expanding circle,
  //  with planets always in front and text always above.
  // ─────────────────────────────────────────────────────────────────────────

  var activeIrisMesh = null;

  function playIris(incoming) {
    var scene = PRES.scene;
    var renderer = PRES.renderer;
    if (!scene || !renderer || typeof THREE === 'undefined') return;

    var newColor = getSlideBackground(incoming);

    // Kill any in-progress iris
    if (activeIrisMesh) {
      gsap.killTweensOf(activeIrisMesh.scale);
      scene.remove(activeIrisMesh);
      activeIrisMesh.geometry.dispose();
      activeIrisMesh.material.dispose();
      activeIrisMesh = null;
    }

    PRES._irisActive = true;

    var circle = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(newColor),
        depthWrite: false,
        depthTest: false
      })
    );
    circle.renderOrder = -1;
    circle.position.set(0, 0, -50);
    circle.scale.set(0.001, 0.001, 1);
    scene.add(circle);
    activeIrisMesh = circle;

    gsap.to(circle.scale, {
      x: 500, y: 500,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: function() {
        renderer.setClearColor(new THREE.Color(newColor), 1);
        scene.remove(circle);
        circle.geometry.dispose();
        circle.material.dispose();
        if (activeIrisMesh === circle) activeIrisMesh = null;
        PRES._irisActive = false;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Navigation hook — fires synchronously at frame 0, before slide swap
  // ─────────────────────────────────────────────────────────────────────────

  window.PRES = window.PRES || {};

  PRES.onSlideTransitionStart = function(outgoing, incoming) {
    if (incoming.dataset.bgTransition === 'iris') {
      playIris(incoming);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Activation handler — fires when incoming slide gets .active class
  // ─────────────────────────────────────────────────────────────────────────

  function handleActivation(slide) {
    animateSlide(slide);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Slide class watcher
  // ─────────────────────────────────────────────────────────────────────────

  var slideObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.type !== 'attributes' || m.attributeName !== 'class') return;
      var slide = m.target;
      if (!slide.classList || !slide.classList.contains('slide')) return;
      if (slide.classList.contains('active')) {
        handleActivation(slide);
      }
    });
  });

  function start() {
    document.querySelectorAll('.slide').forEach(function(s) {
      slideObserver.observe(s, { attributes: true, attributeFilter: ['class'] });
    });

    setupPermToss();

    var initial = document.querySelector('.slide.active');
    if (initial) {
      requestAnimationFrame(function() { animateSlide(initial); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

