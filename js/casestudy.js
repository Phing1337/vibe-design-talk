/**
 * casestudy.js — Stage-based generational exploration
 * Show one generation at a time, filling the screen.
 * Gen 1: Font exploration — each tile has its own fixed theme, layout, and personality
 * Gen 2: Gradient exploration — all Figtree, different gradient treatments
 * Gen 3: Layout exploration — Figtree + final gradient, different arrangements
 */
(function() {
  'use strict';

  /* ── Base dark palette (used for Gen 2/3) ── */
  var DARK  = { bg:'#111315', text:'#e8e4de', sub:'#6a6560', body:'#9a958e', dots:'rgba(255,255,255,0.05)', edge:'#1e2024' };

  /* ── Gen 1: each tile is a completely distinct visual identity ── */
  var G1 = [
    // Tile 01 — Dark navy, left-aligned, big bold Syne
    { pal:{ bg:'#0b1628', text:'#c8d8f0', sub:'#4a6894', body:'#7898c0', dots:'rgba(100,160,240,0.04)', edge:'#162a48' },
      font:{ h:"'Syne',sans-serif", w:700, b:"'DM Sans',sans-serif" },
      hSize:52, align:'flex-start', ta:'left', light:false },
    // Tile 02 — LIGHT sage cream, center, refined Space Grotesk
    { pal:{ bg:'#e8ede2', text:'#1a2e14', sub:'#4a6838', body:'#38502a', dots:'rgba(40,70,30,0.10)', edge:'#b8c8a8' },
      font:{ h:"'Space Grotesk',sans-serif", w:700, b:"'Inter',sans-serif" },
      hSize:36, align:'center', ta:'center', light:true },
    // Tile 03 — Dark terracotta/rust, left-aligned, Red Hat Display
    { pal:{ bg:'#1e1210', text:'#f0d0b8', sub:'#a0644a', body:'#c8907a', dots:'rgba(200,120,80,0.04)', edge:'#3c2218' },
      font:{ h:"'Red Hat Display',sans-serif", w:700, b:"'Inter',sans-serif" },
      hSize:44, align:'flex-start', ta:'left', light:false },
    // Tile 04 — LIGHT lavender, right-aligned, tight Archivo
    { pal:{ bg:'#e8e0f4', text:'#1c1628', sub:'#6e5a8a', body:'#4a3866', dots:'rgba(80,50,120,0.08)', edge:'#c0b0d4' },
      font:{ h:"'Archivo',sans-serif", w:800, b:"'IBM Plex Sans',sans-serif" },
      hSize:32, align:'flex-end', ta:'right', light:true },
    // Tile 05 — Dark standard (WINNER → progresses to Gen 2), center, Figtree
    { pal: DARK,
      font:{ h:"'Figtree',sans-serif", w:700, b:"'Outfit',sans-serif" },
      hSize:42, align:'center', ta:'center', light:false },
    // Tile 06 — LIGHT warm sand, left-aligned, generous Manrope
    { pal:{ bg:'#f0e6d6', text:'#2a2018', sub:'#8a7860', body:'#4e4230', dots:'rgba(70,50,20,0.09)', edge:'#d0c0a0' },
      font:{ h:"'Manrope',sans-serif", w:700, b:"'Inter',sans-serif" },
      hSize:38, align:'flex-start', ta:'left', light:true }
  ];

  /* Gen 2: 5 gradient variations (always dark) */
  var GR = [
    'radial-gradient(ellipse 140% 140% at 100% 0%,hsla(215,18%,15%,1) 0%,transparent 60%)',
    'radial-gradient(ellipse 120% 120% at 0% 100%,hsla(25,12%,12%,1) 0%,transparent 50%)',
    'radial-gradient(ellipse 140% 140% at 100% 0%,hsla(215,12%,14%,1) 0%,transparent 60%),radial-gradient(ellipse 80% 80% at 0% 100%,hsla(20,8%,12%,1) 0%,transparent 40%)',
    'radial-gradient(ellipse 160% 160% at 100% 0%,hsla(210,16%,16%,1) 0%,transparent 55%)',
    'radial-gradient(ellipse 140% 140% at 100% 0%,hsla(215,14%,14%,1) 0%,transparent 60%),radial-gradient(ellipse 90% 90% at 0% 100%,hsla(20,5%,11%,1) 0%,transparent 45%)'
  ];

  var LAYOUTS = [
    { a:'flex-start', t:'left' },
    { a:'center', t:'center', bdr:true },
    { a:'center', t:'center' },
    { a:'flex-start', t:'left' },
    { a:'center', t:'center' }
  ];

  var SEL = [4, 5, 3]; // 0-indexed selected tile per gen
  var LABELS = [
    { n:'Gen 1', t:'Font Exploration' },
    { n:'Gen 2', t:'Gradient Exploration' },
    { n:'Gen 3', t:'Layout Exploration' }
  ];

  var stage = 0, busy = false;
  function pad(n) { return n < 10 ? '0'+n : ''+n; }

  /* ── Background layers ── */
  function bg(p, grad) {
    var s = '<div style="position:absolute;inset:0;background:'+p.bg+'"></div>';
    if (grad) s += '<div style="position:absolute;inset:0;z-index:1;background:'+grad+'"></div>';
    s += '<div style="position:absolute;inset:0;z-index:2;background-image:radial-gradient(circle,'+p.dots+' 0.8px,transparent 0.8px);background-size:28px 28px"></div>';
    s += '<div style="position:absolute;inset:0;z-index:5;pointer-events:none;border-radius:5px;box-shadow:inset 0 0 0 1px '+p.edge+'"></div>';
    return s;
  }

  /* ── Slide content (parameterized heading size + alignment) ── */
  function content(hf, hw, bf, p, opts) {
    opts = opts || {};
    var ai = opts.a || 'center', ta = opts.t || 'center';
    var hs = opts.hSize || 42;
    return '<div class="cs-tile-content" style="align-items:'+ai+';text-align:'+ta+'">' +
      '<h2 style="font-family:'+hf+';font-weight:'+hw+';font-size:'+hs+'px;letter-spacing:-0.01em;color:'+p.text+';margin:0 0 6px">Policy Gradient Methods</h2>' +
      '<h4 style="font-family:\'Source Code Pro\',monospace;font-weight:400;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:'+p.sub+';margin:0 0 16px">REINFORCE</h4>' +
      '<ul style="list-style:none;padding:0;text-align:'+ta+';margin:0 0 14px">' +
        '<li style="font-family:'+bf+';font-size:13px;color:'+p.body+';margin:0 0 3px">Agent learns through environment interaction</li>' +
        '<li style="font-family:'+bf+';font-size:13px;color:'+p.body+';margin:0 0 3px">Observes a state, takes an action</li>' +
        '<li style="font-family:'+bf+';font-size:13px;color:'+p.body+'">Receives feedback (reward)</li>' +
      '</ul>' +
      '<div style="font-size:12px;color:'+p.body+'">\u2207\u03B8 J(\u03B8) = \uD835\uDD3C[\u03A3 <span style="color:#e74c3c">G_t</span> \u2207\u03B8 log \u03C0\u03B8(a|s)]</div>' +
    '</div>';
  }

  function tile(num, sel, inner, isLight) {
    var d = document.createElement('div');
    d.className = 'cs-tile' + (sel ? ' cs-tile--selected' : '') + (num === null ? ' cs-tile--parent' : '');
    var label = '';
    if (num !== null) {
      var nc = isLight ? 'color:rgba(0,0,0,0.4);background:rgba(255,255,255,0.5)' : 'color:rgba(255,255,255,0.35);background:rgba(0,0,0,0.3)';
      label = '<span class="cs-tile-num" style="'+nc+'">'+pad(num)+'</span>';
    }
    d.innerHTML = label + inner;
    return d;
  }

  /* ── Populate tiles for a given stage (no animation) ── */
  function populate(el, stg) {
    el.innerHTML = '';
    var i, gr, lo, t, c, g;
    if (stg === 0) {
      // Gen 1: 6 visually distinct tiles, each with fixed theme + layout
      for (i = 0; i < 6; i++) {
        g = G1[i];
        el.appendChild(tile(i+1, i===SEL[0], bg(g.pal, null) + content(g.font.h, g.font.w, g.font.b, g.pal, { a:g.align, t:g.ta, hSize:g.hSize }), g.light));
      }
    } else if (stg === 1) {
      // Gen 2: parent (Gen1 winner: Figtree, dark palette, NO gradient) + 5 gradient variations
      el.appendChild(tile(null, false, bg(DARK, null) + content("'Figtree',sans-serif", 700, "'Outfit',sans-serif", DARK), false));
      for (i = 0; i < 5; i++) {
        gr = GR[i];
        el.appendChild(tile(i+1, (i+1)===SEL[1], bg(DARK, gr) + content("'Figtree',sans-serif", 700, "'Outfit',sans-serif", DARK), false));
      }
    } else {
      // Gen 3: parent (Gen2 winner: dual gradient) + 5 layout variations
      var finalGr = GR[4];
      el.appendChild(tile(null, false, bg(DARK, finalGr) + content("'Figtree',sans-serif", 700, "'Outfit',sans-serif", DARK), false));
      for (i = 0; i < 5; i++) {
        lo = LAYOUTS[i];
        t = tile(i+1, (i+1)===SEL[2], bg(DARK, finalGr) + content("'Figtree',sans-serif", 700, "'Outfit',sans-serif", DARK, lo), false);
        if (lo.bdr) {
          c = t.querySelector('.cs-tile-content');
          if (c) { c.style.border = '1px solid rgba(255,255,255,0.06)'; c.style.borderRadius = '8px'; }
        }
        el.appendChild(t);
      }
    }
  }

  function setLabel(stg) {
    var numEl = document.getElementById('csStageNum');
    var nameEl = document.getElementById('csStageName');
    if (numEl) numEl.textContent = LABELS[stg].n;
    if (nameEl) nameEl.textContent = LABELS[stg].t;
  }

  function updateNav() {
    var dots = document.querySelectorAll('.cs-dot');
    for (var i = 0; i < dots.length; i++) {
      if (i === stage) dots[i].classList.add('cs-dot--active');
      else dots[i].classList.remove('cs-dot--active');
    }
    var prev = document.getElementById('csPrev');
    var next = document.getElementById('csNext');
    if (prev) prev.disabled = (stage === 0);
    if (next) next.disabled = (stage === 2);
  }

  /* ── Instant render ── */
  function render() {
    var el = document.getElementById('csTiles');
    if (!el) return;
    setLabel(stage);
    populate(el, stage);
    updateNav();
  }

  /* ── Animated stage transition ── */
  function goAnimated(nextStage) {
    if (busy || nextStage < 0 || nextStage > 2 || nextStage === stage) return;
    busy = true;

    var el = document.getElementById('csTiles');
    var children = Array.prototype.slice.call(el.children);
    var forward = nextStage > stage;
    var adjacent = Math.abs(nextStage - stage) === 1;
    var numEl = document.getElementById('csStageNum');
    var nameEl = document.getElementById('csStageName');

    if (forward && adjacent) {
      // ── Forward single-step: selected tile slides to position 0 ──
      var selectedIdx = SEL[stage];
      var selectedTile = children[selectedIdx];

      // Measure slide distance (X and Y for grid layout)
      var tile0Rect = children[0].getBoundingClientRect();
      var selectedRect = selectedTile.getBoundingClientRect();
      var dx = tile0Rect.left - selectedRect.left;
      var dy = tile0Rect.top - selectedRect.top;

      // Non-selected tiles shrink + fade out; selected tile slides to position 0
      children.forEach(function(t, i) {
        if (i === selectedIdx) {
          t.style.transition = 'transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
          t.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        } else {
          t.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
          t.style.opacity = '0';
          t.style.transform = 'scale(0.90)';
        }
      });

      // Fade label
      if (numEl) numEl.style.opacity = '0';
      if (nameEl) nameEl.style.opacity = '0';

      // After slide completes, rebuild with new gen
      setTimeout(function() {
        stage = nextStage;
        setLabel(stage);
        if (numEl) numEl.style.opacity = '1';
        if (nameEl) nameEl.style.opacity = '1';

        populate(el, stage);
        updateNav();

        var newChildren = Array.prototype.slice.call(el.children);

        // Tile 0 visible immediately (the "winner" that arrived)
        // Tiles 1-N fan out from tile 0 like cards scattered on a table
        el.offsetHeight;

        if (window.gsap && document.documentElement.classList.contains('gsap-on')) {
          var incoming = newChildren.slice(1);
          var originRect = newChildren[0].getBoundingClientRect();
          var rects = incoming.map(function(t) { return t.getBoundingClientRect(); });

          gsap.set(incoming, {
            x: function(i) { return originRect.left - rects[i].left; },
            y: function(i) { return originRect.top - rects[i].top; },
            rotation: 0,
            scale: 0.9,
            opacity: 0,
            filter: 'blur(10px)'
          });
          gsap.to(incoming, {
            x: function() { return Math.random() * 6 - 3; },
            y: function() { return Math.random() * 4 - 2; },
            rotation: function() { return Math.random() * 5 - 2.5; },
            scale: 1, opacity: 1,
            filter: 'blur(0px)',
            duration: 0.5, ease: 'back.out(1.2)',
            delay: 0.3,
            stagger: { each: 0.06, from: 0 },
            onComplete: function() { busy = false; }
          });
        } else {
          // CSS fallback
          newChildren.forEach(function(t, i) {
            if (i === 0) return;
            var delay = (i - 1) * 0.1 + 0.06;
            t.style.transition =
              'opacity 0.32s ease-out ' + delay + 's, ' +
              'transform 0.32s ease-out ' + delay + 's';
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
          });
          setTimeout(function() {
            newChildren.forEach(function(t) {
              t.style.transition = '';
              t.style.transform = '';
              t.style.opacity = '';
            });
            busy = false;
          }, 600);
        }
      }, 530);

    } else {
      // ── Backward or multi-step: simple fade transition ──
      children.forEach(function(t) {
        t.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        t.style.opacity = '0';
        t.style.transform = forward
          ? 'scale(0.95)'
          : 'translateX(20px) scale(0.95)';
      });
      if (numEl) numEl.style.opacity = '0';
      if (nameEl) nameEl.style.opacity = '0';

      setTimeout(function() {
        stage = nextStage;
        setLabel(stage);
        if (numEl) numEl.style.opacity = '1';
        if (nameEl) nameEl.style.opacity = '1';

        populate(el, stage);
        updateNav();

        var newChildren = Array.prototype.slice.call(el.children);
        el.offsetHeight;

        if (window.gsap && document.documentElement.classList.contains('gsap-on')) {
          var originRect = newChildren[0].getBoundingClientRect();
          var rects = newChildren.map(function(t) { return t.getBoundingClientRect(); });

          gsap.set(newChildren, {
            x: function(i) { return originRect.left - rects[i].left; },
            y: function(i) { return originRect.top - rects[i].top; },
            rotation: 0,
            scale: 0.9,
            opacity: 0,
            filter: 'blur(10px)'
          });
          gsap.to(newChildren, {
            x: function() { return Math.random() * 6 - 3; },
            y: function() { return Math.random() * 4 - 2; },
            rotation: function() { return Math.random() * 5 - 2.5; },
            scale: 1, opacity: 1,
            filter: 'blur(0px)',
            duration: 0.5, ease: 'back.out(1.2)',
            delay: 0.3,
            stagger: { each: 0.06, from: 0 },
            onComplete: function() { busy = false; }
          });
        } else {
          newChildren.forEach(function(t, i) {
            var delay = i * 0.08 + 0.05;
            t.style.transition =
              'opacity 0.3s ease-out ' + delay + 's, ' +
              'transform 0.35s ease-out ' + delay + 's';
            t.style.opacity = '1';
            t.style.transform = 'translateX(0) scale(1)';
          });
          setTimeout(function() {
            newChildren.forEach(function(t) {
              t.style.transition = '';
              t.style.transform = '';
              t.style.opacity = '';
            });
            busy = false;
          }, 600);
        }
      }, 300);
    }
  }

  /* ── Init ── */
  function init() {
    if (!document.getElementById('csTiles')) return;
    render();

    // Stage navigation — uses animated transitions
    var prevBtn = document.getElementById('csPrev');
    var nextBtn = document.getElementById('csNext');
    if (prevBtn) prevBtn.addEventListener('click', function(e) {
      e.stopPropagation(); e.preventDefault(); goAnimated(stage - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function(e) {
      e.stopPropagation(); e.preventDefault(); goAnimated(stage + 1);
    });
    var dots = document.querySelectorAll('.cs-dot');
    for (var i = 0; i < dots.length; i++) {
      (function(idx) {
        dots[idx].addEventListener('click', function(e) {
          e.stopPropagation(); e.preventDefault(); goAnimated(idx);
        });
      })(i);
    }

    // Result overlay
    var resBtn = document.getElementById('csResultBtn');
    var resOverlay = document.getElementById('csResultOverlay');
    var resClose = document.getElementById('csResultClose');
    var resFrame = document.getElementById('csResultFrame');
    if (resBtn && resOverlay) {
      resBtn.addEventListener('click', function(e) {
        e.stopPropagation(); e.preventDefault();
        resBtn.classList.toggle('cs-active');
        var opening = !resOverlay.classList.contains('cs-result--active');
        resOverlay.classList.toggle('cs-result--active');
        if (opening && resFrame) resFrame.src = 'policy-gradient-hero.html';
      });
    }
    if (resClose && resOverlay) {
      resClose.addEventListener('click', function(e) {
        e.stopPropagation(); e.preventDefault();
        resOverlay.classList.remove('cs-result--active');
        if (resBtn) resBtn.classList.remove('cs-active');
        if (resFrame) resFrame.src = 'about:blank';
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
