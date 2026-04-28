/**
 * casestudy-panel.js — Design Panel case study
 * Shows the "wide & deep" generational exploration used to create the design editor panel.
 * Gen 1: Color theme exploration — 6 mini panels with different accent hues
 * Gen 2: Surface treatment exploration — winner hue + 5 surface/contrast variations
 * Gen 3: Component detail exploration — winner theme + 5 toggle/button/swatch treatments
 */
(function() {
  'use strict';

  var SLIDE_SEL = '.slide-casestudy-panel';
  var PREFIX = 'cs2';

  /* ── Theme definitions ── */

  // Gen 1: 6 distinct color themes — each defined by hue, chroma, surface lightness
  var G1 = [
    // 01 — Ember (warm rust)
    { hue: 30,  c: 0.20, sL: 0.11, sT: 0.014, aL: 0.68, name: 'Ember' },
    // 02 — Ocean (deep blue)
    { hue: 230, c: 0.14, sL: 0.13, sT: 0.010, aL: 0.70, name: 'Ocean' },
    // 03 — Mint (fresh teal-green)
    { hue: 165, c: 0.14, sL: 0.11, sT: 0.010, aL: 0.75, name: 'Mint' },
    // 04 — Rose (warm pink)
    { hue: 350, c: 0.16, sL: 0.12, sT: 0.012, aL: 0.70, name: 'Rose' },
    // 05 — Violet (WINNER) ★
    { hue: 285, c: 0.18, sL: 0.12, sT: 0.012, aL: 0.72, name: 'Violet' },
    // 06 — Gold (warm yellow)
    { hue: 85,  c: 0.15, sL: 0.12, sT: 0.012, aL: 0.78, name: 'Gold' }
  ];

  // Gen 2: surface treatment variations using the violet hue
  var G2 = [
    // Higher contrast, darker surface
    { hue: 285, c: 0.18, sL: 0.08, sT: 0.008, aL: 0.75, name: 'Ultra Dark' },
    // Warmer tint, more chroma in surfaces
    { hue: 285, c: 0.18, sL: 0.13, sT: 0.022, aL: 0.72, name: 'Warm Tint' },
    // Neutral surfaces, no tint
    { hue: 285, c: 0.18, sL: 0.14, sT: 0.000, aL: 0.70, name: 'Neutral' },
    // Subtle tint, balanced (WINNER) ★
    { hue: 285, c: 0.18, sL: 0.12, sT: 0.012, aL: 0.72, name: 'Balanced' },
    // Lighter surface, softer feel
    { hue: 285, c: 0.16, sL: 0.18, sT: 0.014, aL: 0.68, name: 'Soft' }
  ];

  // Gen 3: component style variations
  var G3_STYLES = [
    // Pill toggles, round swatches
    { toggleR: 20, swatchR: '50%', btnR: 20, switchW: 40, label: 'Rounded' },
    // Sharp edges, square swatches
    { toggleR: 3, swatchR: '3px', btnR: 3, switchW: 36, label: 'Sharp' },
    // Mixed — rounded switches, semi-round swatches (WINNER) ★
    { toggleR: 6, swatchR: '6px', btnR: 6, switchW: 36, label: 'Balanced' },
    // Extra compact, tight spacing
    { toggleR: 4, swatchR: '4px', btnR: 4, switchW: 32, label: 'Compact' },
    // Wide buttons, generous spacing
    { toggleR: 8, swatchR: '8px', btnR: 10, switchW: 44, label: 'Spacious' }
  ];

  var SEL = [4, 3, 2]; // 0-indexed winners per gen
  var LABELS = [
    { n: 'Gen 1', t: 'Color Theme' },
    { n: 'Gen 2', t: 'Surface Treatment' },
    { n: 'Gen 3', t: 'Component Detail' }
  ];

  var stage = 0, busy = false;
  function pad(n) { return n < 10 ? '0'+n : ''+n; }

  /* ── Render a mini panel tile ── */
  function miniPanel(theme, style) {
    var h = theme.hue;
    var c = theme.c;
    var sL = theme.sL;
    var sT = theme.sT;
    var aL = theme.aL;
    var st = style || { toggleR: 6, swatchR: '6px', btnR: 6, switchW: 36 };

    // Compute colors
    var surf0 = 'oklch('+sL+' '+sT+' '+h+')';
    var surf1 = 'oklch('+(sL+0.035).toFixed(3)+' '+(sT+0.002).toFixed(3)+' '+h+')';
    var surf2 = 'oklch('+(sL+0.07).toFixed(3)+' '+(sT+0.004).toFixed(3)+' '+h+')';
    var surf3 = 'oklch('+(sL+0.12).toFixed(3)+' '+(sT+0.006).toFixed(3)+' '+h+')';
    var borderD = 'oklch('+(sL+0.10).toFixed(3)+' '+(sT*0.8).toFixed(3)+' '+h+')';
    var borderS = 'oklch('+(sL+0.16).toFixed(3)+' '+sT.toFixed(3)+' '+h+')';
    var accent = 'oklch('+aL+' '+c+' '+h+')';
    var accentBg = 'oklch('+(sL+0.13).toFixed(3)+' '+(c*0.33).toFixed(3)+' '+h+')';
    var textP = 'oklch(0.92 0.008 '+h+')';
    var textS = 'oklch(0.62 0.010 '+h+')';
    var textT = 'oklch(0.45 0.008 '+h+')';

    var s = '';
    // Panel wrapper
    s += '<div style="position:absolute;inset:0;background:'+surf0+';display:flex;align-items:center;justify-content:center;">';
    // The mini panel card
    s += '<div style="width:220px;background:'+surf1+';border:1px solid '+borderS+';border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Figtree,system-ui,sans-serif;">';

    // Header
    s += '<div style="padding:7px 10px;background:'+surf2+';border-bottom:1px solid '+borderD+';display:flex;align-items:center;gap:6px;">';
    s += '<div style="width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,'+accent+',oklch('+(aL-0.05)+' '+(c*1.1)+' '+(h+25)+'));"></div>';
    s += '<span style="font-size:9px;font-weight:700;color:'+textP+';">Design Editor</span>';
    s += '<span style="font-size:7px;color:'+textT+';background:'+surf0+';padding:1px 4px;border-radius:3px;border:1px solid '+borderD+';font-family:monospace;">div</span>';
    s += '</div>';

    // Tabs
    s += '<div style="display:flex;gap:1px;padding:3px 6px;border-bottom:1px solid '+borderD+';">';
    s += '<div style="flex:1;padding:4px 0;font-size:7px;font-weight:600;color:'+textT+';text-align:center;border-radius:4px;">Slide</div>';
    s += '<div style="flex:1;padding:4px 0;font-size:7px;font-weight:600;color:'+textT+';text-align:center;border-radius:4px;">Layers</div>';
    s += '<div style="flex:1;padding:4px 0;font-size:7px;font-weight:600;color:'+accent+';text-align:center;border-radius:4px;background:'+accentBg+';position:relative;">';
    s += 'Annotate<div style="position:absolute;bottom:-1px;left:25%;right:25%;height:1.5px;background:'+accent+';border-radius:1px;"></div></div>';
    s += '</div>';

    // Body
    s += '<div style="padding:10px;">';

    // Section: Tool
    s += '<div style="font-size:7px;font-weight:700;color:'+textT+';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;">Tool</div>';
    s += '<div style="display:flex;background:'+surf0+';border:1px solid '+borderD+';border-radius:'+st.toggleR+'px;overflow:hidden;margin-bottom:8px;">';
    s += '<div style="flex:1;padding:4px 0;font-size:7px;font-weight:500;color:'+accent+';text-align:center;background:'+accentBg+';">Pen</div>';
    s += '<div style="flex:1;padding:4px 0;font-size:7px;font-weight:500;color:'+textT+';text-align:center;">Marker</div>';
    s += '</div>';

    // Section: Color swatches
    s += '<div style="font-size:7px;font-weight:700;color:'+textT+';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;">Color</div>';
    s += '<div style="display:flex;gap:4px;margin-bottom:8px;">';
    var swatchColors = ['oklch(0.63 0.26 25)', 'oklch(0.65 0.20 260)', 'oklch(0.70 0.18 150)', 'oklch(0.82 0.18 95)', 'oklch(0.96 0.005 0)', accent];
    for (var i = 0; i < swatchColors.length; i++) {
      var isActive = (i === 0);
      var sw = 'width:16px;height:16px;border-radius:'+st.swatchR+';background:'+swatchColors[i]+';';
      if (isActive) sw += 'outline:1.5px solid '+accent+';outline-offset:2px;';
      s += '<div style="'+sw+'"></div>';
    }
    s += '</div>';

    // Section: Size pips
    s += '<div style="font-size:7px;font-weight:700;color:'+textT+';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;">Size</div>';
    s += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:8px;">';
    var sizes = [4, 7, 11];
    for (var j = 0; j < sizes.length; j++) {
      var isAct = (j === 1);
      var dotC = isAct ? accent : textT;
      s += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">';
      s += '<div style="width:'+sizes[j]+'px;height:'+sizes[j]+'px;border-radius:50%;background:'+dotC+';"></div>';
      s += '<div style="font-size:6px;font-weight:600;color:'+dotC+';font-family:monospace;">'+['S','M','L'][j]+'</div>';
      s += '</div>';
    }
    s += '</div>';

    // Action buttons
    s += '<div style="display:flex;gap:4px;margin-bottom:8px;">';
    s += '<div style="flex:1;padding:5px 0;font-size:7px;font-weight:600;color:'+textS+';background:'+surf2+';border:1px solid '+borderD+';border-radius:'+st.btnR+'px;text-align:center;">↩ Undo</div>';
    s += '<div style="flex:1;padding:5px 0;font-size:7px;font-weight:600;color:'+textS+';background:'+surf2+';border:1px solid '+borderD+';border-radius:'+st.btnR+'px;text-align:center;">✕ Clear</div>';
    s += '<div style="flex:1;padding:5px 0;font-size:7px;font-weight:600;color:'+accent+';background:'+accentBg+';border:1px solid oklch('+aL+' '+c+' '+h+' / 0.2);border-radius:'+st.btnR+'px;text-align:center;">Copy</div>';
    s += '</div>';

    // Toggle row
    s += '<div style="border-top:1px solid '+borderD+';padding-top:7px;display:flex;align-items:center;justify-content:space-between;">';
    s += '<div><div style="font-size:7px;font-weight:600;color:'+textP+';">Element labels</div>';
    s += '<div style="font-size:6px;color:'+textT+';margin-top:1px;">Show tag names</div></div>';
    // switch
    s += '<div style="width:'+st.switchW+'px;height:16px;background:'+accentBg+';border-radius:8px;border:1px solid oklch('+aL+' '+c+' '+h+' / 0.25);position:relative;">';
    s += '<div style="position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;background:'+accent+';"></div>';
    s += '</div>';
    s += '</div>';

    s += '</div>'; // body
    s += '</div>'; // panel card
    s += '</div>'; // wrapper

    return s;
  }

  /* ── Tile creation ── */
  function tile(num, sel, inner) {
    var d = document.createElement('div');
    d.className = 'cs-tile' + (sel ? ' cs-tile--selected' : '') + (num === null ? ' cs-tile--parent' : '');
    var label = '';
    if (num !== null) {
      label = '<span class="cs-tile-num" style="color:rgba(255,255,255,0.35);background:rgba(0,0,0,0.3)">'+pad(num)+'</span>';
    }
    d.innerHTML = label + inner;
    return d;
  }

  /* ── Populate tiles ── */
  function populate(el, stg) {
    el.innerHTML = '';
    var i;
    if (stg === 0) {
      // Gen 1: 6 color theme tiles
      for (i = 0; i < 6; i++) {
        el.appendChild(tile(i+1, i===SEL[0], miniPanel(G1[i])));
      }
    } else if (stg === 1) {
      // Gen 2: parent (winner from Gen1) + 5 surface variations
      el.appendChild(tile(null, false, miniPanel(G1[SEL[0]])));
      for (i = 0; i < 5; i++) {
        el.appendChild(tile(i+1, i===SEL[1], miniPanel(G2[i])));
      }
    } else {
      // Gen 3: parent (winner from Gen2) + 5 component style variations
      var winTheme = G2[SEL[1]];
      el.appendChild(tile(null, false, miniPanel(winTheme)));
      for (i = 0; i < 5; i++) {
        el.appendChild(tile(i+1, i===SEL[2], miniPanel(winTheme, G3_STYLES[i])));
      }
    }
  }

  function setLabel(stg) {
    var numEl = document.getElementById(PREFIX+'StageNum');
    var nameEl = document.getElementById(PREFIX+'StageName');
    if (numEl) numEl.textContent = LABELS[stg].n;
    if (nameEl) nameEl.textContent = LABELS[stg].t;
  }

  function updateNav() {
    var dots = document.querySelectorAll(SLIDE_SEL+' .cs-dot');
    for (var i = 0; i < dots.length; i++) {
      if (i === stage) dots[i].classList.add('cs-dot--active');
      else dots[i].classList.remove('cs-dot--active');
    }
    var prev = document.getElementById(PREFIX+'Prev');
    var next = document.getElementById(PREFIX+'Next');
    if (prev) prev.disabled = (stage === 0);
    if (next) next.disabled = (stage === 2);
  }

  function render() {
    var el = document.getElementById(PREFIX+'Tiles');
    if (!el) return;
    setLabel(stage);
    populate(el, stage);
    updateNav();
  }

  /* ── Animated transition (reuses same pattern as casestudy.js) ── */
  function goAnimated(nextStage) {
    if (busy || nextStage < 0 || nextStage > 2 || nextStage === stage) return;
    busy = true;

    var el = document.getElementById(PREFIX+'Tiles');
    var children = Array.prototype.slice.call(el.children);
    var forward = nextStage > stage;
    var adjacent = Math.abs(nextStage - stage) === 1;
    var numEl = document.getElementById(PREFIX+'StageNum');
    var nameEl = document.getElementById(PREFIX+'StageName');

    if (forward && adjacent) {
      var selectedIdx = SEL[stage];
      var selectedTile = children[selectedIdx];
      var tile0Rect = children[0].getBoundingClientRect();
      var selectedRect = selectedTile.getBoundingClientRect();
      var dx = tile0Rect.left - selectedRect.left;
      var dy = tile0Rect.top - selectedRect.top;

      children.forEach(function(t, i) {
        if (i === selectedIdx) {
          t.style.transition = 'transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)';
          t.style.transform = 'translate('+dx+'px, '+dy+'px)';
        } else {
          t.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
          t.style.opacity = '0';
          t.style.transform = 'scale(0.90)';
        }
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
          var incoming = newChildren.slice(1);
          var originRect = newChildren[0].getBoundingClientRect();
          var rects = incoming.map(function(t) { return t.getBoundingClientRect(); });

          gsap.set(incoming, {
            x: function(i) { return originRect.left - rects[i].left; },
            y: function(i) { return originRect.top - rects[i].top; },
            scale: 0.9, opacity: 0, filter: 'blur(10px)'
          });
          gsap.to(incoming, {
            x: function() { return Math.random()*6-3; },
            y: function() { return Math.random()*4-2; },
            scale: 1, opacity: 1, filter: 'blur(0px)',
            duration: 0.5, ease: 'back.out(1.2)',
            delay: 0.3, stagger: { each: 0.06 },
            onComplete: function() { busy = false; }
          });
        } else {
          newChildren.forEach(function(t, i) {
            if (i === 0) return;
            var delay = (i-1)*0.1+0.06;
            t.style.transition = 'opacity 0.32s ease-out '+delay+'s, transform 0.32s ease-out '+delay+'s';
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
          });
          setTimeout(function() {
            newChildren.forEach(function(t) { t.style.transition=''; t.style.transform=''; t.style.opacity=''; });
            busy = false;
          }, 600);
        }
      }, 530);

    } else {
      children.forEach(function(t) {
        t.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        t.style.opacity = '0';
        t.style.transform = forward ? 'scale(0.95)' : 'translateX(20px) scale(0.95)';
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
            scale: 0.9, opacity: 0, filter: 'blur(10px)'
          });
          gsap.to(newChildren, {
            x: function() { return Math.random()*6-3; },
            y: function() { return Math.random()*4-2; },
            scale: 1, opacity: 1, filter: 'blur(0px)',
            duration: 0.5, ease: 'back.out(1.2)',
            delay: 0.3, stagger: { each: 0.06 },
            onComplete: function() { busy = false; }
          });
        } else {
          newChildren.forEach(function(t, i) {
            var delay = i*0.08+0.05;
            t.style.transition = 'opacity 0.3s ease-out '+delay+'s, transform 0.35s ease-out '+delay+'s';
            t.style.opacity = '1';
            t.style.transform = 'translateX(0) scale(1)';
          });
          setTimeout(function() {
            newChildren.forEach(function(t) { t.style.transition=''; t.style.transform=''; t.style.opacity=''; });
            busy = false;
          }, 600);
        }
      }, 300);
    }
  }

  /* ── Init ── */
  function init() {
    if (!document.getElementById(PREFIX+'Tiles')) return;
    render();

    var prevBtn = document.getElementById(PREFIX+'Prev');
    var nextBtn = document.getElementById(PREFIX+'Next');
    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); goAnimated(stage-1); });
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); goAnimated(stage+1); });

    document.querySelectorAll(SLIDE_SEL+' .cs-dot').forEach(function(dot, idx) {
      dot.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); goAnimated(idx); });
    });

    // Result overlay
    var resBtn = document.getElementById(PREFIX+'ResultBtn');
    var resOverlay = document.getElementById(PREFIX+'ResultOverlay');
    var resClose = document.getElementById(PREFIX+'ResultClose');
    var resFrame = document.getElementById(PREFIX+'ResultFrame');
    if (resBtn && resOverlay) {
      resBtn.addEventListener('click', function(e) {
        e.stopPropagation(); e.preventDefault();
        resBtn.classList.toggle('cs-active');
        var opening = !resOverlay.classList.contains('cs-result--active');
        resOverlay.classList.toggle('cs-result--active');
        if (opening && resFrame) resFrame.src = 'design-panel-mockup.html';
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
