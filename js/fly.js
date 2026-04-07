// fly.js — A little fly lives on the title slide. It runs from your cursor.
(function () {
  'use strict';

  var FLY_W = 36, FLY_H = 32;
  var SCARE_DIST = 115;       // cursor radius (px) that spooks the fly
  var ESC_DIST_MIN = 190;     // minimum escape jump distance
  var ESC_DIST_MAX = 300;     // maximum escape jump distance
  var EDGE_PAD = 44;          // keep fly this far from slide edges

  // Landing spots as % of slide width/height — biased toward title text area
  var SPOTS = [
    { x: 13, y: 73 }, // near "Vibe Design" text
    { x: 34, y: 79 }, // near "& The Dynamic"
    { x: 20, y: 88 }, // near "Nick McVey"
    { x:  9, y: 67 }, // left margin
    { x: 52, y: 58 }, // middle of slide
    { x: 72, y: 44 }, // upper right
    { x: 78, y: 72 }, // right side
    { x: 44, y: 24 }, // upper area
    { x: 27, y: 46 }, // mid-left
    { x: 63, y: 85 }, // lower right
    { x: 31, y: 30 }, // upper-middle-left
    { x: 84, y: 30 }, // upper right corner
    { x: 55, y: 78 }, // lower middle
    { x: 18, y: 52 }, // left-center
  ];

  var s = {
    el: null, slideEl: null,
    x: 0, y: 0,       // current center (px, slide-relative)
    tx: 0, ty: 0,     // target center
    rot: 0,           // current rotation (deg, 0 = facing up)
    isFlying: false,
    escaping: false,
    active: false,
    rafId: null,
    landTimer: null,
    buzzPhase: 0,
    lastSpotIdx: -1,
  };

  // ── SVG fly (top-down view, head at top) ──────────────────────────────
  function buildFlyHTML() {
    return '<svg viewBox="0 0 36 32" width="36" height="32"' +
      ' xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block;">' +
      // Abdomen
      '<ellipse cx="18" cy="23" rx="5.2" ry="8.5" fill="#161616"/>' +
      '<line x1="12.8" y1="18.5" x2="23.2" y2="18.5" stroke="#2c2c2c" stroke-width="1.1"/>' +
      '<line x1="12.8" y1="22.5" x2="23.2" y2="22.5" stroke="#2c2c2c" stroke-width="1.1"/>' +
      '<line x1="12.8" y1="26.5" x2="23.2" y2="26.5" stroke="#2c2c2c" stroke-width="1.1"/>' +
      // Thorax
      '<ellipse cx="18" cy="14.5" rx="6.2" ry="5" fill="#0e0e0e"/>' +
      // Wings — animated via CSS classes
      '<ellipse class="fly-wing-l" cx="7" cy="12" rx="9.5" ry="4.5" fill="rgba(210,235,255,0.52)"/>' +
      '<ellipse class="fly-wing-r" cx="29" cy="12" rx="9.5" ry="4.5" fill="rgba(210,235,255,0.52)"/>' +
      // Head
      '<circle cx="18" cy="7" r="5" fill="#0e0e0e"/>' +
      // Compound eyes
      '<ellipse cx="13.5" cy="5.5" rx="2.4" ry="2.8" fill="#7a1515"/>' +
      '<ellipse cx="22.5" cy="5.5" rx="2.4" ry="2.8" fill="#7a1515"/>' +
      '<circle cx="12.8" cy="4.7" r="0.7" fill="rgba(255,255,255,0.28)"/>' +
      '<circle cx="21.8" cy="4.7" r="0.7" fill="rgba(255,255,255,0.28)"/>' +
      // Legs (3 per side)
      '<line x1="11.5" y1="13" x2="1"  y2="17" stroke="#1c1c1c" stroke-width="0.9"/>' +
      '<line x1="11.5" y1="15" x2="1"  y2="21" stroke="#1c1c1c" stroke-width="0.9"/>' +
      '<line x1="11.5" y1="17" x2="3"  y2="25" stroke="#1c1c1c" stroke-width="0.9"/>' +
      '<line x1="24.5" y1="13" x2="35" y2="17" stroke="#1c1c1c" stroke-width="0.9"/>' +
      '<line x1="24.5" y1="15" x2="35" y2="21" stroke="#1c1c1c" stroke-width="0.9"/>' +
      '<line x1="24.5" y1="17" x2="33" y2="25" stroke="#1c1c1c" stroke-width="0.9"/>' +
      '</svg>';
  }

  // ── CSS injection ─────────────────────────────────────────────────────
  function injectCSS() {
    var style = document.createElement('style');
    style.textContent =
      '#pres-fly{position:absolute;width:36px;height:32px;' +
        'pointer-events:none;z-index:300;will-change:transform;}' +
      '.fly-wing-l{transform-box:fill-box;transform-origin:right center;}' +
      '.fly-wing-r{transform-box:fill-box;transform-origin:left center;}' +
      '@keyframes fly-flap-l{0%,100%{transform:scaleY(1);opacity:.55}50%{transform:scaleY(.07);opacity:.72}}' +
      '@keyframes fly-flap-r{0%,100%{transform:scaleY(1);opacity:.55}50%{transform:scaleY(.07);opacity:.72}}' +
      '@keyframes fly-idle-l{0%,100%{transform:scaleY(1);opacity:.5}50%{transform:scaleY(.6);opacity:.42}}' +
      '@keyframes fly-idle-r{0%,100%{transform:scaleY(1);opacity:.5}50%{transform:scaleY(.6);opacity:.42}}';
    document.head.appendChild(style);
  }

  // ── Wing helpers ──────────────────────────────────────────────────────
  function setFlapping(flying) {
    var wl = s.el.querySelector('.fly-wing-l');
    var wr = s.el.querySelector('.fly-wing-r');
    if (!wl || !wr) return;
    if (flying) {
      wl.style.animation = 'fly-flap-l 0.07s linear infinite';
      wr.style.animation = 'fly-flap-r 0.07s linear infinite 0.035s';
    } else {
      wl.style.animation = 'fly-idle-l 0.6s ease-in-out infinite';
      wr.style.animation = 'fly-idle-r 0.6s ease-in-out infinite 0.3s';
    }
  }

  // ── Math ──────────────────────────────────────────────────────────────
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerpAngle(a, b, t) {
    var d = b - a;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return a + d * t;
  }

  // ── Spot selection ────────────────────────────────────────────────────
  function pickSpot(avoidPx) {
    var idx, pt, tries = 0;
    do {
      idx = Math.floor(Math.random() * SPOTS.length);
      pt = { x: SPOTS[idx].x / 100 * 1920, y: SPOTS[idx].y / 100 * 1080 };
      tries++;
    } while (tries < 20 && (
      idx === s.lastSpotIdx ||
      (avoidPx && Math.hypot(pt.x - avoidPx.x, pt.y - avoidPx.y) < 140)
    ));
    s.lastSpotIdx = idx;
    return pt;
  }

  // ── Landing cycle ──────────────────────────────────────────────────────
  function scheduleLanding() {
    if (!s.active) return;
    var spot = pickSpot(null);
    clearTimeout(s.landTimer);
    s.landTimer = setTimeout(function () {
      if (!s.active) return;
      s.tx = spot.x; s.ty = spot.y;
      s.isFlying = true; s.escaping = false;
      setFlapping(true);
      s.landTimer = setTimeout(scheduleLanding, 2200 + Math.random() * 3800);
    }, 300 + Math.random() * 700);
  }

  // ── Scare logic ────────────────────────────────────────────────────────
  function scareAway(cx, cy) {
    var dx = s.x - cx, dy = s.y - cy;
    var len = Math.hypot(dx, dy) || 1;
    var dist = ESC_DIST_MIN + Math.random() * (ESC_DIST_MAX - ESC_DIST_MIN);
    var nx = s.x + (dx / len) * dist;
    var ny = s.y + (dy / len) * dist;
    nx = clamp(nx, EDGE_PAD, 1920 - EDGE_PAD);
    ny = clamp(ny, EDGE_PAD, 1080 - EDGE_PAD);
    // If clamping put the escape point near the cursor, use a preset spot instead
    if (Math.hypot(cx - nx, cy - ny) < SCARE_DIST * 1.3) {
      var alt = pickSpot({ x: cx, y: cy });
      nx = alt.x; ny = alt.y;
    }
    s.tx = nx; s.ty = ny;
    s.isFlying = true; s.escaping = true;
    setFlapping(true);
    clearTimeout(s.landTimer);
    s.landTimer = setTimeout(scheduleLanding, 1000 + Math.random() * 1800);
  }

  // ── Render loop ────────────────────────────────────────────────────────
  function tick() {
    if (!s.active) { s.rafId = null; return; }
    s.rafId = requestAnimationFrame(tick);
    var dx = s.tx - s.x, dy = s.ty - s.y;
    var dist = Math.hypot(dx, dy);
    if (dist > 0.8) {
      var speed = s.escaping ? 0.3 : 0.1;
      s.x += dx * speed;
      s.y += dy * speed;
      // Perpendicular wobble for natural buzzing flight path
      if (s.isFlying && dist > 10) {
        s.buzzPhase += 0.25;
        var wobble = Math.sin(s.buzzPhase) * (s.escaping ? 1.5 : 4);
        var px = -dy / dist, py = dx / dist;
        s.x += px * wobble;
        s.y += py * wobble;
      }
      // Rotate to face direction of travel (+90° since SVG head faces up)
      var tRot = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      s.rot = lerpAngle(s.rot, tRot, 0.13);
    } else {
      s.x = s.tx; s.y = s.ty;
      if (s.isFlying) {
        s.isFlying = false; s.escaping = false; s.buzzPhase = 0;
        setFlapping(false);
      }
    }
    s.el.style.left = (s.x - FLY_W / 2) + 'px';
    s.el.style.top  = (s.y - FLY_H / 2) + 'px';
    s.el.style.transform = 'rotate(' + s.rot.toFixed(1) + 'deg)';
  }

  // ── Mouse handler ──────────────────────────────────────────────────────
  function onMove(e) {
    if (!s.active || !s.slideEl) return;
    var r = s.slideEl.getBoundingClientRect();
    var scale = r.width / 1920;
    var cx = (e.clientX - r.left) / scale;
    var cy = (e.clientY - r.top)  / scale;
    if (Math.hypot(cx - s.x, cy - s.y) < SCARE_DIST) scareAway(cx, cy);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────
  function activate() {
    if (s.active) return;
    s.active = true;
    s.el.style.opacity = '1';
    var sp = SPOTS[0];
    s.x = s.tx = sp.x / 100 * 1920;
    s.y = s.ty = sp.y / 100 * 1080;
    s.rot = 0;
    s.el.style.left = (s.x - FLY_W / 2) + 'px';
    s.el.style.top  = (s.y - FLY_H / 2) + 'px';
    setFlapping(false);
    scheduleLanding();
    document.addEventListener('mousemove', onMove);
    if (!s.rafId) s.rafId = requestAnimationFrame(tick);
  }

  function deactivate() {
    if (!s.active) return;
    s.active = false;
    s.el.style.opacity = '0';
    clearTimeout(s.landTimer);
    document.removeEventListener('mousemove', onMove);
    if (s.rafId) { cancelAnimationFrame(s.rafId); s.rafId = null; }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────
  function init() {
    s.slideEl = document.querySelector('.slide');
    if (!s.slideEl) return;
    injectCSS();
    s.el = document.createElement('div');
    s.el.id = 'pres-fly';
    s.el.innerHTML = buildFlyHTML();
    s.el.style.opacity = '0';
    s.el.style.transition = 'opacity 0.5s';
    s.slideEl.appendChild(s.el);
    // React to slide 1 becoming active/inactive
    new MutationObserver(function () {
      if (s.slideEl.classList.contains('active')) activate();
      else deactivate();
    }).observe(s.slideEl, { attributes: true, attributeFilter: ['class'] });
    // Initial state check (slide 1 is likely already active on load)
    if (s.slideEl.classList.contains('active')) setTimeout(activate, 700);
  }

  // Scripts at bottom of body run after parse — readyState is 'interactive' or 'complete'
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
