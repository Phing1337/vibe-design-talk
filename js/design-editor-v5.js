/**
 * design-editor-v5.js — Figma-style design editor
 * Toggle with 'D' key. Left panel (slides + layers), right panel
 * (token spider graph + selection properties), bottom toolbar
 * (annotation tools + overlays + export).
 */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var active = false;
  var selectedEl = null;
  var shellBuilt = false;
  var highlight = null;
  var overlay = null;
  var origStyles = new WeakMap();
  var hiddenEls = new WeakMap();
  var activeTool = 'select'; // 'select' | 'pen' | 'text' | 'eraser'
  var moveDrag = null; // { startX, startY, origLeft, origTop }

  // ── Vibe Matrix state ─────────────────────────────────────
  // X: 0 = Clean ↔ 1 = Expressive,  Y: 0 = Bold ↔ 1 = Airy
  var vibeX = 0.5, vibeY = 0.5;
  var vibeDefault = { x: 0.5, y: 0.5 };
  var vibeCanvas, vibeCtx;
  var vibeDragging = false;

  var VIBE_CORNERS = {
    // Top-left: CLEAN — Helvetica-world, hairline serifs, Swiss precision
    clean: {
      spacing: 0.5, radius: 2, fontScale: 0.82, fontWeight: 300,
      contrast: 0.9, borderW: 1, shadow: 0.05,
      headingScale: 2.4, subScale: 0.68,
      letterSpacing: 0.06, bodyLetterSpacing: 0.015,
      lineHeight: 1.4, headingLineHeight: 1.0,
      textTransform: 'uppercase',
      displayFont: "'Helvetica Neue', 'Arial', sans-serif",
      bodyFont: "'Helvetica Neue', 'Arial', sans-serif"
    },
    // Top-right: BOLD — chunky, baroque, max impact
    bold: {
      spacing: 0.7, radius: 4, fontScale: 1.25, fontWeight: 800,
      contrast: 1.3, borderW: 3, shadow: 0.7,
      headingScale: 3.2, subScale: 0.5,
      letterSpacing: -0.03, bodyLetterSpacing: 0.0,
      lineHeight: 1.4, headingLineHeight: 0.88,
      textTransform: 'none',
      displayFont: "'Ultra', 'Impact', serif",
      bodyFont: "'Roboto Slab', 'Georgia', serif"
    },
    // Bottom-left: AIRY — script, handwritten, calligraphic
    airy: {
      spacing: 1.8, radius: 24, fontScale: 1.05, fontWeight: 300,
      contrast: 0.6, borderW: 0, shadow: 0.15,
      headingScale: 2.6, subScale: 0.85,
      letterSpacing: 0.02, bodyLetterSpacing: 0.015,
      lineHeight: 2.0, headingLineHeight: 1.3,
      textTransform: 'none',
      displayFont: "'Tangerine', 'Dancing Script', cursive",
      bodyFont: "'Caveat', 'Patrick Hand', cursive"
    },
    // Bottom-right: EXPRESSIVE — retro, weird, display type
    expressive: {
      spacing: 0.9, radius: 28, fontScale: 1.15, fontWeight: 700,
      contrast: 1.1, borderW: 2, shadow: 0.5,
      headingScale: 3.0, subScale: 0.55,
      letterSpacing: -0.02, bodyLetterSpacing: 0.0,
      lineHeight: 1.45, headingLineHeight: 0.9,
      textTransform: 'none',
      displayFont: "'Righteous', 'Bungee', cursive",
      bodyFont: "'Archivo Black', 'Oswald', sans-serif"
    }
  };

  // Font tiers — deeper into each corner = wilder fonts
  // ~8 tiers per corner for smooth gradient of personality
  var WILD_FONTS = {
    clean: [
      { at: 0.95, display: "'Poiret One', sans-serif",          body: "'Didact Gothic', sans-serif" },
      { at: 0.88, display: "'Josefin Sans', sans-serif",        body: "'Josefin Sans', sans-serif" },
      { at: 0.80, display: "'Questrial', sans-serif",           body: "'Karla', sans-serif" },
      { at: 0.72, display: "'Tenor Sans', sans-serif",          body: "'Raleway', sans-serif" },
      { at: 0.64, display: "'Raleway', sans-serif",             body: "'Raleway', sans-serif" },
      { at: 0.56, display: "'Work Sans', sans-serif",           body: "'Work Sans', sans-serif" },
      { at: 0.48, display: "'Libre Franklin', sans-serif",      body: "'Libre Franklin', sans-serif" },
      { at: 0.40, display: "'Barlow', sans-serif",              body: "'Barlow', sans-serif" }
    ],
    bold: [
      { at: 0.95, display: "'Fascinate Inline', cursive",       body: "'Staatliches', sans-serif" },
      { at: 0.88, display: "'Abril Fatface', serif",            body: "'Roboto Condensed', sans-serif" },
      { at: 0.80, display: "'Bungee Shade', cursive",           body: "'Oswald', sans-serif" },
      { at: 0.72, display: "'Playfair Display SC', serif",      body: "'Libre Baskerville', serif" },
      { at: 0.64, display: "'Playfair Display', serif",         body: "'Source Sans 3', sans-serif" },
      { at: 0.56, display: "'Bodoni Moda', serif",              body: "'Lato', sans-serif" },
      { at: 0.48, display: "'DM Serif Display', serif",         body: "'DM Sans', sans-serif" },
      { at: 0.40, display: "'Fraunces', serif",                 body: "'Source Sans 3', sans-serif" }
    ],
    airy: [
      { at: 0.95, display: "'Homemade Apple', cursive",         body: "'Shadows Into Light', cursive" },
      { at: 0.88, display: "'Sacramento', cursive",             body: "'Caveat', cursive" },
      { at: 0.80, display: "'Great Vibes', cursive",            body: "'Patrick Hand', cursive" },
      { at: 0.72, display: "'Pinyon Script', cursive",          body: "'Kalam', cursive" },
      { at: 0.64, display: "'Tangerine', cursive",              body: "'Indie Flower', cursive" },
      { at: 0.56, display: "'Dancing Script', cursive",         body: "'Nunito', sans-serif" },
      { at: 0.48, display: "'Cormorant Garamond', serif",       body: "'Quicksand', sans-serif" },
      { at: 0.40, display: "'Lora', serif",                     body: "'Nunito', sans-serif" }
    ],
    expressive: [
      { at: 0.95, display: "'Webdings', fantasy",               body: "'Bungee', cursive" },
      { at: 0.88, display: "'Nabla', cursive",                  body: "'Rubik Glitch', cursive" },
      { at: 0.80, display: "'Silkscreen', monospace",           body: "'Press Start 2P', monospace" },
      { at: 0.72, display: "'Bungee Shade', cursive",           body: "'Archivo Black', sans-serif" },
      { at: 0.64, display: "'Monoton', cursive",                body: "'Orbitron', sans-serif" },
      { at: 0.56, display: "'Righteous', cursive",              body: "'Anybody', cursive" },
      { at: 0.48, display: "'Pacifico', cursive",               body: "'Josefin Sans', sans-serif" },
      { at: 0.40, display: "'Lobster', cursive",                body: "'Oswald', sans-serif" }
    ]
  };

  // Deck color hue state
  var deckHue = 0; // 0 = default (no override), otherwise 1-360

  // Theme state
  var currentTheme = { name: 'default', hue: 285, c: 0.18, aL: 0.72 };
  var defaultTheme = { name: 'default', hue: 285, c: 0.18, aL: 0.72 };

  // Property step sizes
  var STEPS = {
    fontSize: 1, lineHeight: 0.05, letterSpacing: 0.5,
    maxWidth: 10, opacity: 0.05, padding: 2
  };

  // ── Helpers ────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function getContainer() { return $('slidesContainer'); }

  function getActiveSlide() {
    return qs('.slide.active', getContainer());
  }

  function updateFreezeLayer() {
    var freeze = $('deFreeze');
    if (!freeze) return;
    var drawing = activeTool === 'pen' || activeTool === 'text' || activeTool === 'eraser';
    freeze.classList.toggle('active', active && drawing);
  }

  function elLabel(el) {
    var tag = el.tagName.toLowerCase();
    var parts = [tag];
    if (el.id) parts.push('#' + el.id);
    var cls = Array.from(el.classList)
      .filter(function(c) { return !c.startsWith('de-') && c !== 'active' && c !== 'slide'; })
      .slice(0, 2);
    if (cls.length) parts.push('.' + cls.join('.'));
    return parts.join('');
  }

  function layerIconType(tag) {
    if (tag === 'SECTION') return 't-s';
    if (tag === 'DIV' || tag === 'SPAN' || tag === 'ARTICLE' || tag === 'NAV') return 't-d';
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || tag === 'SVG' || tag === 'IFRAME') return 't-i';
    if (/^H[1-6]$/.test(tag)) return 't-h';
    if (tag === 'P' || tag === 'LI' || tag === 'UL' || tag === 'OL' || tag === 'BLOCKQUOTE') return 't-p';
    if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT') return 't-a';
    return 't-x';
  }

  // ── Build Shell ────────────────────────────────────────────
  function buildShell() {
    if (shellBuilt) return;
    shellBuilt = true;

    // ─ Freeze layer (blocks slide interaction for drawing tools) ─
    var freeze = document.createElement('div');
    freeze.id = 'deFreeze';
    var cont = getContainer();
    if (cont) cont.appendChild(freeze);

    // ─ Left panel ─
    var left = document.createElement('div');
    left.className = 'de-panel-left';
    left.innerHTML =
      '<div class="de-section" style="max-height:42%;">' +
        '<div class="de-section-hdr"><span class="de-section-title">Slides</span>' +
        '<span class="de-section-badge" id="deSlideCount">—</span></div>' +
        '<div class="de-section-body"><div class="de-thumbs" id="deThumbs"></div></div>' +
      '</div>' +
      '<div class="de-divider"></div>' +
      '<div class="de-section de-flex">' +
        '<div class="de-section-hdr"><span class="de-section-title">Layers</span></div>' +
        '<div class="de-section-body"><div class="de-layers" id="deLayers"></div></div>' +
      '</div>' +
      '<div class="de-divider"></div>' +
      '<div class="de-section">' +
        '<div class="de-section-hdr"><span class="de-section-title">Editor Theme</span></div>' +
        '<div style="padding:8px 12px;">' +
          '<select id="deEditorTheme" class="de-theme-select">' +
            '<option value="light" selected>Light</option>' +
            '<option value="dark">Dark</option>' +
            '<option value="rose">Rose</option>' +
          '</select>' +
        '</div>' +
      '</div>';
    document.body.appendChild(left);

    // ─ Right panel ─
    var right = document.createElement('div');
    right.className = 'de-panel-right';
    right.innerHTML =
      '<div class="de-section" style="max-height:55%;">' +
        '<div class="de-section-hdr"><span class="de-section-title">Vibe</span></div>' +
        '<div class="de-section-body">' +
          '<div class="de-vibe-wrap">' +
            '<canvas id="deVibeCanvas" width="280" height="280"></canvas>' +
            '<div class="de-vibe-readout" id="deVibeReadout"></div>' +
            '<div class="de-vibe-hue-wrap">' +
              '<span class="de-vibe-hue-label">Deck Color</span>' +
              '<input type="range" class="de-vibe-hue-slider" id="deVibeHue" min="0" max="360" value="0">' +
              '<span class="de-vibe-hue-val" id="deVibeHueVal">Default</span>' +
            '</div>' +
            '<label class="de-vibe-preview-toggle" id="dePreviewToggle">' +
              '<input type="checkbox" id="dePreviewCheck">' +
              '<span>Keep changes when closing</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="de-divider"></div>' +
      '<div class="de-section de-flex">' +
        '<div class="de-section-hdr"><span class="de-section-title">Selection</span>' +
        '<span class="de-section-badge" id="deSelTag" style="display:none"></span></div>' +
        '<div class="de-section-body" id="deLocalBody"></div>' +
      '</div>';
    document.body.appendChild(right);

    // ─ Bottom bar ─
    var bar = document.createElement('div');
    bar.className = 'de-bottom-bar';
    // SVG icons
    var icoSelect = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 2l8.5 5.5-3.8.8-.8 3.8z"/></svg>';
    var icoPen = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 13.5l1-4L11 2l2.5 2.5-7.5 7.5z"/><path d="M9.5 4.5l2 2"/></svg>';
    var icoText = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3h10M8 3v10M5.5 13h5"/></svg>';
    var icoEraser = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 14h7"/><path d="M3.5 10.5l6-6 3 3-6 6-3.5.5z"/></svg>';
    var icoUndo = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7l-3-3 3-3"/><path d="M1 4h9a4 4 0 010 8H6"/></svg>';
    var icoClear = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

    bar.innerHTML =
      // Select tool (standalone)
      '<div class="de-bb-group">' +
        '<button class="de-bb-btn active" data-tool="select" title="Select (V)">' + icoSelect + '</button>' +
      '</div>' +
      '<div class="de-bb-sep"></div>' +
      // Segmented control: Pen / Text / Eraser
      '<div class="de-seg" id="deSegControl">' +
        '<div class="de-seg-indicator" id="deSegIndicator"></div>' +
        '<button class="de-seg-btn active" data-tool="pen" title="Pen (P)">' + icoPen + '</button>' +
        '<button class="de-seg-btn" data-tool="text" title="Text (T)">' + icoText + '</button>' +
        '<button class="de-seg-btn" data-tool="eraser" title="Eraser (E)">' + icoEraser + '</button>' +
      '</div>' +
      // Pen/text detail: colors + sizes (hidden for eraser)
      '<div class="de-bb-detail visible" id="deBBDetail">' +
        '<div class="de-bb-sep"></div>' +
        '<div class="de-bb-group" id="deBBSwatches" style="gap:4px;"></div>' +
        '<div class="de-bb-sep"></div>' +
        '<div class="de-bb-group" style="gap:5px;align-items:center;">' +
          '<div class="de-bb-size" data-sz="3" style="width:5px;height:5px;"></div>' +
          '<div class="de-bb-size active" data-sz="6" style="width:8px;height:8px;"></div>' +
          '<div class="de-bb-size" data-sz="12" style="width:12px;height:12px;"></div>' +
        '</div>' +
      '</div>' +
      '<div class="de-bb-sep"></div>' +
      // Undo / Clear
      '<div class="de-bb-group">' +
        '<button class="de-bb-btn" id="deBBUndo" title="Undo">' + icoUndo + '</button>' +
        '<button class="de-bb-btn" id="deBBClear" title="Clear all">' + icoClear + '</button>' +
      '</div>' +
      '<div class="de-bb-sep"></div>' +
      // Export
      '<div class="de-bb-group">' +
        '<button class="de-bb-btn de-export-trigger" id="deExportBtn">Export</button>' +
      '</div>';
    document.body.appendChild(bar);

    // ─ Export panel ─
    var exp = document.createElement('div');
    exp.className = 'de-export';
    exp.id = 'deExport';
    exp.innerHTML =
      '<div class="de-export-hdr"><span>Export Changes</span>' +
        '<button class="de-export-close" id="deExportClose">✕</button></div>' +
      '<div class="de-export-body">' +
        '<div class="de-export-chips" id="deExportChips"></div>' +
        '<div class="de-export-pre" id="deExportPre"></div>' +
        '<div class="de-export-actions">' +
          '<button class="de-export-btn" id="deExportCopy">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-2px;margin-right:5px;"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M2 11V2.5A.5.5 0 012.5 2H11"/></svg>' +
            'Copy text for agent</button>' +
          '<button class="de-export-btn sec" id="deExportSS">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-2px;margin-right:5px;"><rect x="1" y="3" width="14" height="10" rx="2"/><circle cx="8" cy="8.5" r="2.5"/><circle cx="12" cy="5" r="0.8" fill="currentColor"/></svg>' +
            'Screenshot slide</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(exp);

    // ─ Highlight ─
    highlight = document.createElement('div');
    highlight.id = 'deHighlight';
    document.body.appendChild(highlight);

    // ─ Selection overlay ─
    overlay = document.createElement('div');
    overlay.id = 'deSelOverlay';
    overlay.innerHTML =
      '<div id="deSelBox"></div><div id="deSelLabel"></div>' +
      ['nw','n','ne','e','se','s','sw','w'].map(function(h) {
        return '<div class="de-handle" data-h="' + h + '"></div>';
      }).join('');
    document.body.appendChild(overlay);

    // Wire drag-to-move on selection box
    $('deSelBox').addEventListener('mousedown', function(e) {
      if (e.button !== 0 || !selectedEl || activeTool !== 'select') return;
      e.preventDefault(); e.stopPropagation();

      if (!origStyles.has(selectedEl)) {
        origStyles.set(selectedEl, selectedEl.getAttribute('style') || '');
      }

      // Get current position
      var cs = getComputedStyle(selectedEl);
      var pos = cs.position;
      if (pos === 'static') selectedEl.style.position = 'relative';

      var startX = e.clientX, startY = e.clientY;
      var origLeft = parseFloat(selectedEl.style.left) || 0;
      var origTop = parseFloat(selectedEl.style.top) || 0;

      // Account for the scaler's transform on the container
      var cont = getContainer();
      var contRect = cont.getBoundingClientRect();
      var scaleRatio = contRect.width / 1920;

      function onMove(ev) {
        var dx = (ev.clientX - startX) / scaleRatio;
        var dy = (ev.clientY - startY) / scaleRatio;
        selectedEl.style.left = (origLeft + dx) + 'px';
        selectedEl.style.top = (origTop + dy) + 'px';
        positionOverlay();
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        showLocalProperties();
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Wire everything
    wireEditorTheme();
    buildVibeMatrix();
    buildSwatches();
    wireBottomBar();
    wireExport();
    wireSelection();
    initTextTool();
    showEmptySelection();
  }

  // ── Slide Navigator ────────────────────────────────────────
  function buildSlideNav() {
    var thumbs = $('deThumbs');
    var slides = window.PRES && window.PRES.slides ? window.PRES.slides : [];
    var idx = window.PRES ? window.PRES.currentIndex : 0;

    if (!thumbs || !slides.length) return;

    $('deSlideCount').textContent = (idx + 1) + ' / ' + slides.length;

    var html = '';
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var title = s.getAttribute('data-title') || 'Slide ' + (i + 1);
      var bg = s.style.background || 'var(--de-surf-0)';
      var act = i === idx ? ' active' : '';
      html += '<div class="de-thumb' + act + '" data-idx="' + i + '">' +
        '<span class="de-thumb-num">' + (i + 1) + '</span>' +
        '<div class="de-thumb-box" style="background:' + bg + '"></div>' +
        '<span class="de-thumb-name">' + title + '</span></div>';
    }
    thumbs.innerHTML = html;

    // Click to navigate
    qsa('.de-thumb', thumbs).forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.dataset.idx, 10);
        if (window.PRES && window.PRES.goToSlide) {
          window.PRES.goToSlide(idx);
        }
      });
    });

    // Scroll active into view
    var activeThumb = qs('.de-thumb.active', thumbs);
    if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest' });
  }

  // ── Layer Tree ─────────────────────────────────────────────
  function buildLayerTree() {
    var container = $('deLayers');
    if (!container) return;
    var slide = getActiveSlide();
    if (!slide) { container.innerHTML = '<div style="padding:12px;color:var(--de-text-3);font-size:10px;">No active slide</div>'; return; }

    container.innerHTML = '';
    buildLayerNode(container, slide, 0);
  }

  function buildLayerNode(parent, el, depth) {
    if (depth > 6) return;
    if (el.nodeType !== 1) return;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'BR') return;
    if (el.id && el.id.startsWith('de')) return;

    var row = document.createElement('div');
    row.className = 'de-lr' + (el === selectedEl ? ' sel' : '');
    row.style.paddingLeft = (depth * 14 + 5) + 'px';

    var kids = Array.from(el.children).filter(function(c) {
      return c.nodeType === 1 && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE' &&
             c.tagName !== 'BR' && !(c.id && c.id.startsWith('de'));
    });
    var hasKids = kids.length > 0;

    var caret = document.createElement('span');
    caret.className = 'de-lr-caret' + (hasKids ? ' open' : '');
    caret.textContent = hasKids ? '▶' : ' ';
    caret.style.visibility = hasKids ? 'visible' : 'hidden';
    row.appendChild(caret);

    var icon = document.createElement('span');
    icon.className = 'de-lr-icon ' + layerIconType(tag);
    icon.textContent = tag.charAt(0);
    row.appendChild(icon);

    var name = document.createElement('span');
    name.className = 'de-lr-name';
    name.textContent = elLabel(el);
    row.appendChild(name);

    var eye = document.createElement('span');
    eye.className = 'de-lr-eye';
    eye.textContent = '●';
    row.appendChild(eye);

    // Click to select
    row.addEventListener('click', function(e) {
      e.stopPropagation();
      selectElement(el);
    });

    // Toggle visibility
    eye.addEventListener('click', function(e) {
      e.stopPropagation();
      var isHidden = hiddenEls.has(el);
      if (isHidden) {
        el.style.visibility = '';
        hiddenEls.delete(el);
        eye.classList.remove('hidden');
      } else {
        el.style.visibility = 'hidden';
        hiddenEls.set(el, true);
        eye.classList.add('hidden');
      }
    });

    // Toggle collapse
    var childContainer = null;
    if (hasKids) {
      caret.addEventListener('click', function(e) {
        e.stopPropagation();
        caret.classList.toggle('open');
        if (childContainer) childContainer.style.display = caret.classList.contains('open') ? '' : 'none';
      });
    }

    parent.appendChild(row);

    if (hasKids) {
      childContainer = document.createElement('div');
      childContainer.className = 'de-lr-kids';
      kids.forEach(function(kid) { buildLayerNode(childContainer, kid, depth + 1); });
      parent.appendChild(childContainer);
    }
  }

  // ── Element Selection ──────────────────────────────────────
  function wireSelection() {
    // Hover highlight (only in select mode)
    document.addEventListener('mousemove', function(e) {
      if (!active || activeTool !== 'select') {
        if (highlight) highlight.style.display = 'none';
        return;
      }
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || !isInActiveSlide(el) || isEditorChrome(el)) {
        highlight.style.display = 'none';
        return;
      }
      var r = el.getBoundingClientRect();
      highlight.style.display = 'block';
      highlight.style.top = r.top + 'px';
      highlight.style.left = r.left + 'px';
      highlight.style.width = r.width + 'px';
      highlight.style.height = r.height + 'px';
    });

    // Click to select (only in select mode)
    document.addEventListener('click', function(e) {
      if (!active || activeTool !== 'select') return;
      if (isEditorChrome(e.target)) return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && isInActiveSlide(el)) {
        e.preventDefault();
        e.stopPropagation();
        selectElement(el);
      }
    }, true);
  }

  function isInActiveSlide(el) {
    var slide = getActiveSlide();
    return slide && slide.contains(el);
  }

  function isEditorChrome(el) {
    if (!el) return false;
    var check = el;
    while (check) {
      if (check.classList && (
        check.classList.contains('de-panel-left') ||
        check.classList.contains('de-panel-right') ||
        check.classList.contains('de-bottom-bar') ||
        check.classList.contains('de-export') ||
        check.id === 'deHighlight' ||
        check.id === 'deSelOverlay'
      )) return true;
      check = check.parentElement;
    }
    return false;
  }

  function selectElement(el) {
    selectedEl = el;
    if (!origStyles.has(el)) {
      origStyles.set(el, el.getAttribute('style') || '');
    }
    positionOverlay();
    showLocalProperties();
    buildLayerTree();

    // Update badge
    var badge = $('deSelTag');
    if (badge) {
      badge.style.display = '';
      badge.textContent = elLabel(el);
    }
  }

  function deselectElement() {
    selectedEl = null;
    overlay.style.display = 'none';
    showEmptySelection();
    var badge = $('deSelTag');
    if (badge) badge.style.display = 'none';
    buildLayerTree();
  }

  function positionOverlay() {
    if (!selectedEl) return;
    var r = selectedEl.getBoundingClientRect();
    var pad = 5;
    overlay.style.display = 'block';
    overlay.style.top = (r.top - pad) + 'px';
    overlay.style.left = (r.left - pad) + 'px';
    overlay.style.width = (r.width + pad * 2) + 'px';
    overlay.style.height = (r.height + pad * 2) + 'px';
    $('deSelLabel').textContent = elLabel(selectedEl);
  }

  // ── Local Properties Panel ─────────────────────────────────
  function showEmptySelection() {
    var body = $('deLocalBody');
    if (!body) return;
    body.innerHTML =
      '<div class="de-local-empty">' +
        '<div class="de-local-empty-icon"></div>' +
        '<div class="de-local-empty-title">No element selected</div>' +
        '<div class="de-local-empty-desc">Click an element on the slide to inspect and edit its properties.</div>' +
      '</div>';
  }

  function showLocalProperties() {
    var body = $('deLocalBody');
    if (!body || !selectedEl) return;

    var cs = getComputedStyle(selectedEl);
    var props = [
      { label: 'Font Size', key: 'fontSize', val: cs.fontSize },
      { label: 'Line Height', key: 'lineHeight', val: cs.lineHeight },
      { label: 'Letter Spacing', key: 'letterSpacing', val: cs.letterSpacing },
      { label: 'Max Width', key: 'maxWidth', val: cs.maxWidth },
      { label: 'Padding', key: 'padding', val: cs.padding },
      { label: 'Opacity', key: 'opacity', val: cs.opacity }
    ];

    var html = '<div class="de-prop-section">Typography</div>';
    props.slice(0, 4).forEach(function(p) {
      html += propRow(p.label, p.key, p.val);
    });
    html += '<div class="de-prop-section">Spacing</div>';
    html += propRow(props[4].label, props[4].key, props[4].val);
    html += '<div class="de-prop-section">Visual</div>';
    html += propRow(props[5].label, props[5].key, props[5].val);

    // Color — clickable swatch opens picker
    var curHex = rgbToHex(cs.color);
    html += '<div class="de-color-row">' +
      '<div class="de-color-swatch" id="deColorSwatch" style="background:' + cs.color + '"></div>' +
      '<span style="font-size:10px;color:var(--de-text-2);flex:1;">Text Color</span>' +
      '<span class="de-color-hex" id="deColorHex">' + curHex + '</span>' +
      '<input type="color" id="deColorPicker" value="' + curHex + '" style="position:absolute;opacity:0;width:0;height:0;pointer-events:none;">' +
    '</div>' +
    // Token color palette
    '<div class="de-token-colors" id="deTokenColors" style="display:none;">' +
      '<div class="de-prop-section" style="margin-top:4px;padding-top:6px;">Design Tokens</div>' +
      '<div class="de-token-grid" id="deTokenGrid"></div>' +
      '<div class="de-prop-section">Custom</div>' +
      '<div style="padding:4px 14px 8px;"><button class="de-bb-btn" id="deOpenNativePicker" style="width:100%;justify-content:center;">Pick custom color</button></div>' +
    '</div>';

    // Reset button
    html += '<div style="padding:8px 14px;">' +
      '<button class="de-bb-btn" id="deResetProps" style="width:100%;justify-content:center;">Reset Element</button>' +
    '</div>';

    body.innerHTML = html;

    // Wire steppers
    qsa('.de-prop-btn', body).forEach(function(btn) {
      btn.addEventListener('click', function() {
        stepProp(btn.dataset.prop, parseInt(btn.dataset.dir, 10));
        markChanged();
      });
    });

    // Wire color swatch — toggle token palette
    var swatch = $('deColorSwatch');
    var tokenPanel = $('deTokenColors');
    if (swatch && tokenPanel) {
      swatch.addEventListener('click', function() {
        var isOpen = tokenPanel.style.display !== 'none';
        tokenPanel.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) buildTokenGrid();
      });
    }

    // Wire native color picker
    var nativePicker = $('deColorPicker');
    var nativeBtn = $('deOpenNativePicker');
    if (nativeBtn && nativePicker) {
      nativeBtn.addEventListener('click', function() { nativePicker.click(); });
      nativePicker.addEventListener('input', function() {
        if (!selectedEl) return;
        selectedEl.style.color = nativePicker.value;
        $('deColorSwatch').style.background = nativePicker.value;
        $('deColorHex').textContent = nativePicker.value;
        markChanged();
      });
    }

    // Wire reset
    var resetBtn = $('deResetProps');
    if (resetBtn) resetBtn.addEventListener('click', function() {
      if (selectedEl && origStyles.has(selectedEl)) {
        selectedEl.setAttribute('style', origStyles.get(selectedEl));
        showLocalProperties();
        positionOverlay();
      }
    });
  }

  function propRow(label, prop, val) {
    var display = val;
    if (typeof val === 'string' && val.length > 12) display = val.substring(0, 10) + '…';
    return '<div class="de-prop-row">' +
      '<span class="de-prop-lbl">' + label + '</span>' +
      '<button class="de-prop-btn" data-prop="' + prop + '" data-dir="-1">−</button>' +
      '<span class="de-prop-val" data-prop="' + prop + '">' + display + '</span>' +
      '<button class="de-prop-btn" data-prop="' + prop + '" data-dir="1">+</button>' +
    '</div>';
  }

  function stepProp(prop, dir) {
    if (!selectedEl) return;
    var cs = getComputedStyle(selectedEl);
    var step = STEPS[prop] || 1;
    var cur = parseFloat(cs[prop]) || 0;
    var newVal = cur + step * dir;

    if (prop === 'opacity') {
      newVal = Math.max(0, Math.min(1, newVal));
      selectedEl.style[prop] = newVal;
    } else {
      selectedEl.style[prop] = newVal + 'px';
    }

    showLocalProperties();
    positionOverlay();
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#000000';
    var m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return rgb;
    return '#' + m.slice(0, 3).map(function(n) {
      return parseInt(n).toString(16).padStart(2, '0');
    }).join('');
  }

  // ── Token Color Grid ──────────────────────────────────────
  var TOKEN_COLORS = [
    { name: '--color-text',         hex: '#f0ede8', label: 'Text' },
    { name: '--color-text-muted',   hex: '#9a958d', label: 'Muted' },
    { name: '--color-text-dim',     hex: '#524e48', label: 'Dim' },
    { name: '--color-text-on-light',hex: '#2a1a0e', label: 'On Light' },
    { name: '--color-signal',       hex: '#c43e1c', label: 'Signal' },
    { name: '--color-accent',       hex: '#e8e2d9', label: 'Accent' },
    { name: '--color-bg',           hex: '#0f0d0b', label: 'BG Dark' },
    { name: '--color-bg-light',     hex: '#eeeee4', label: 'BG Light' },
    { name: '--color-surface',      hex: '#1e1a16', label: 'Surface' },
    { name: '--color-border',       hex: '#222222', label: 'Border' }
  ];

  function buildTokenGrid() {
    var grid = $('deTokenGrid');
    if (!grid) return;
    grid.innerHTML = '';
    TOKEN_COLORS.forEach(function(tc) {
      var item = document.createElement('div');
      item.className = 'de-token-color-item';
      item.innerHTML =
        '<div class="de-token-color-dot" style="background:' + tc.hex + ';"></div>' +
        '<span class="de-token-color-name">' + tc.label + '</span>' +
        '<span class="de-token-color-var">' + tc.name + '</span>';
      item.addEventListener('click', function() {
        if (!selectedEl) return;
        selectedEl.style.color = 'var(' + tc.name + ')';
        $('deColorSwatch').style.background = tc.hex;
        $('deColorHex').textContent = tc.name;
        $('deTokenColors').style.display = 'none';
        markChanged();
      });
      grid.appendChild(item);
    });
  }

  // ── Change Tracking + Toast ────────────────────────────────
  var hasUnsavedChanges = false;
  var toastEl = null;
  var toastTimeout = null;

  function markChanged() {
    if (hasUnsavedChanges) return;
    hasUnsavedChanges = true;
    showToast();
  }

  function showToast() {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'de-toast';
      toastEl.innerHTML = 'You have unsaved changes — <strong>Export</strong> to copy them';
      toastEl.addEventListener('click', function() {
        var exportBtn = $('deExportBtn');
        if (exportBtn) exportBtn.click();
        hideToast();
      });
      document.body.appendChild(toastEl);
    }
    toastEl.style.display = '';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toastEl.classList.add('visible');
      });
    });
    // Auto-hide after 6 seconds, re-show on next change
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function() { hideToast(); }, 6000);
  }

  function hideToast() {
    if (toastEl) {
      toastEl.classList.remove('visible');
      setTimeout(function() { if (toastEl) toastEl.style.display = 'none'; }, 300);
    }
  }

  function resetChangeTracking() {
    hasUnsavedChanges = false;
    hideToast();
  }

  // ── Vibe Matrix ─────────────────────────────────────────────
  function buildVibeMatrix() {
    // Load Google Fonts for vibe corners
    if (!document.getElementById('deVibeFonts')) {
      var link = document.createElement('link');
      link.id = 'deVibeFonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?' +
        'family=Poiret+One&family=Didact+Gothic&family=Josefin+Sans:wght@200;300;400&' +
        'family=Questrial&family=Karla:wght@300;400;600&family=Tenor+Sans&' +
        'family=Raleway:wght@200;300;400;600&family=Work+Sans:wght@300;400;600&' +
        'family=Libre+Franklin:wght@300;400;600&family=Barlow:wght@300;400;600&' +
        'family=Fascinate+Inline&family=Abril+Fatface&family=Bungee+Shade&family=Bungee&' +
        'family=Playfair+Display:wght@400;700;900&family=Playfair+Display+SC:wght@400;700&' +
        'family=Bodoni+Moda:wght@400;700;900&family=DM+Serif+Display&family=Fraunces:wght@400;700;900&' +
        'family=Libre+Baskerville:wght@400;700&family=Oswald:wght@400;600;700&' +
        'family=Roboto+Condensed:wght@400;700&family=Lato:wght@300;400;700&' +
        'family=DM+Sans:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;600;700&' +
        'family=Ultra&family=Roboto+Slab:wght@400;700;900&family=Staatliches&' +
        'family=Homemade+Apple&family=Sacramento&family=Great+Vibes&family=Pinyon+Script&' +
        'family=Shadows+Into+Light&family=Caveat:wght@400;600&family=Patrick+Hand&' +
        'family=Kalam:wght@300;400&family=Indie+Flower&family=Lora:wght@400;600&' +
        'family=Tangerine:wght@400;700&family=Dancing+Script:wght@400;600;700&' +
        'family=Cormorant+Garamond:wght@300;400;600&family=Nunito:wght@300;400;600&' +
        'family=Quicksand:wght@300;400;600&' +
        'family=Nabla&family=Rubik+Glitch&family=Silkscreen&family=Press+Start+2P&' +
        'family=Monoton&family=Orbitron:wght@400;700&family=Righteous&family=Pacifico&' +
        'family=Lobster&family=Anybody:wght@400;600;800&family=Archivo+Black&' +
        'display=swap';
      document.head.appendChild(link);
    }

    vibeCanvas = $('deVibeCanvas');
    if (!vibeCanvas) return;
    vibeCtx = vibeCanvas.getContext('2d');
    var W = vibeCanvas.width, H = vibeCanvas.height;
    var PAD = 40; // label padding
    var fieldL = PAD, fieldT = PAD;
    var fieldW = W - PAD * 2, fieldH = H - PAD * 2;

    var LABELS = [
      { text: 'Clean',      x: fieldL,          y: fieldT - 10, align: 'left' },
      { text: 'Bold',       x: fieldL + fieldW, y: fieldT - 10, align: 'right' },
      { text: 'Airy',       x: fieldL,          y: fieldT + fieldH + 18, align: 'left' },
      { text: 'Expressive', x: fieldL + fieldW, y: fieldT + fieldH + 18, align: 'right' }
    ];

    function lerp(a, b, t) { return a + (b - a) * t; }

    function getVibeValues() {
      var c = VIBE_CORNERS;
      var tl = c.clean, tr = c.bold, bl = c.airy, br = c.expressive;
      var x = vibeX, y = vibeY;
      var result = {};
      var keys = Object.keys(tl);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (typeof tl[k] === 'number') {
          var top = lerp(tl[k], tr[k], x);
          var bot = lerp(bl[k], br[k], x);
          result[k] = lerp(top, bot, y);
        } else {
          // Font strings — nearest corner
          var nearX = x < 0.5 ? 0 : 1;
          var nearY = y < 0.5 ? 0 : 1;
          var corner = nearX === 0 ? (nearY === 0 ? tl : bl) : (nearY === 0 ? tr : br);
          result[k] = corner[k];
        }
      }

      // Wild font overrides at extreme positions
      var cornerName = x < 0.5 ? (y < 0.5 ? 'clean' : 'airy') : (y < 0.5 ? 'bold' : 'expressive');
      var distToCorner = Math.sqrt(
        Math.pow((x < 0.5 ? x : 1 - x), 2) +
        Math.pow((y < 0.5 ? y : 1 - y), 2)
      );
      var proximity = 1 - Math.min(1, distToCorner / 0.5); // 0 at center, 1 at corner
      var wilds = WILD_FONTS[cornerName];
      if (wilds) {
        for (var w = 0; w < wilds.length; w++) {
          if (proximity >= wilds[w].at) {
            result.displayFont = wilds[w].display;
            result.bodyFont = wilds[w].body;
            break;
          }
        }
      }

      return result;
    }

    function applyVibeToCSS() {
      var root = document.documentElement;

      // Dead zone: if near center, remove all overrides → use tokens.css defaults
      var distFromCenter = Math.sqrt((vibeX - 0.5) * (vibeX - 0.5) + (vibeY - 0.5) * (vibeY - 0.5));
      if (distFromCenter < 0.06) {
        var clearProps = [
          '--font-display', '--font-body',
          '--font-size-base', '--font-size-sm', '--font-size-xl', '--font-size-hero',
          '--fw-heading', '--fw-body', '--lh-body', '--lh-heading',
          '--ls-heading', '--ls-body', '--tt-label',
          '--space-xs', '--space-sm', '--space-md', '--space-lg',
          '--space-xl', '--space-2xl', '--space-3xl', '--radius'
        ];
        clearProps.forEach(function(p) { root.style.removeProperty(p); });
        updateVibeReadout(null);
        return;
      }

      var v = getVibeValues();

      // Blend toward defaults near center — the closer to center, the less effect
      var strength = Math.min(1, (distFromCenter - 0.06) / 0.44); // 0 at dead zone edge, 1 at corners

      // Spacing scale
      var bases = [4, 8, 12, 16, 24, 32, 48];
      var names = ['xs','sm','md','lg','xl','2xl','3xl'];
      var defaultSpacing = 1.0;
      var spacing = defaultSpacing + (v.spacing - defaultSpacing) * strength;
      for (var i = 0; i < bases.length; i++) {
        root.style.setProperty('--space-' + names[i], (bases[i] * spacing / 16).toFixed(3) + 'rem');
      }

      // Typography — blend toward defaults (fontScale=1, headingScale=~2.4 for 5.5rem hero)
      var fontScale = 1.0 + (v.fontScale - 1.0) * strength;
      var headingScale = 2.4 + (v.headingScale - 2.4) * strength;
      var subScale = 0.83 + (v.subScale - 0.83) * strength;

      var baseSize = Math.min(1.5, 1.05 * fontScale);
      var heroSize = Math.min(7, baseSize * headingScale);
      var xlSize = Math.min(3.5, baseSize * headingScale * 0.5);
      var smSize = Math.max(0.5, baseSize * subScale);
      root.style.setProperty('--font-size-base', baseSize.toFixed(2) + 'rem');
      root.style.setProperty('--font-size-sm', smSize.toFixed(2) + 'rem');
      root.style.setProperty('--font-size-xl', xlSize.toFixed(2) + 'rem');
      root.style.setProperty('--font-size-hero', heroSize.toFixed(1) + 'rem');

      // Fonts — only override when strength is past threshold
      if (strength > 0.3) {
        root.style.setProperty('--font-display', v.displayFont);
        root.style.setProperty('--font-body', v.bodyFont);
      } else {
        root.style.removeProperty('--font-display');
        root.style.removeProperty('--font-body');
      }

      // Letter spacing — blend from default (0)
      var ls = v.letterSpacing * strength;
      var lsBody = v.bodyLetterSpacing * strength;
      root.style.setProperty('--ls-heading', ls.toFixed(3) + 'em');
      root.style.setProperty('--ls-body', lsBody.toFixed(3) + 'em');

      // Line heights — blend from defaults (1.05 heading, 1.6 body)
      var lhBody = 1.6 + (v.lineHeight - 1.6) * strength;
      var lhHeading = 1.05 + (v.headingLineHeight - 1.05) * strength;
      root.style.setProperty('--lh-body', lhBody.toFixed(2));
      root.style.setProperty('--lh-heading', lhHeading.toFixed(2));

      // Font weight — blend from default (400 heading, 400 body)
      var fw = Math.round(400 + (v.fontWeight - 400) * strength);
      root.style.setProperty('--fw-heading', fw);
      root.style.setProperty('--fw-body', Math.round(Math.min(fw, 500)));

      // Text transform — only at strong strength
      root.style.setProperty('--tt-label', strength > 0.5 ? v.textTransform : 'none');

      // Border radius — blend from default (~6px)
      var radius = Math.round(6 + (v.radius - 6) * strength);
      root.style.setProperty('--radius', radius + 'px');

      updateVibeReadout(v);
      markChanged();
    }

    function updateVibeReadout(v) {
      var el = $('deVibeReadout');
      if (!el) return;

      // At center = default
      if (!v) {
        el.innerHTML = '<div class="de-vibe-stat de-vibe-stat-wide">' +
          '<span class="de-vibe-stat-label">Vibe</span>' +
          '<span class="de-vibe-stat-value">Default</span></div>';
        return;
      }

      var qName = vibeX < 0.5
        ? (vibeY < 0.5 ? 'Clean' : 'Airy')
        : (vibeY < 0.5 ? 'Bold' : 'Expressive');
      var dist = Math.max(Math.abs(vibeX - 0.5), Math.abs(vibeY - 0.5)) * 2;
      var pct = Math.round(dist * 100);

      var displayName = v.displayFont.split("'")[1] || 'System';
      var bodyName = v.bodyFont.split("'")[1] || 'System';

      el.innerHTML =
        '<div class="de-vibe-stat de-vibe-stat-wide">' +
          '<span class="de-vibe-stat-label">Vibe</span>' +
          '<span class="de-vibe-stat-value">' + qName + (pct > 15 ? ' ' + pct + '%' : '') + '</span>' +
        '</div>' +
        '<div class="de-vibe-stat de-vibe-stat-wide">' +
          '<span class="de-vibe-stat-label">Display</span>' +
          '<span class="de-vibe-stat-value" style="font-family:' + v.displayFont + ';font-weight:' + Math.round(v.fontWeight) + ';">' + displayName + '</span>' +
        '</div>' +
        '<div class="de-vibe-stat">' +
          '<span class="de-vibe-stat-label">Body</span>' +
          '<span class="de-vibe-stat-value">' + bodyName + '</span>' +
        '</div>' +
        '<div class="de-vibe-stat">' +
          '<span class="de-vibe-stat-label">H/B Ratio</span>' +
          '<span class="de-vibe-stat-value">' + v.headingScale.toFixed(1) + 'x</span>' +
        '</div>' +
        '<div class="de-vibe-stat">' +
          '<span class="de-vibe-stat-label">Spacing</span>' +
          '<span class="de-vibe-stat-value">' + v.spacing.toFixed(1) + 'x</span>' +
        '</div>' +
        '<div class="de-vibe-stat">' +
          '<span class="de-vibe-stat-label">Weight</span>' +
          '<span class="de-vibe-stat-value">' + Math.round(v.fontWeight) + '</span>' +
        '</div>' +
        '<div class="de-vibe-stat">' +
          '<span class="de-vibe-stat-label">Leading</span>' +
          '<span class="de-vibe-stat-value">' + v.headingLineHeight.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="de-vibe-stat">' +
          '<span class="de-vibe-stat-label">Radius</span>' +
          '<span class="de-vibe-stat-value">' + Math.round(v.radius) + 'px</span>' +
        '</div>';
    }

    function draw() {
      vibeCtx.clearRect(0, 0, W, H);

      // Gradient field — each corner gets a tinted glow
      var grd = vibeCtx.createRadialGradient(fieldL, fieldT, 0, fieldL, fieldT, fieldW * 0.7);
      grd.addColorStop(0, 'rgba(100, 130, 200, 0.08)'); grd.addColorStop(1, 'transparent');
      vibeCtx.fillStyle = grd; vibeCtx.fillRect(0, 0, W, H);

      var grd2 = vibeCtx.createRadialGradient(fieldL + fieldW, fieldT, 0, fieldL + fieldW, fieldT, fieldW * 0.7);
      grd2.addColorStop(0, 'rgba(200, 80, 80, 0.06)'); grd2.addColorStop(1, 'transparent');
      vibeCtx.fillStyle = grd2; vibeCtx.fillRect(0, 0, W, H);

      var grd3 = vibeCtx.createRadialGradient(fieldL, fieldT + fieldH, 0, fieldL, fieldT + fieldH, fieldW * 0.7);
      grd3.addColorStop(0, 'rgba(80, 180, 140, 0.06)'); grd3.addColorStop(1, 'transparent');
      vibeCtx.fillStyle = grd3; vibeCtx.fillRect(0, 0, W, H);

      var grd4 = vibeCtx.createRadialGradient(fieldL + fieldW, fieldT + fieldH, 0, fieldL + fieldW, fieldT + fieldH, fieldW * 0.7);
      grd4.addColorStop(0, 'rgba(200, 140, 60, 0.06)'); grd4.addColorStop(1, 'transparent');
      vibeCtx.fillStyle = grd4; vibeCtx.fillRect(0, 0, W, H);

      // Grid lines
      vibeCtx.strokeStyle = 'rgba(0,0,0,0.06)';
      vibeCtx.lineWidth = 1;
      // Crosshair through center
      vibeCtx.beginPath();
      vibeCtx.moveTo(fieldL + fieldW / 2, fieldT);
      vibeCtx.lineTo(fieldL + fieldW / 2, fieldT + fieldH);
      vibeCtx.stroke();
      vibeCtx.beginPath();
      vibeCtx.moveTo(fieldL, fieldT + fieldH / 2);
      vibeCtx.lineTo(fieldL + fieldW, fieldT + fieldH / 2);
      vibeCtx.stroke();

      // Field border
      vibeCtx.strokeStyle = 'rgba(0,0,0,0.08)';
      vibeCtx.lineWidth = 1;
      vibeCtx.strokeRect(fieldL, fieldT, fieldW, fieldH);

      // Corner labels
      vibeCtx.font = '600 10px Inter, system-ui, sans-serif';
      for (var i = 0; i < LABELS.length; i++) {
        var lb = LABELS[i];
        vibeCtx.textAlign = lb.align;
        vibeCtx.fillStyle = 'rgba(0,0,0,0.3)';
        vibeCtx.fillText(lb.text, lb.x, lb.y);
      }

      // Dot position
      var dotX = fieldL + vibeX * fieldW;
      var dotY = fieldT + vibeY * fieldH;

      // Crosshair from dot
      vibeCtx.strokeStyle = 'rgba(100, 80, 160, 0.15)';
      vibeCtx.lineWidth = 1;
      vibeCtx.setLineDash([3, 3]);
      vibeCtx.beginPath();
      vibeCtx.moveTo(dotX, fieldT); vibeCtx.lineTo(dotX, fieldT + fieldH);
      vibeCtx.stroke();
      vibeCtx.beginPath();
      vibeCtx.moveTo(fieldL, dotY); vibeCtx.lineTo(fieldL + fieldW, dotY);
      vibeCtx.stroke();
      vibeCtx.setLineDash([]);

      // Glow
      var glow = vibeCtx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 24);
      glow.addColorStop(0, 'rgba(100, 80, 180, 0.15)');
      glow.addColorStop(1, 'transparent');
      vibeCtx.fillStyle = glow;
      vibeCtx.fillRect(dotX - 30, dotY - 30, 60, 60);

      // Dot
      vibeCtx.beginPath();
      vibeCtx.arc(dotX, dotY, vibeDragging ? 9 : 7, 0, Math.PI * 2);
      vibeCtx.fillStyle = 'oklch(0.55 0.20 275)';
      vibeCtx.fill();
      vibeCtx.beginPath();
      vibeCtx.arc(dotX, dotY, vibeDragging ? 3.5 : 2.5, 0, Math.PI * 2);
      vibeCtx.fillStyle = '#fff';
      vibeCtx.fill();
    }

    // Pointer events
    vibeCanvas.addEventListener('pointerdown', function(e) {
      var rect = vibeCanvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      var my = (e.clientY - rect.top) * (H / rect.height);
      // Check if near the dot
      var dotX = fieldL + vibeX * fieldW;
      var dotY = fieldT + vibeY * fieldH;
      var dist = Math.sqrt((mx - dotX) * (mx - dotX) + (my - dotY) * (my - dotY));
      if (dist < 25) {
        vibeDragging = true;
        vibeCanvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    });

    vibeCanvas.addEventListener('pointermove', function(e) {
      var rect = vibeCanvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      var my = (e.clientY - rect.top) * (H / rect.height);

      if (vibeDragging) {
        vibeX = Math.max(0, Math.min(1, (mx - fieldL) / fieldW));
        vibeY = Math.max(0, Math.min(1, (my - fieldT) / fieldH));
        applyVibeToCSS();
        draw();
      } else {
        // Hover cursor
        var dotX = fieldL + vibeX * fieldW;
        var dotY = fieldT + vibeY * fieldH;
        var dist = Math.sqrt((mx - dotX) * (mx - dotX) + (my - dotY) * (my - dotY));
        vibeCanvas.style.cursor = dist < 25 ? 'grab' : 'default';
      }
    });

    vibeCanvas.addEventListener('pointerup', function() { vibeDragging = false; draw(); });
    vibeCanvas.addEventListener('pointerleave', function() { vibeDragging = false; draw(); });

    // ── Deck Hue Slider ──────────────────────────────────────
    var hueSlider = $('deVibeHue');
    var hueVal = $('deVibeHueVal');
    if (hueSlider) {
      hueSlider.addEventListener('input', function() {
        deckHue = parseInt(hueSlider.value, 10);
        applyDeckHue();
        hueVal.textContent = deckHue === 0 ? 'Default' : deckHue + '°';
        markChanged();
      });
    }

    function applyDeckHue() {
      var root = document.documentElement;
      if (deckHue === 0) {
        // Reset to defaults
        root.style.removeProperty('--color-signal');
        root.style.removeProperty('--color-signal-dim');
        root.style.removeProperty('--color-accent');
        root.style.removeProperty('--color-accent-dim');
        root.style.removeProperty('--color-bg');
        root.style.removeProperty('--color-bg-subtle');
        root.style.removeProperty('--color-surface');
        root.style.removeProperty('--color-text');
        root.style.removeProperty('--color-text-muted');
        return;
      }
      var h = deckHue;
      // Signal/accent color — the primary brand color
      root.style.setProperty('--color-signal', 'oklch(0.58 0.22 ' + h + ')');
      root.style.setProperty('--color-signal-dim', 'oklch(0.58 0.22 ' + h + ' / 0.2)');
      root.style.setProperty('--color-accent', 'oklch(0.88 0.04 ' + h + ')');
      root.style.setProperty('--color-accent-dim', 'oklch(0.88 0.04 ' + h + ' / 0.15)');
      // Tint the backgrounds
      root.style.setProperty('--color-bg', 'oklch(0.10 0.01 ' + h + ')');
      root.style.setProperty('--color-bg-subtle', 'oklch(0.13 0.012 ' + h + ')');
      root.style.setProperty('--color-surface', 'oklch(0.16 0.014 ' + h + ')');
      // Tint text
      root.style.setProperty('--color-text', 'oklch(0.93 0.008 ' + h + ')');
      root.style.setProperty('--color-text-muted', 'oklch(0.60 0.01 ' + h + ')');
    }

    // Initial draw + apply
    applyVibeToCSS();
    draw();
  }

  // ── Theme Strip ────────────────────────────────────────────
  function wireEditorTheme() {
    var sel = $('deEditorTheme');
    if (!sel) return;

    var THEMES = {
      light: {
        '--de-surf-0': 'oklch(0.96 0.006 265)', '--de-surf-1': 'oklch(0.98 0.004 265)',
        '--de-surf-2': 'oklch(0.94 0.007 265)', '--de-surf-3': 'oklch(0.91 0.009 265)',
        '--de-border': 'oklch(0.88 0.008 265)', '--de-border-s': 'oklch(0.84 0.010 265)',
        '--de-text-1': 'oklch(0.22 0.012 265)', '--de-text-2': 'oklch(0.48 0.010 265)',
        '--de-text-3': 'oklch(0.64 0.008 265)',
        '--de-accent': 'oklch(0.55 0.20 275)', '--de-accent-bg': 'oklch(0.93 0.04 275)',
        '--de-accent-bgh': 'oklch(0.89 0.06 275)'
      },
      dark: {
        '--de-surf-0': 'oklch(0.12 0.008 265)', '--de-surf-1': 'oklch(0.15 0.010 265)',
        '--de-surf-2': 'oklch(0.18 0.012 265)', '--de-surf-3': 'oklch(0.23 0.014 265)',
        '--de-border': 'oklch(0.22 0.008 265)', '--de-border-s': 'oklch(0.28 0.010 265)',
        '--de-text-1': 'oklch(0.92 0.008 265)', '--de-text-2': 'oklch(0.60 0.008 265)',
        '--de-text-3': 'oklch(0.42 0.006 265)',
        '--de-accent': 'oklch(0.72 0.18 275)', '--de-accent-bg': 'oklch(0.22 0.05 275)',
        '--de-accent-bgh': 'oklch(0.27 0.07 275)'
      },
      rose: {
        '--de-surf-0': 'oklch(0.95 0.008 350)', '--de-surf-1': 'oklch(0.97 0.006 350)',
        '--de-surf-2': 'oklch(0.93 0.010 350)', '--de-surf-3': 'oklch(0.90 0.012 350)',
        '--de-border': 'oklch(0.87 0.010 350)', '--de-border-s': 'oklch(0.83 0.012 350)',
        '--de-text-1': 'oklch(0.25 0.015 350)', '--de-text-2': 'oklch(0.48 0.012 350)',
        '--de-text-3': 'oklch(0.64 0.010 350)',
        '--de-accent': 'oklch(0.55 0.18 340)', '--de-accent-bg': 'oklch(0.92 0.04 340)',
        '--de-accent-bgh': 'oklch(0.88 0.06 340)'
      }
    };

    sel.addEventListener('change', function() {
      var theme = THEMES[sel.value];
      if (!theme) return;
      var root = document.documentElement;
      Object.keys(theme).forEach(function(k) {
        root.style.setProperty(k, theme[k]);
      });
    });
  }

  // ── Bottom Bar Swatches ────────────────────────────────────
  function buildSwatches() {
    var container = $('deBBSwatches');
    if (!container) return;
    var colors = [
      { hex: '#ff3b3b', color: 'oklch(0.63 0.26 25)' },
      { hex: '#3b82f6', color: 'oklch(0.65 0.20 260)' },
      { hex: '#22c55e', color: 'oklch(0.70 0.18 150)' },
      { hex: '#facc15', color: 'oklch(0.82 0.18 95)' },
      { hex: '#ffffff', color: 'oklch(0.96 0.005 0)' },
      { hex: '#a78bfa', color: 'oklch(0.72 0.18 285)' }
    ];

    colors.forEach(function(c, i) {
      var sw = document.createElement('div');
      sw.className = 'de-bb-swatch' + (i === 0 ? ' active' : '');
      sw.style.background = c.color;
      sw.dataset.color = c.hex;
      if (c.hex === '#ffffff') sw.style.borderColor = 'var(--de-border-s)';
      sw.addEventListener('click', function() {
        qsa('.de-bb-swatch').forEach(function(s) { s.classList.remove('active'); });
        sw.classList.add('active');
        if (window.PRES && window.PRES.annotate) {
          window.PRES.annotate.setColor(c.hex);
        }
      });
      container.appendChild(sw);
    });
  }

  // ── Wire Bottom Bar ────────────────────────────────────────
  function wireBottomBar() {
    var segBtns = qsa('.de-seg-btn');
    var segIndicator = $('deSegIndicator');
    var detail = $('deBBDetail');
    var selectBtn = qs('.de-bb-btn[data-tool="select"]');

    // Helper: move segmented indicator to the active button
    function moveIndicator(btn) {
      var idx = segBtns.indexOf(btn);
      if (idx < 0) idx = 0;
      segIndicator.style.transform = 'translateX(' + (idx * 34) + 'px)';
    }

    // Helper: update detail visibility (hide for eraser)
    function updateDetail() {
      if (activeTool === 'eraser') {
        detail.classList.remove('visible');
      } else {
        detail.classList.add('visible');
      }
    }

    // Select tool (standalone button)
    selectBtn.addEventListener('click', function() {
      activeTool = 'select';
      selectBtn.classList.add('active');
      segBtns.forEach(function(b) { b.classList.remove('active'); });
      detail.classList.add('visible');
      if (window.PRES && window.PRES.annotate) window.PRES.annotate.hide();
      updateFreezeLayer();
    });

    // Segmented control: pen / text / eraser
    segBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        activeTool = btn.dataset.tool;
        selectBtn.classList.remove('active');
        segBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        moveIndicator(btn);
        updateDetail();

        if (activeTool !== 'select' && selectedEl) deselectElement();

        if (window.PRES && window.PRES.annotate) {
          if (activeTool === 'pen') {
            window.PRES.annotate.init();
            window.PRES.annotate.show();
          } else {
            window.PRES.annotate.hide();
          }
        }
        updateFreezeLayer();
      });
    });

    // Initialize indicator position
    moveIndicator(segBtns[0]);

    // Size dots
    qsa('.de-bb-size').forEach(function(dot) {
      dot.addEventListener('click', function() {
        qsa('.de-bb-size').forEach(function(d) { d.classList.remove('active'); });
        dot.classList.add('active');
        var sz = parseInt(dot.dataset.sz, 10) || 6;
        if (window.PRES && window.PRES.annotate) {
          window.PRES.annotate.setSize(sz);
        }
      });
    });

    // Undo / clear
    $('deBBUndo').addEventListener('click', function() {
      if (window.PRES && window.PRES.annotate && window.PRES.annotate.undo) window.PRES.annotate.undo();
    });
    $('deBBClear').addEventListener('click', function() {
      if (window.PRES && window.PRES.annotate) window.PRES.annotate.clear();
      // Also remove text annotations
      qsa('.de-text-annotation').forEach(function(el) { el.remove(); });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (!active || isTyping(e)) return;
      var map = { v: 'select', p: 'pen', t: 'text', e: 'eraser' };
      var tool = map[e.key.toLowerCase()];
      if (tool) {
        if (tool === 'select') {
          selectBtn.click();
        } else {
          var btn = qs('.de-seg-btn[data-tool="' + tool + '"]');
          if (btn) btn.click();
        }
      }
    });
  }

  // ── Text Annotation Tool ──────────────────────────────────
  function initTextTool() {
    document.addEventListener('click', function(e) {
      if (!active || activeTool !== 'text') return;
      if (isEditorChrome(e.target)) return;

      var cont = getContainer();
      if (!cont) return;
      var contRect = cont.getBoundingClientRect();

      // Only create text in the slide area
      if (e.clientX < contRect.left || e.clientX > contRect.right ||
          e.clientY < contRect.top || e.clientY > contRect.bottom) return;

      // Get current pen color
      var activeSwatchEl = qs('.de-bb-swatch.active');
      var color = activeSwatchEl ? activeSwatchEl.dataset.color || '#ff3b3b' : '#ff3b3b';

      // Position relative to container (in slide coordinates)
      var scaleRatio = contRect.width / 1920;
      var sx = (e.clientX - contRect.left) / scaleRatio;
      var sy = (e.clientY - contRect.top) / scaleRatio;

      var textEl = document.createElement('div');
      textEl.className = 'de-text-annotation';
      textEl.contentEditable = 'true';
      textEl.style.cssText =
        'position:absolute;z-index:99989;' +
        'left:' + sx + 'px;top:' + sy + 'px;' +
        'color:' + color + ';' +
        'font-family:Inter,system-ui,sans-serif;font-size:24px;font-weight:700;' +
        'background:none;border:none;outline:none;' +
        'min-width:40px;padding:2px 4px;' +
        'cursor:text;white-space:pre;';
      textEl.setAttribute('data-placeholder', 'Type here…');

      cont.appendChild(textEl);

      // Focus and select
      requestAnimationFrame(function() {
        textEl.focus();
      });

      // Remove if empty on blur
      textEl.addEventListener('blur', function() {
        if (!textEl.textContent.trim()) {
          textEl.remove();
        }
      });

      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  // ── Export ─────────────────────────────────────────────────
  function wireExport() {
    var panel = $('deExport');
    $('deExportBtn').addEventListener('click', function() {
      buildExportContent();
      panel.classList.toggle('open');
    });
    $('deExportClose').addEventListener('click', function() { panel.classList.remove('open'); });

    $('deExportCopy').addEventListener('click', function() {
      var text = generatePlainExport();
      navigator.clipboard.writeText(text).then(function() {
        flashBtn($('deExportCopy'), '✓ Copied');
      });
    });

    $('deExportSS').addEventListener('click', function() {
      // Hide all editor chrome so only the slide + annotations are captured
      var panel = $('deExport');
      panel.classList.remove('open');

      var editorEls = qsa('.de-panel-left, .de-panel-right, .de-bottom-bar, .de-export, .de-mode-pill, #deHighlight, #deSelOverlay');
      editorEls.forEach(function(el) { el.style.visibility = 'hidden'; });

      // Brief delay so DOM updates, then capture
      setTimeout(function() {
        if (window.PRES && window.PRES.annotate) {
          window.PRES.annotate.capture();
        }
        // Restore chrome after capture
        setTimeout(function() {
          editorEls.forEach(function(el) { el.style.visibility = ''; });
        }, 200);
      }, 100);
    });
  }

  function buildExportContent() {
    var chips = $('deExportChips');
    var pre = $('deExportPre');
    var changes = detectChanges();
    var hasTheme = !!changes.theme;
    var hasVibe = !!changes.vibe;
    var hasLocal = changes.local.length > 0;

    var ch = '';
    if (hasTheme) ch += '<span class="de-export-chip changed">Theme: ' + changes.theme.to + '</span>';
    if (hasVibe) ch += '<span class="de-export-chip changed">Vibe: ' + changes.vibe.quadrant + '</span>';
    if (hasLocal) ch += '<span class="de-export-chip changed">Element overrides</span>';
    if (!hasTheme && !hasVibe && !hasLocal) ch += '<span class="de-export-chip">No changes</span>';
    chips.innerHTML = ch;

    pre.textContent = generatePlainExport();
  }

  function detectChanges() {
    var changes = { theme: null, vibe: null, local: [] };

    // Theme
    if (currentTheme.name !== defaultTheme.name) {
      changes.theme = { from: defaultTheme.name, to: currentTheme.name,
        hue: currentTheme.hue, c: currentTheme.c, aL: currentTheme.aL };
    }

    // Vibe matrix
    if (Math.abs(vibeX - vibeDefault.x) > 0.03 || Math.abs(vibeY - vibeDefault.y) > 0.03) {
      var qName = vibeX < 0.5
        ? (vibeY < 0.5 ? 'Clean' : 'Airy')
        : (vibeY < 0.5 ? 'Bold' : 'Expressive');
      // Read current computed values from root
      var root = document.documentElement;
      var cs = getComputedStyle(root);
      changes.vibe = {
        quadrant: qName,
        x: vibeX.toFixed(2), y: vibeY.toFixed(2),
        displayFont: cs.getPropertyValue('--font-display').trim(),
        bodyFont: cs.getPropertyValue('--font-body').trim(),
        heroSize: cs.getPropertyValue('--font-size-hero').trim(),
        baseSize: cs.getPropertyValue('--font-size-base').trim(),
        smSize: cs.getPropertyValue('--font-size-sm').trim(),
        xlSize: cs.getPropertyValue('--font-size-xl').trim(),
        headingWeight: cs.getPropertyValue('--fw-heading').trim(),
        headingLH: cs.getPropertyValue('--lh-heading').trim(),
        bodyLH: cs.getPropertyValue('--lh-body').trim(),
        lsHeading: cs.getPropertyValue('--ls-heading').trim(),
        lsBody: cs.getPropertyValue('--ls-body').trim(),
        ttLabel: cs.getPropertyValue('--tt-label').trim(),
        spacing: cs.getPropertyValue('--space-md').trim(),
        radius: cs.getPropertyValue('--radius').trim()
      };
    }

    // Local element overrides
    if (selectedEl && origStyles.has(selectedEl)) {
      var orig = origStyles.get(selectedEl);
      var cur = selectedEl.getAttribute('style') || '';
      if (orig !== cur) {
        changes.local.push({
          selector: elLabel(selectedEl),
          slide: (window.PRES ? window.PRES.currentIndex + 1 : '?'),
          origStyle: orig,
          newStyle: cur
        });
      }
    }

    return changes;
  }

  function generatePlainExport() {
    var changes = detectChanges();
    var hasTheme = !!changes.theme;
    var hasVibe = !!changes.vibe;
    var hasLocal = changes.local.length > 0;

    if (!hasTheme && !hasVibe && !hasLocal) {
      return 'No design changes to export.\nDrag the vibe matrix or select an element to make changes.';
    }

    var t = '## Design Editor Changes\n';
    t += 'Source: Live Design Editor (presentation tool)\n';
    t += 'Scope: ' + (hasLocal ? 'Global + Local element overrides' : 'Global design tokens') + '\n';
    t += 'Slide: ' + (window.PRES ? window.PRES.currentIndex + 1 : '?') + ' / ' +
         (window.PRES ? window.PRES.totalSlides : '?') + '\n\n';

    t += '### Context\n';
    t += 'These changes were made in the presentation\'s live design editor.\n';
    t += 'Apply token changes to CSS custom properties in css/tokens.css.\n';
    t += 'Apply element overrides as inline styles on the specified elements in index.html.\n\n';

    if (hasTheme) {
      t += '### Theme Change\n';
      t += 'Category: Editor accent color\n';
      t += 'From: ' + changes.theme.from + '  →  To: ' + changes.theme.to + '\n\n';
    }

    if (hasVibe) {
      var v = changes.vibe;
      t += '### Vibe: ' + v.quadrant + '\n';
      t += 'Position: x=' + v.x + ' y=' + v.y + '\n';
      t += 'File: css/tokens.css (:root block)\n\n';
      t += 'Typography:\n';
      t += '  --font-display: ' + v.displayFont + '\n';
      t += '  --font-body: ' + v.bodyFont + '\n';
      t += '  --font-size-hero: ' + v.heroSize + '\n';
      t += '  --font-size-xl: ' + v.xlSize + '\n';
      t += '  --font-size-base: ' + v.baseSize + '\n';
      t += '  --font-size-sm: ' + v.smSize + '\n';
      t += '  --fw-heading: ' + v.headingWeight + '\n';
      t += '  --lh-heading: ' + v.headingLH + '\n';
      t += '  --lh-body: ' + v.bodyLH + '\n';
      t += '  --ls-heading: ' + v.lsHeading + '\n';
      t += '  --ls-body: ' + v.lsBody + '\n';
      t += '  --tt-label: ' + v.ttLabel + '\n\n';
      t += 'Spacing & Layout:\n';
      t += '  --space-md: ' + v.spacing + '\n';
      t += '  --radius: ' + v.radius + '\n\n';
    }

    if (hasLocal) {
      t += '### Element Overrides\n';
      changes.local.forEach(function(l) {
        t += 'Element: ' + l.selector + ' (slide ' + l.slide + ')\n';
        t += 'Original style: ' + (l.origStyle || '(none)') + '\n';
        t += 'New style: ' + l.newStyle + '\n';
      });
      t += '\n';
    }

    t += '### Instructions for Agent\n';
    if (hasVibe) t += '- Update CSS custom properties in css/tokens.css :root block with all values above\n';
    if (hasVibe) t += '- Add Google Font imports for: ' + (changes.vibe.displayFont.split("'")[1] || '') + ', ' + (changes.vibe.bodyFont.split("'")[1] || '') + '\n';
    if (hasLocal) t += '- Apply inline style changes to the specified element in index.html\n';
    if (hasTheme) t += '- Update editor accent color variables in css/design-editor.css\n';
    t += '- Test that changes cascade correctly through the component system\n';

    return t;
  }

  function flashBtn(el, msg) {
    var orig = el.textContent;
    el.textContent = msg;
    el.classList.add('copied');
    setTimeout(function() { el.textContent = orig; el.classList.remove('copied'); }, 1600);
  }

  // ── Slide Scaling ───────────────────────────────────────────
  // Directly control slidesContainer transform when editor is open
  var DE_LEFT = 264, DE_RIGHT = 288, DE_BOTTOM = 48, DE_PAD = 24;

  function scaleSlideForEditor() {
    var container = getContainer();
    if (!container) return;

    var stageW = window.innerWidth - DE_LEFT - DE_RIGHT;
    var stageH = window.innerHeight - DE_BOTTOM;
    var availW = stageW - DE_PAD * 2;
    var availH = stageH - DE_PAD * 2;
    var scale = Math.min(availW / 1920, availH / 1080);
    var x = DE_LEFT + Math.round((stageW - 1920 * scale) / 2);
    var y = Math.round((stageH - 1080 * scale) / 2);

    container.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    container.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  }

  function scaleSlideNormal() {
    var container = getContainer();
    if (!container) return;
    var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    var x = Math.round((window.innerWidth - 1920 * scale) / 2);
    var y = Math.round((window.innerHeight - 1080 * scale) / 2);

    container.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    container.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  }

  // ── CSS Snapshot (save/restore on open/close) ───────────────
  var TOKEN_PROPS = [
    '--font-display', '--font-body',
    '--font-size-base', '--font-size-sm', '--font-size-xl', '--font-size-hero',
    '--fw-heading', '--fw-body', '--lh-body', '--lh-heading',
    '--ls-heading', '--ls-body', '--tt-label',
    '--space-xs', '--space-sm', '--space-md', '--space-lg',
    '--space-xl', '--space-2xl', '--space-3xl',
    '--radius',
    '--color-signal', '--color-signal-dim', '--color-accent', '--color-accent-dim',
    '--color-bg', '--color-bg-subtle', '--color-surface',
    '--color-text', '--color-text-muted'
  ];
  var snapshot = {};

  function takeSnapshot() {
    var root = document.documentElement;
    var cs = getComputedStyle(root);
    snapshot = {};
    TOKEN_PROPS.forEach(function(p) {
      snapshot[p] = root.style.getPropertyValue(p); // inline override (may be empty)
    });
  }

  function restoreSnapshot() {
    var root = document.documentElement;
    TOKEN_PROPS.forEach(function(p) {
      if (snapshot[p]) {
        root.style.setProperty(p, snapshot[p]);
      } else {
        root.style.removeProperty(p);
      }
    });
    // Reset vibe position
    vibeX = vibeDefault.x;
    vibeY = vibeDefault.y;
    deckHue = 0;
  }

  function closeEditor() {
    active = false;
    document.body.classList.remove('de-active');
    deselectElement();
    highlight.style.display = 'none';
    if (window.PRES && window.PRES.annotate) window.PRES.annotate.hide();
    var exp = $('deExport');
    if (exp) exp.classList.remove('open');
    updateFreezeLayer();
    resetChangeTracking();

    // If "keep changes" is unchecked, revert to snapshot
    var keepCheck = $('dePreviewCheck');
    if (!keepCheck || !keepCheck.checked) {
      restoreSnapshot();
    }

    requestAnimationFrame(function() { scaleSlideNormal(); });
  }

  // ── Toggle ─────────────────────────────────────────────────
  function toggle() {
    if (active) {
      closeEditor();
      return;
    }

    active = true;
    if (!shellBuilt) buildShell();

    document.body.classList.add('de-active');
    activeTool = 'select';
    takeSnapshot();
    buildSlideNav();
    buildLayerTree();
    if (window.PRES && window.PRES.annotate) {
      window.PRES.annotate.init();
      window.PRES.annotate.hide();
    }
    requestAnimationFrame(function() { scaleSlideForEditor(); });
    updateFreezeLayer();
  }

  // Keep slide scaled when window resizes during editor mode
  window.addEventListener('resize', function() {
    if (active) scaleSlideForEditor();
  });

  // ── Slide change listener ──────────────────────────────────
  document.addEventListener('slidechange', function() {
    // Always clear annotations + text labels on slide change
    if (window.PRES && window.PRES.annotate) window.PRES.annotate.clear();
    qsa('.de-text-annotation').forEach(function(el) { el.remove(); });

    if (!active) return;
    deselectElement();
    buildSlideNav();
    buildLayerTree();
  });

  // ── Keybindings ────────────────────────────────────────────
  function isTyping(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return true;
    if (e.target.contentEditable === 'true' || e.target.isContentEditable) return true;
    return false;
  }

  document.addEventListener('keydown', function(e) {
    // Always allow Escape
    if (e.key === 'Escape' && active) {
      // If typing in a text annotation, just blur it
      if (isTyping(e)) { e.target.blur(); return; }
      if ($('deExport').classList.contains('open')) {
        $('deExport').classList.remove('open');
      } else if (selectedEl) {
        deselectElement();
      }
      return;
    }

    // Don't intercept keys while typing in inputs or text annotations
    if (isTyping(e)) return;

    // D toggles the editor
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); toggle(); }
  });

  console.log('[DesignEditor v5] Ready — press D to toggle');
})();
