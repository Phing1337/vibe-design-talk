/**
 * annotate.js — Slide annotation / markup overlay
 *
 * Draws on a canvas that sits inside #slidesContainer at 1920×1080.
 * Exposes a narrow API consumed by design-editor-v4.js:
 *   PRES.annotate.init()
 *   PRES.annotate.show()
 *   PRES.annotate.hide()
 *   PRES.annotate.clear()
 *   PRES.annotate.capture()   → copies annotated slide to clipboard
 *   PRES.annotate.isActive()
 *   PRES.annotate.buildToolbar(parentEl)
 */
(function () {
  'use strict';

  var DESIGN_W = 1920;
  var DESIGN_H = 1080;

  // State
  var canvas = null;
  var ctx = null;
  var toolbar = null;
  var isVisible = false;
  var drawing = false;
  var strokes = [];       // finished strokes
  var currentStroke = null; // in-progress

  // Tool settings
  var penColor = '#ff3b3b';
  var penSize = 4;
  var tool = 'pen'; // 'pen' or 'marker'
  var showLabels = false;
  var labelOverlays = []; // DOM elements for labels

  var COLORS = [
    { name: 'Red',    hex: '#ff3b3b' },
    { name: 'Blue',   hex: '#3b82f6' },
    { name: 'Green',  hex: '#22c55e' },
    { name: 'Yellow', hex: '#facc15' },
    { name: 'White',  hex: '#ffffff' },
    { name: 'Purple', hex: '#a78bfa' },
  ];

  var SIZES = [
    { label: 'S', value: 3 },
    { label: 'M', value: 6 },
    { label: 'L', value: 12 },
  ];

  // ── Helpers ──────────────────────────────────────────────────

  function getContainer() {
    return document.getElementById('slidesContainer');
  }

  /** Convert a pointer event to 1920×1080 slide-native coords */
  function toSlideCoords(e) {
    var cont = getContainer();
    if (!cont) return { x: 0, y: 0 };
    var rect = cont.getBoundingClientRect();
    var scaleX = DESIGN_W / rect.width;
    var scaleY = DESIGN_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY
    };
  }

  // ── Canvas Setup ─────────────────────────────────────────────

  function createCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'annotateCanvas';
    canvas.width = DESIGN_W;
    canvas.height = DESIGN_H;
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;' +
      'z-index:99990;pointer-events:none;cursor:crosshair;';
    getContainer().appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Pointer events on the canvas for drawing
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup',   onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
  }

  // ── Drawing ──────────────────────────────────────────────────

  function onPointerDown(e) {
    if (!isVisible) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    canvas.setPointerCapture(e.pointerId);
    drawing = true;

    var pt = toSlideCoords(e);
    currentStroke = {
      tool: tool,
      color: penColor,
      size: penSize,
      opacity: tool === 'marker' ? 0.45 : 1,
      points: [pt]
    };
  }

  function onPointerMove(e) {
    if (!drawing || !currentStroke) return;
    e.preventDefault();
    e.stopPropagation();
    var pt = toSlideCoords(e);
    currentStroke.points.push(pt);
    redraw();
  }

  function onPointerUp(e) {
    if (!drawing) return;
    e.preventDefault();
    e.stopPropagation();
    if (currentStroke && currentStroke.points.length > 1) {
      strokes.push(currentStroke);
    }
    currentStroke = null;
    drawing = false;
    redraw();
  }

  function redraw() {
    ctx.clearRect(0, 0, DESIGN_W, DESIGN_H);
    // Draw finished strokes
    for (var i = 0; i < strokes.length; i++) {
      drawStroke(strokes[i]);
    }
    // Draw in-progress stroke
    if (currentStroke) {
      drawStroke(currentStroke);
    }
  }

  function drawStroke(s) {
    if (s.points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (s.tool === 'marker') {
      ctx.lineWidth = s.size * 3;
    }

    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (var i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Element Labels ───────────────────────────────────────────

  function getElementLabel(el) {
    var tag = el.tagName.toLowerCase();
    var parts = [tag];
    if (el.id) parts.push('#' + el.id);
    if (el.classList.length) {
      var cls = Array.from(el.classList)
        .filter(function(c) { return c !== 'active' && c !== 'slide' && !c.startsWith('ann-'); })
        .slice(0, 2)
        .map(function(c) { return '.' + c; })
        .join('');
      if (cls) parts.push(cls);
    }
    return parts.join('');
  }

  function addLabels() {
    removeLabels();
    var activeSlide = document.querySelector('.slide.active');
    if (!activeSlide) return;
    var cont = getContainer();
    if (!cont) return;
    var contRect = cont.getBoundingClientRect();

    // Label the slide's direct children and their children (2 levels)
    var els = activeSlide.querySelectorAll('*');
    els.forEach(function(el) {
      // Skip invisible, tiny, or script/style elements
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'BR') return;
      var rect = el.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 10) return;
      if (rect.bottom < contRect.top || rect.top > contRect.bottom) return;

      var label = document.createElement('div');
      label.className = 'ann-element-label';
      label.textContent = getElementLabel(el);

      // Position relative to the container
      label.style.left = (rect.left - contRect.left) + 'px';
      label.style.top  = (rect.top  - contRect.top) + 'px';

      // Outline the element
      var outline = document.createElement('div');
      outline.className = 'ann-element-outline';
      outline.style.left   = (rect.left   - contRect.left) + 'px';
      outline.style.top    = (rect.top    - contRect.top)  + 'px';
      outline.style.width  = rect.width  + 'px';
      outline.style.height = rect.height + 'px';

      cont.appendChild(outline);
      cont.appendChild(label);
      labelOverlays.push(label, outline);
    });
  }

  function removeLabels() {
    labelOverlays.forEach(function(el) { el.remove(); });
    labelOverlays = [];
  }

  function toggleLabels(on) {
    showLabels = on;
    if (showLabels) addLabels();
    else removeLabels();
  }

  // Refresh labels when navigating slides
  function refreshLabelsIfActive() {
    if (showLabels) {
      setTimeout(function() { addLabels(); }, 120);
    }
  }

  // ── Toolbar ──────────────────────────────────────────────────

  function buildToolbar(parentEl) {
    if (toolbar) {
      parentEl.appendChild(toolbar);
      return;
    }

    toolbar = document.createElement('div');
    toolbar.id = 'annotateToolbar';

    // Tool toggle (pen / marker)
    var toolRow = document.createElement('div');
    toolRow.className = 'ann-row';
    toolRow.innerHTML =
      '<span class="ann-label">Tool</span>' +
      '<div class="ann-tool-btns">' +
        '<button class="ann-tool-btn ann-active" data-tool="pen">✏️ Pen</button>' +
        '<button class="ann-tool-btn" data-tool="marker">🖍️ Marker</button>' +
      '</div>';
    toolbar.appendChild(toolRow);

    toolRow.querySelectorAll('.ann-tool-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tool = btn.dataset.tool;
        toolRow.querySelectorAll('.ann-tool-btn').forEach(function (b) { b.classList.remove('ann-active'); });
        btn.classList.add('ann-active');
      });
    });

    // Color swatches
    var colorRow = document.createElement('div');
    colorRow.className = 'ann-row';
    colorRow.innerHTML = '<span class="ann-label">Color</span><div class="ann-swatches" id="annSwatches"></div>';
    toolbar.appendChild(colorRow);

    var swatchContainer = colorRow.querySelector('#annSwatches');
    COLORS.forEach(function (c) {
      var sw = document.createElement('div');
      sw.className = 'ann-swatch' + (c.hex === penColor ? ' ann-active' : '');
      sw.style.background = c.hex;
      sw.title = c.name;
      if (c.hex === '#ffffff') sw.style.border = '1.5px solid rgba(255,255,255,0.3)';
      sw.addEventListener('click', function () {
        penColor = c.hex;
        swatchContainer.querySelectorAll('.ann-swatch').forEach(function (s) { s.classList.remove('ann-active'); });
        sw.classList.add('ann-active');
      });
      swatchContainer.appendChild(sw);
    });

    // Size buttons
    var sizeRow = document.createElement('div');
    sizeRow.className = 'ann-row';
    sizeRow.innerHTML = '<span class="ann-label">Size</span><div class="ann-size-btns" id="annSizes"></div>';
    toolbar.appendChild(sizeRow);

    var sizeContainer = sizeRow.querySelector('#annSizes');
    SIZES.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'ann-size-btn' + (s.value === penSize ? ' ann-active' : '');
      btn.textContent = s.label;
      btn.addEventListener('click', function () {
        penSize = s.value;
        sizeContainer.querySelectorAll('.ann-size-btn').forEach(function (b) { b.classList.remove('ann-active'); });
        btn.classList.add('ann-active');
      });
      sizeContainer.appendChild(btn);
    });

    // Actions: Undo, Clear, Copy
    var actRow = document.createElement('div');
    actRow.className = 'ann-actions';
    actRow.innerHTML =
      '<button class="ann-action-btn" id="annUndo">↩ Undo</button>' +
      '<button class="ann-action-btn" id="annClear">✕ Clear</button>' +
      '<button class="ann-action-btn ann-copy-btn" id="annCopy">📋 Copy</button>';
    toolbar.appendChild(actRow);

    actRow.querySelector('#annUndo').addEventListener('click', function () {
      strokes.pop();
      redraw();
    });
    actRow.querySelector('#annClear').addEventListener('click', function () {
      strokes = [];
      currentStroke = null;
      redraw();
    });
    actRow.querySelector('#annCopy').addEventListener('click', capture);

    // Show Labels toggle
    var labelRow = document.createElement('div');
    labelRow.className = 'ann-row';
    labelRow.style.marginTop = '10px';
    labelRow.style.paddingTop = '10px';
    labelRow.style.borderTop = '1px solid rgba(255,255,255,0.06)';
    labelRow.innerHTML =
      '<label class="ann-checkbox-label">' +
        '<input type="checkbox" id="annShowLabels" class="ann-checkbox">' +
        '<span>Show element labels</span>' +
      '</label>';
    toolbar.appendChild(labelRow);

    labelRow.querySelector('#annShowLabels').addEventListener('change', function () {
      toggleLabels(this.checked);
    });

    parentEl.appendChild(toolbar);
  }

  // ── Capture / Copy ───────────────────────────────────────────

  function capture() {
    var activeSlide = document.querySelector('.slide.active');
    if (!activeSlide) return;

    // Temporarily hide editor chrome
    var editorEls = document.querySelectorAll(
      '#designEditorPanel, #designEditorHighlight, #deSelOverlay, #deBoxModelLayer, ' +
      '#deFlyout, .de-mode-indicator'
    );
    editorEls.forEach(function (el) { el.style.visibility = 'hidden'; });

    // Use html2canvas to capture the slides container
    var cont = getContainer();

    // Fallback: just capture the annotation canvas composited onto a screenshot
    // We'll render the slide content + annotation via a composited canvas
    var outputCanvas = document.createElement('canvas');
    outputCanvas.width = DESIGN_W;
    outputCanvas.height = DESIGN_H;
    var outCtx = outputCanvas.getContext('2d');

    // Try html2canvas first, fallback to annotation-only capture
    if (typeof html2canvas !== 'undefined') {
      html2canvas(cont, {
        width: DESIGN_W,
        height: DESIGN_H,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        ignoreElements: function (el) {
          return el.id === 'designEditorPanel' ||
                 el.id === 'designEditorHighlight' ||
                 el.id === 'deSelOverlay' ||
                 el.id === 'deFlyout' ||
                 el.classList.contains('de-mode-indicator') ||
                 el.id === 'annotateCanvas';
        }
      }).then(function (slideCanvas) {
        outCtx.drawImage(slideCanvas, 0, 0);
        // Composite annotations on top
        if (canvas) outCtx.drawImage(canvas, 0, 0);
        copyCanvasToClipboard(outputCanvas);
        editorEls.forEach(function (el) { el.style.visibility = ''; });
      }).catch(function () {
        // Fallback: just annotations on black
        outCtx.fillStyle = '#111';
        outCtx.fillRect(0, 0, DESIGN_W, DESIGN_H);
        if (canvas) outCtx.drawImage(canvas, 0, 0);
        copyCanvasToClipboard(outputCanvas);
        editorEls.forEach(function (el) { el.style.visibility = ''; });
      });
    } else {
      // No html2canvas — just the annotations on dark background
      outCtx.fillStyle = '#111';
      outCtx.fillRect(0, 0, DESIGN_W, DESIGN_H);
      if (canvas) outCtx.drawImage(canvas, 0, 0);
      copyCanvasToClipboard(outputCanvas);
      editorEls.forEach(function (el) { el.style.visibility = ''; });
    }
  }

  function copyCanvasToClipboard(outputCanvas) {
    outputCanvas.toBlob(function (blob) {
      if (!blob) return;
      // Try clipboard API
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(function () {
          flashEffect();
        }).catch(function () {
          downloadFallback(blob);
        });
      } else {
        downloadFallback(blob);
      }
    }, 'image/png');
  }

  function downloadFallback(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'annotation-' + Date.now() + '.png';
    a.click();
    URL.revokeObjectURL(url);
    flashEffect();
  }

  /** Camera-flash snapshot animation */
  function flashEffect() {
    var flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;inset:0;background:white;z-index:999999;' +
      'opacity:0.85;pointer-events:none;transition:opacity 0.4s ease-out;';
    document.body.appendChild(flash);

    // Also show a small "Copied!" toast
    var toast = document.createElement('div');
    toast.textContent = '✓ Copied to clipboard';
    toast.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:999999;' +
      'background:#a78bfa;color:#000;font-weight:700;font-size:14px;' +
      'padding:10px 24px;border-radius:24px;font-family:Inter,system-ui,sans-serif;' +
      'box-shadow:0 4px 20px rgba(167,139,250,0.5);pointer-events:none;' +
      'opacity:0;transition:opacity 0.3s ease;';
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      flash.style.opacity = '0';
      toast.style.opacity = '1';
    });

    setTimeout(function () { flash.remove(); }, 500);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 1800);
  }

  // ── Public API ───────────────────────────────────────────────

  function init() {
    createCanvas();
    injectStyles();
    // Refresh labels when slides change
    document.addEventListener('slidechange', refreshLabelsIfActive);
  }

  function show() {
    if (!canvas) createCanvas();
    isVisible = true;
    canvas.style.pointerEvents = 'auto';
    canvas.style.display = '';
  }

  function hide() {
    isVisible = false;
    if (canvas) {
      canvas.style.pointerEvents = 'none';
    }
    removeLabels();
  }

  function clearAll() {
    strokes = [];
    currentStroke = null;
    drawing = false;
    if (ctx) ctx.clearRect(0, 0, DESIGN_W, DESIGN_H);
    removeLabels();
    showLabels = false;
    var cb = document.getElementById('annShowLabels');
    if (cb) cb.checked = false;
  }

  function isActive() {
    return isVisible;
  }

  // ── Styles ───────────────────────────────────────────────────

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = `
      #annotateToolbar {
        margin-top: 4px;
      }
      .ann-row {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 8px;
      }
      .ann-label {
        font-size: 10px; font-weight: 600; color: #555;
        text-transform: uppercase; letter-spacing: 0.06em;
        min-width: 36px;
      }
      .ann-tool-btns { display: flex; gap: 4px; }
      .ann-tool-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        color: #888; font-size: 11px; padding: 4px 10px; border-radius: 6px;
        cursor: pointer; transition: all 0.12s; font-family: inherit;
      }
      .ann-tool-btn:hover { background: rgba(167,139,250,0.12); color: #ccc; }
      .ann-tool-btn.ann-active { background: rgba(167,139,250,0.2); color: #a78bfa; border-color: rgba(167,139,250,0.3); }
      .ann-swatches { display: flex; gap: 5px; }
      .ann-swatch {
        width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .ann-swatch:hover { transform: scale(1.15); }
      .ann-swatch.ann-active {
        box-shadow: 0 0 0 2px rgba(10,8,7,0.97), 0 0 0 4px #a78bfa;
        transform: scale(1.1);
      }
      .ann-size-btns { display: flex; gap: 4px; }
      .ann-size-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        color: #888; font-size: 11px; font-weight: 600; padding: 3px 10px;
        border-radius: 5px; cursor: pointer; transition: all 0.12s; font-family: inherit;
      }
      .ann-size-btn:hover { background: rgba(167,139,250,0.12); color: #ccc; }
      .ann-size-btn.ann-active { background: rgba(167,139,250,0.2); color: #a78bfa; border-color: rgba(167,139,250,0.3); }
      .ann-actions {
        display: flex; gap: 5px; margin-top: 10px; padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .ann-action-btn {
        flex: 1; background: rgba(255,255,255,0.05); border: none;
        color: #888; font-size: 11px; padding: 7px 0; border-radius: 6px;
        cursor: pointer; transition: all 0.12s; text-align: center; font-family: inherit;
      }
      .ann-action-btn:hover { background: rgba(167,139,250,0.15); color: #a78bfa; }
      .ann-copy-btn { background: rgba(167,139,250,0.12); color: #a78bfa; font-weight: 600; }
      .ann-copy-btn:hover { background: rgba(167,139,250,0.25); }
      .ann-checkbox-label {
        display: flex; align-items: center; gap: 8px;
        font-size: 11px; color: #aaa; cursor: pointer; user-select: none;
      }
      .ann-checkbox-label:hover { color: #ccc; }
      .ann-checkbox {
        accent-color: #a78bfa; width: 14px; height: 14px; cursor: pointer;
      }
      .ann-element-label {
        position: absolute; z-index: 99989;
        background: rgba(167,139,250,0.92); color: #fff;
        font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700;
        padding: 1px 5px; border-radius: 3px;
        pointer-events: none; white-space: nowrap;
        line-height: 1.4; letter-spacing: 0;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        transform: translateY(-100%);
      }
      .ann-element-outline {
        position: absolute; z-index: 99988;
        border: 1px solid rgba(167,139,250,0.55);
        pointer-events: none; border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Expose ───────────────────────────────────────────────────

  window.PRES = window.PRES || {};
  window.PRES.annotate = {
    init: init,
    show: show,
    hide: hide,
    clear: clearAll,
    capture: capture,
    isActive: isActive,
    buildToolbar: buildToolbar,
    refreshLabels: refreshLabelsIfActive,
    setColor: function(hex) { penColor = hex; },
    setSize: function(sz) { penSize = sz; },
    undo: function() { strokes.pop(); redraw(); }
  };

  console.log('[Annotate] Ready');
})();
