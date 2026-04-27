/**
 * Live Design Editor v4 — Toggle with 'D' key
 * - Click any element to select it
 * - Drag the selection box to move the element anywhere on screen
 * - Resize handles on corners and edges
 * - Flyout property panel with labeled controls
 * - Box-model visualization (margin=amber, padding=teal)
 * - Global token color controls in the Slide tab
 */
(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────
  var active     = false;
  var selectedEl = null;
  var panel      = null;
  var highlight  = null;
  var overlay    = null;
  var flyout     = null;
  var boxLayer   = null;
  var activeTab  = 'layers';
  var handleDrag = null;
  var moveDrag   = null;
  var boxDrag    = null;
  var indicator  = null;
  var hiddenEls  = new WeakMap();
  var origStyles = new WeakMap();

  var PAD = 6; // px padding around selected element in overlay

  // ── CSS ───────────────────────────────────────────────────────
  var CSS = `
    /* ─ Side panel ─ */
    #designEditorPanel {
      position: fixed; top: 60px; right: 16px; z-index: 100000;
      width: 268px; background: rgba(12,10,8,0.97); color: #eee;
      border: 1px solid rgba(255,255,255,0.13); border-radius: 10px;
      font-family: 'Inter', system-ui, sans-serif; font-size: 12px;
      padding: 14px; display: none; backdrop-filter: blur(14px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      max-height: calc(100vh - 80px); overflow-y: auto;
    }
    #designEditorPanel .de-title {
      font-size: 13px; font-weight: 700; color: #a78bfa; margin-bottom: 10px;
      display: flex; align-items: center; justify-content: space-between;
    }
    #designEditorPanel .de-title-left { display:flex; align-items:center; gap:8px; }
    #designEditorPanel .de-tag {
      font-size: 10px; color: #888; background: rgba(255,255,255,0.06);
      padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace;
    }
    #designEditorPanel .de-export-btn {
      background: rgba(167,139,250,0.12); color: #a78bfa; border: none;
      padding: 4px 9px; border-radius: 5px; font-size: 10px; font-weight: 600; cursor: pointer;
    }
    #designEditorPanel .de-export-btn:hover { background: rgba(167,139,250,0.22); }
    #designEditorPanel .de-tabs {
      display: flex; gap: 4px; margin-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 8px;
    }
    #designEditorPanel .de-tab {
      padding: 4px 10px; border-radius: 5px; cursor: pointer;
      font-size: 11px; font-weight: 600; color: #555;
      background: transparent; border: none; transition: all 0.15s;
    }
    #designEditorPanel .de-tab.active { background: rgba(167,139,250,0.18); color: #a78bfa; }
    #designEditorPanel .de-tab:hover:not(.active) { color: #aaa; }
    #designEditorPanel .de-section {
      font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase;
      letter-spacing: 0.08em; margin: 12px 0 7px;
      border-top: 1px solid rgba(255,255,255,0.06); padding-top: 9px;
    }
    #designEditorPanel .de-swatch-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    #designEditorPanel .de-swatch {
      width: 26px; height: 26px; border-radius: 5px; flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.10);
    }
    #designEditorPanel .de-swatch-info { flex: 1; }
    #designEditorPanel .de-swatch-name { font-size: 11px; color: #bbb; }
    #designEditorPanel .de-swatch-hex { font-size: 10px; color: #555; font-family: 'Courier New', monospace; }
    #designEditorPanel .de-token-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; gap: 8px;
    }
    #designEditorPanel .de-token-name { font-size: 10px; color: #555; font-family: 'Courier New', monospace; flex: 1; }
    #designEditorPanel .de-token-val { font-size: 10px; color: #a78bfa; font-family: 'Courier New', monospace; text-align: right; }
    #designEditorPanel .de-refresh-btn {
      font-size: 10px; color: #555; cursor: pointer; float: right;
      background: none; border: none; padding: 0;
    }
    #designEditorPanel .de-refresh-btn:hover { color: #a78bfa; }
    .de-tok-row {
      display: flex; align-items: center; gap: 7px; margin-bottom: 6px;
      padding: 3px 5px; border-radius: 5px; transition: background 0.1s;
    }
    .de-tok-row:hover { background: rgba(255,255,255,0.04); }
    .de-tok-swatch {
      width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
    }
    .de-tok-swatch:hover { outline: 2px solid #a78bfa; outline-offset: 1px; }
    .de-tok-name { font-size: 10px; color: #666; font-family: 'Courier New', monospace; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .de-tok-val  { font-size: 10px; color: #888; font-family: 'Courier New', monospace; }
    .de-layer-row {
      display: flex; align-items: center; gap: 4px; padding: 2px 4px;
      border-radius: 3px; cursor: pointer; font-family: 'Courier New', monospace;
      font-size: 10px; color: #777; transition: background 0.1s;
      white-space: nowrap; overflow: hidden;
    }
    .de-layer-row:hover { background: rgba(167,139,250,0.08); color: #ccc; }
    .de-layer-row.selected { background: rgba(167,139,250,0.16); color: #a78bfa; }
    .de-layer-row.hidden-el { opacity: 0.3; }
    .de-layer-toggle { flex-shrink:0; width:12px; font-size:9px; color:#444; cursor:pointer; user-select:none; text-align:center; }
    .de-layer-toggle:hover { color: #ccc; }
    .de-layer-lbl  { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .de-layer-eye  { flex-shrink:0; font-size:9px; color:#333; cursor:pointer; padding:0 2px; user-select:none; opacity:0; }
    .de-layer-row:hover .de-layer-eye { opacity: 1; }
    .de-layer-eye.eye-hidden { opacity: 1; color: #f97316; }
    .de-layer-children { padding-left: 12px; }
    #deLayersBreadcrumb { font-size:9px; color:#444; font-family:'Courier New',monospace; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .de-output {
      font-family: 'Courier New', monospace; font-size: 10px;
      background: rgba(0,0,0,0.4); color: #a78bfa; padding: 8px;
      border-radius: 6px; margin-top: 8px; max-height: 140px;
      overflow-y: auto; white-space: pre-wrap; display: none; word-break: break-all;
    }
    /* ─ Mode indicator ─ */
    .de-mode-indicator {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      z-index: 100000; background: #a78bfa; color: #000; font-weight: 700;
      font-size: 12px; padding: 6px 16px; border-radius: 20px;
      font-family: 'Inter', system-ui, sans-serif;
      box-shadow: 0 4px 16px rgba(167,139,250,0.4); pointer-events: none;
    }
    /* ─ Hover highlight ─ */
    #designEditorHighlight {
      position: fixed; z-index: 99994; pointer-events: none;
      border: 1.5px solid rgba(167,139,250,0.55); border-radius: 3px;
      background: rgba(167,139,250,0.04);
      transition: top 0.04s ease, left 0.04s ease, width 0.04s ease, height 0.04s ease;
    }
    /* ─ Selection overlay ─ */
    #deSelOverlay { position: fixed; z-index: 99997; pointer-events: none; }
    /* The dashed box IS the drag handle — pointer-events: all + grab cursor */
    #deSelBox {
      position: absolute; inset: 0;
      border: 1.5px dashed rgba(167,139,250,0.8); border-radius: 2px;
      pointer-events: all; cursor: grab; z-index: 0;
    }
    #deSelBox:active { cursor: grabbing; }
    #deSelBox.de-dragging { cursor: grabbing; }
    #deSelLabel {
      position: absolute; bottom: calc(100% + 6px); left: 0;
      background: #a78bfa; color: #000; font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 4px;
      font-family: 'Courier New', monospace; pointer-events: none; white-space: nowrap;
      max-width: 220px; overflow: hidden; text-overflow: ellipsis;
    }
    /* ─ Resize handles ─ */
    .de-handle {
      position: absolute; width: 9px; height: 9px;
      background: #fff; border: 1.5px solid #a78bfa; border-radius: 2px;
      transform: translate(-50%, -50%); pointer-events: all; z-index: 2;
    }
    .de-handle:hover { background: #a78bfa; }
    .de-handle[data-handle="nw"] { left: 0;    top: 0;    cursor: nwse-resize; }
    .de-handle[data-handle="n"]  { left: 50%;  top: 0;    cursor: ns-resize;   }
    .de-handle[data-handle="ne"] { left: 100%; top: 0;    cursor: nesw-resize; }
    .de-handle[data-handle="e"]  { left: 100%; top: 50%;  cursor: ew-resize;   }
    .de-handle[data-handle="se"] { left: 100%; top: 100%; cursor: nwse-resize; }
    .de-handle[data-handle="s"]  { left: 50%;  top: 100%; cursor: ns-resize;   }
    .de-handle[data-handle="sw"] { left: 0;    top: 100%; cursor: nesw-resize; }
    .de-handle[data-handle="w"]  { left: 0;    top: 50%;  cursor: ew-resize;   }
    /* ─ Box model ─ */
    #deBoxModelLayer { position: fixed; z-index: 99993; top: 0; left: 0; pointer-events: none; }
    .de-box-band { position: fixed; pointer-events: all; box-sizing: border-box; }
    .de-box-band.de-bm-margin  { background: rgba(251,191,36,0.22); }
    .de-box-band.de-bm-padding { background: rgba(45,212,191,0.18); }
    .de-box-label {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
      font-size: 9px; font-weight: 700; white-space: nowrap; pointer-events: none;
      font-family: 'Courier New', monospace;
    }
    .de-bm-margin  .de-box-label { color: rgba(180,83,9,0.9); }
    .de-bm-padding .de-box-label { color: rgba(13,148,136,0.9); }
    /* ─ Flyout property panel ─ */
    #deFlyout {
      position: fixed; z-index: 100001; display: none;
      width: 240px;
      background: rgba(10,8,7,0.98); color: #eee;
      border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
      padding: 12px 14px 10px;
      font-family: 'Inter', system-ui, sans-serif; font-size: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.7);
      backdrop-filter: blur(20px);
    }
    #deFlyoutTitle {
      font-size: 11px; font-weight: 700; color: #a78bfa;
      font-family: 'Courier New', monospace;
      margin-bottom: 10px; padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .de-prop-group {
      margin-bottom: 4px;
    }
    .de-prop-section {
      font-size: 9px; font-weight: 600; color: #444; text-transform: uppercase;
      letter-spacing: 0.07em; margin: 10px 0 5px; padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .de-prop-row {
      display: flex; align-items: center; gap: 6px;
      padding: 3px 0; border-radius: 4px;
    }
    .de-prop-row:hover { background: rgba(255,255,255,0.02); }
    .de-prop-lbl {
      font-size: 11px; color: #666; flex: 1;
    }
    .de-prop-val {
      font-size: 11px; color: #d0d0d0; font-family: 'Courier New', monospace;
      min-width: 48px; text-align: right;
    }
    .de-prop-btn {
      width: 22px; height: 22px; flex-shrink: 0;
      background: rgba(255,255,255,0.06); border: none;
      color: #777; font-size: 15px; line-height: 1;
      border-radius: 5px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.1s;
    }
    .de-prop-btn:hover { background: rgba(167,139,250,0.2); color: #a78bfa; }
    .de-flyout-color-row {
      display: flex; align-items: center; gap: 8px; padding: 4px 0;
    }
    .de-flyout-color-lbl { font-size: 11px; color: #666; flex: 1; }
    .de-flyout-swatch {
      width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
      border: 1.5px solid rgba(255,255,255,0.15); cursor: pointer;
    }
    .de-flyout-swatch:hover { outline: 2px solid #a78bfa; outline-offset: 2px; }
    .de-flyout-hex {
      font-size: 10px; color: #555; font-family: 'Courier New', monospace;
      min-width: 52px;
    }
    .de-flyout-footer {
      display: flex; gap: 6px; margin-top: 10px; padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .de-flyout-action {
      flex: 1; background: rgba(255,255,255,0.05); border: none;
      color: #777; font-size: 11px; padding: 6px 0; border-radius: 6px;
      cursor: pointer; transition: all 0.12s; text-align: center;
    }
    .de-flyout-action:hover { background: rgba(167,139,250,0.15); color: #a78bfa; }
    .de-flyout-action.de-close:hover { background: rgba(248,113,113,0.1); color: #f87171; }
    /* ─ Drag state ─ */
    .de-is-dragging, .de-is-dragging * { cursor: grabbing !important; user-select: none !important; }
  `;

  // ── Build DOM ─────────────────────────────────────────────────
  function createPanel() {
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    // Side panel
    panel = document.createElement('div');
    panel.id = 'designEditorPanel';
    panel.innerHTML = `
      <div class="de-title">
        <span class="de-title-left">🎨 Design Editor <span class="de-tag" id="deElTag">—</span></span>
        <button class="de-export-btn" id="dePanelCopy">📋 Copy CSS</button>
      </div>
      <div class="de-tabs">
        <button class="de-tab" id="deTabSlide" onclick="window._deShowTab('slide')">🔍 Slide</button>
        <button class="de-tab active" id="deTabLayers" onclick="window._deShowTab('layers')">🗂 Layers</button>
        <button class="de-tab" id="deTabAnnotate" onclick="window._deShowTab('annotate')">✏️ Annotate</button>
      </div>
      <div id="deSlidePanel" style="display:none;">
        <button class="de-refresh-btn" onclick="window._deRefreshSlide()">↻ refresh</button>
        <div id="deSlideDiag" style="color:#555;font-size:11px;">Loading…</div>
        <div class="de-section" style="margin-top:14px;">CSS Tokens</div>
        <div id="deTokensPanel"></div>
      </div>
      <div id="deLayersPanel">
        <div id="deLayersBreadcrumb"></div>
        <div id="deLayersTree" style="color:#555;font-size:11px;">Loading…</div>
      </div>
      <div id="deAnnotatePanel" style="display:none;"></div>
      <div class="de-output" id="deOutput"></div>
    `;
    document.body.appendChild(panel);
    document.getElementById('dePanelCopy').addEventListener('click', copyCSS);

    // Hover highlight
    highlight = document.createElement('div');
    highlight.id = 'designEditorHighlight';
    highlight.style.display = 'none';
    document.body.appendChild(highlight);

    // Selection overlay — handles + dashed box (the box is the drag target)
    overlay = document.createElement('div');
    overlay.id = 'deSelOverlay';
    overlay.innerHTML =
      '<div id="deSelBox"></div>' +
      '<div id="deSelLabel"></div>' +
      ['nw','n','ne','e','se','s','sw','w'].map(function(h) {
        return '<div class="de-handle" data-handle="' + h + '"></div>';
      }).join('');
    overlay.style.display = 'none';
    document.body.appendChild(overlay);

    // Wire: click-drag on the dashed box = move element
    document.getElementById('deSelBox').addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      startMoveDrag(e);
    });

    // Wire: resize handles
    overlay.querySelectorAll('.de-handle').forEach(function(h) {
      h.addEventListener('mousedown', function(e) {
        e.preventDefault(); e.stopPropagation();
        startHandleDrag(e, h.dataset.handle);
      });
    });

    // Box model layer
    boxLayer = document.createElement('div');
    boxLayer.id = 'deBoxModelLayer';
    boxLayer.style.display = 'none';
    document.body.appendChild(boxLayer);

    // Flyout property panel
    flyout = document.createElement('div');
    flyout.id = 'deFlyout';
    flyout.innerHTML = `
      <div id="deFlyoutTitle">—</div>
      <div class="de-prop-section" style="margin-top:0;padding-top:0;border-top:none;">Typography</div>
      ${propRow('Font Size',      'fontSize',     'deFvFontSize')}
      ${propRow('Line Height',    'lineHeight',   'deFvLineHeight')}
      ${propRow('Letter Spacing', 'letterSpacing','deFvLetterSpacing')}
      ${propRow('Max Width',      'maxWidth',     'deFvMaxWidth')}
      <div class="de-prop-section">Spacing</div>
      ${propRow('Padding',        'padding',      'deFvPadding')}
      <div class="de-prop-section">Visual</div>
      ${propRow('Opacity',        'opacity',      'deFvOpacity')}
      <div class="de-flyout-color-row">
        <span class="de-flyout-color-lbl">Text Color</span>
        <div class="de-flyout-swatch" id="deFvSwatch"></div>
        <span class="de-flyout-hex" id="deFvHex">#??????</span>
        <input type="color" id="deFvColorPicker" style="position:absolute;opacity:0;width:1px;height:1px;pointer-events:none;">
      </div>
      <div class="de-flyout-footer">
        <button class="de-flyout-action" id="deFvCopy">📋 Copy</button>
        <button class="de-flyout-action" id="deFvReset">↩ Reset</button>
        <button class="de-flyout-action de-close" id="deFvClose">✕</button>
      </div>
    `;
    document.body.appendChild(flyout);
    wireFlyout();

    // Tab switcher
    window._deShowTab = function(tab) {
      activeTab = tab;
      document.getElementById('deTabSlide').classList.toggle('active',    tab === 'slide');
      document.getElementById('deTabLayers').classList.toggle('active',   tab === 'layers');
      document.getElementById('deTabAnnotate').classList.toggle('active', tab === 'annotate');
      document.getElementById('deSlidePanel').style.display    = tab === 'slide'    ? 'block' : 'none';
      document.getElementById('deLayersPanel').style.display   = tab === 'layers'   ? 'block' : 'none';
      document.getElementById('deAnnotatePanel').style.display = tab === 'annotate' ? 'block' : 'none';
      if (tab === 'slide')  { refreshSlideDiag(); buildTokenControls(); }
      if (tab === 'layers') buildLayerTree();
      if (tab === 'annotate') {
        if (window.PRES && window.PRES.annotate) {
          window.PRES.annotate.init();
          window.PRES.annotate.show();
          window.PRES.annotate.buildToolbar(document.getElementById('deAnnotatePanel'));
        }
        deselectElement();
        if (highlight) highlight.style.display = 'none';
      } else {
        if (window.PRES && window.PRES.annotate) {
          window.PRES.annotate.hide();
        }
      }
    };
    window._deRefreshSlide = function() { refreshSlideDiag(); buildTokenControls(); };
  }

  function propRow(label, prop, valId) {
    return (
      '<div class="de-prop-row" data-prop="' + prop + '">' +
        '<span class="de-prop-lbl">' + label + '</span>' +
        '<button class="de-prop-btn" data-prop="' + prop + '" data-dir="-1">−</button>' +
        '<span class="de-prop-val" id="' + valId + '">—</span>' +
        '<button class="de-prop-btn" data-prop="' + prop + '" data-dir="1">+</button>' +
      '</div>'
    );
  }

  function wireFlyout() {
    flyout.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    flyout.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-prop][data-dir]');
      if (btn) stepProp(btn.dataset.prop, parseFloat(btn.dataset.dir));
    });
    document.getElementById('deFvSwatch').addEventListener('click', function() {
      var p = document.getElementById('deFvColorPicker');
      p.style.pointerEvents = 'all';
      p.click();
      setTimeout(function() { p.style.pointerEvents = 'none'; }, 300);
    });
    document.getElementById('deFvColorPicker').addEventListener('input', function(e) {
      if (!selectedEl) return;
      selectedEl.style.color = e.target.value;
      document.getElementById('deFvSwatch').style.background = e.target.value;
      document.getElementById('deFvHex').textContent = e.target.value;
    });
    document.getElementById('deFvCopy').addEventListener('click', copyCSS);
    document.getElementById('deFvReset').addEventListener('click', resetEl);
    document.getElementById('deFvClose').addEventListener('click', deselectElement);
  }

  // ── Transform helpers ─────────────────────────────────────────
  function getTranslate(el) {
    var m = (el.style.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
    return m ? { x: parseFloat(m[1]) || 0, y: parseFloat(m[2]) || 0 } : { x: 0, y: 0 };
  }

  function getScale(el) {
    var m = (el.style.transform || '').match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2] !== undefined ? m[2] : m[1]) } : { x: 1, y: 1 };
  }

  function setTransform(el, tx, ty, sx, sy) {
    var parts = [];
    if (tx !== 0 || ty !== 0) parts.push('translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)');
    if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) parts.push('scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')');
    el.style.transform = parts.join(' ');
  }

  // ── Overlay positioning ───────────────────────────────────────
  function positionOverlay() {
    if (!overlay || !selectedEl) return;
    var rect = selectedEl.getBoundingClientRect();
    overlay.style.left   = (rect.left  - PAD) + 'px';
    overlay.style.top    = (rect.top   - PAD) + 'px';
    overlay.style.width  = (rect.width  + PAD * 2) + 'px';
    overlay.style.height = (rect.height + PAD * 2) + 'px';
    overlay.style.display = 'block';
    var lbl = document.getElementById('deSelLabel');
    if (lbl) lbl.textContent = getElTag(selectedEl);
    updateBoxModel();
  }

  // ── Flyout positioning & values ───────────────────────────────
  function positionFlyout() {
    if (!flyout || !selectedEl) return;
    var rect    = selectedEl.getBoundingClientRect();
    var gap     = 14;
    flyout.style.visibility = 'hidden';
    flyout.style.display    = 'block';
    var fw = flyout.offsetWidth  || 240;
    var fh = flyout.offsetHeight || 320;
    flyout.style.visibility = '';

    // Try right side first; fall back to left
    var left = rect.right + gap;
    if (left + fw > window.innerWidth - 8) left = rect.left - fw - gap;
    left = Math.max(8, left);

    // Vertically center on selection, clamped to viewport
    var top = Math.round(rect.top + rect.height / 2 - fh / 2);
    top = Math.max(8, Math.min(top, window.innerHeight - fh - 8));

    flyout.style.left = left + 'px';
    flyout.style.top  = top  + 'px';
    updateFlyoutValues();
  }

  function updateFlyoutValues() {
    if (!selectedEl || !flyout) return;
    var cs  = getComputedStyle(selectedEl);
    var fs  = parseFloat(cs.fontSize)  || 16;
    var lh  = parseFloat(cs.lineHeight);
    var ls  = parseFloat(cs.letterSpacing) || 0;
    var mw  = parseFloat(cs.maxWidth);
    var op  = parseFloat(cs.opacity != null ? cs.opacity : '1');
    var pt  = parseFloat(cs.paddingTop)    || 0;
    var pr  = parseFloat(cs.paddingRight)  || 0;
    var pb  = parseFloat(cs.paddingBottom) || 0;
    var pl  = parseFloat(cs.paddingLeft)   || 0;
    var padAvg = Math.round((pt + pr + pb + pl) / 4);

    setFv('deFvFontSize',      Math.round(fs) + 'px');
    setFv('deFvLineHeight',    lh && fs ? (lh / fs).toFixed(2) : '—');
    setFv('deFvLetterSpacing', ls.toFixed(1) + 'px');
    setFv('deFvMaxWidth',      isNaN(mw) ? 'auto' : Math.round(mw) + 'px');
    setFv('deFvOpacity',       Math.round(op * 100) + '%');
    setFv('deFvPadding',       padAvg + 'px');

    var hex = rgbToHex(cs.color);
    var sw  = document.getElementById('deFvSwatch');
    var hx  = document.getElementById('deFvHex');
    var pk  = document.getElementById('deFvColorPicker');
    var tt  = document.getElementById('deFlyoutTitle');
    if (sw) sw.style.background = cs.color;
    if (hx) hx.textContent = hex;
    if (pk) pk.value = hex;
    if (tt) tt.textContent = getElTag(selectedEl);
  }

  function setFv(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  // ── Property stepper ──────────────────────────────────────────
  var STEPS = { fontSize: 1, lineHeight: 0.05, letterSpacing: 0.5, maxWidth: 10, opacity: 0.05, padding: 2 };

  function stepProp(prop, dir) {
    if (!selectedEl) return;
    var cs   = getComputedStyle(selectedEl);
    var step = STEPS[prop] || 1;

    if (prop === 'fontSize') {
      selectedEl.style.fontSize = Math.max(1, (parseFloat(cs.fontSize) || 16) + dir * step) + 'px';
    } else if (prop === 'lineHeight') {
      var fs = parseFloat(cs.fontSize) || 16;
      var lh = parseFloat(cs.lineHeight);
      var r  = lh && fs ? lh / fs : 1.4;
      selectedEl.style.lineHeight = Math.max(0.5, r + dir * step).toFixed(2);
    } else if (prop === 'letterSpacing') {
      selectedEl.style.letterSpacing = ((parseFloat(cs.letterSpacing) || 0) + dir * step).toFixed(1) + 'px';
    } else if (prop === 'maxWidth') {
      var cur = parseFloat(cs.maxWidth);
      var base = isNaN(cur) ? (parseFloat(cs.width) || 400) : cur;
      selectedEl.style.maxWidth = Math.max(50, base + dir * step) + 'px';
    } else if (prop === 'opacity') {
      selectedEl.style.opacity = Math.max(0, Math.min(1, (parseFloat(cs.opacity) || 1) + dir * step)).toFixed(2);
    } else if (prop === 'padding') {
      selectedEl.style.padding = Math.max(0, (parseFloat(cs.paddingTop) || 0) + dir * step) + 'px';
    }
    positionOverlay();
    updateFlyoutValues();
  }

  // ── Move drag — drag #deSelBox to move selected element ──────
  function startMoveDrag(e) {
    if (!selectedEl) return;
    // Capture current viewport position so we can lift to fixed coords
    var rect = selectedEl.getBoundingClientRect();
    moveDrag = {
      startX:    e.clientX,   startY:    e.clientY,
      rectLeft:  rect.left,   rectTop:   rect.top,
      rectWidth: rect.width,  rectHeight: rect.height,
      moved:     false
    };
    var box = document.getElementById('deSelBox');
    if (box) box.classList.add('de-dragging');
    document.body.classList.add('de-is-dragging');
    document.addEventListener('mousemove', onMoveDrag, true);
    document.addEventListener('mouseup',   onMoveUp,   true);
  }

  function onMoveDrag(e) {
    if (!moveDrag || !selectedEl) return;
    var dx = e.clientX - moveDrag.startX;
    var dy = e.clientY - moveDrag.startY;
    if (!moveDrag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      moveDrag.moved = true;
      // "Lift" element to fixed positioning — escapes overflow:hidden on any ancestor
      var cs = getComputedStyle(selectedEl);
      if (cs.display === 'inline') selectedEl.style.display = 'inline-block';
      selectedEl.style.position = 'fixed';
      selectedEl.style.left     = moveDrag.rectLeft + 'px';
      selectedEl.style.top      = moveDrag.rectTop  + 'px';
      selectedEl.style.width    = moveDrag.rectWidth  + 'px';
      selectedEl.style.margin   = '0';
      selectedEl.style.zIndex   = '99990';
    }
    if (!moveDrag.moved) return;
    selectedEl.style.left = (moveDrag.rectLeft + dx) + 'px';
    selectedEl.style.top  = (moveDrag.rectTop  + dy) + 'px';
    positionOverlay(); // dashed box follows the element
    // flyout stays put during drag so user can see what's actually moving
  }

  function onMoveUp(e) {
    document.removeEventListener('mousemove', onMoveDrag, true);
    document.removeEventListener('mouseup',   onMoveUp,   true);
    document.body.classList.remove('de-is-dragging');
    var box = document.getElementById('deSelBox');
    if (box) box.classList.remove('de-dragging');
    var wasDrag = moveDrag && moveDrag.moved;
    moveDrag = null;
    if (!wasDrag) {
      // Short click without drag: drill into child element under cursor
      overlay.style.display = 'none';
      var hit = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.display = 'block';
      if (hit && hit !== selectedEl && !panel.contains(hit) && !flyout.contains(hit) && hit !== document.body) {
        selectElement(hit);
      }
    } else {
      // Reposition flyout next to element's new location
      positionFlyout();
    }
  }

  // ── Handle drag (scale & resize) ─────────────────────────────
  function startHandleDrag(e, handle) {
    if (!selectedEl) return;
    var cs   = getComputedStyle(selectedEl);
    var rect = selectedEl.getBoundingClientRect();
    var isCorner = /^(nw|ne|se|sw)$/.test(handle);
    handleDrag = {
      handle:  handle,
      type:    isCorner ? 'scale' : (handle==='e'||handle==='w') ? 'maxWidth' : 'fontSize',
      startX:  e.clientX, startY: e.clientY,
      origW:   rect.width, origH: rect.height,
      origTX:  getTranslate(selectedEl).x,
      origTY:  getTranslate(selectedEl).y,
      origSX:  getScale(selectedEl).x,
      origSY:  getScale(selectedEl).y,
      origFS:  parseFloat(cs.fontSize) || 16,
      origMW:  (parseFloat(cs.maxWidth) || rect.width)
    };
    document.body.classList.add('de-is-dragging');
    document.addEventListener('mousemove', onHandleDrag, true);
    document.addEventListener('mouseup',   onHandleUp,   true);
  }

  function onHandleDrag(e) {
    if (!handleDrag || !selectedEl) return;
    var dx = e.clientX - handleDrag.startX;
    var dy = e.clientY - handleDrag.startY;

    if (handleDrag.type === 'scale') {
      var h  = handleDrag.handle;
      var dw = (h==='nw'||h==='sw') ? -dx : dx;
      var dh = (h==='nw'||h==='ne') ? -dy : dy;
      var sx = Math.max(0.05, ((handleDrag.origW + dw) / handleDrag.origW) * handleDrag.origSX);
      var sy = Math.max(0.05, ((handleDrag.origH + dh) / handleDrag.origH) * handleDrag.origSY);
      setTransform(selectedEl, handleDrag.origTX, handleDrag.origTY, sx, sy);
    } else if (handleDrag.type === 'maxWidth') {
      var sign = handleDrag.handle === 'w' ? -1 : 1;
      selectedEl.style.maxWidth = Math.max(50, handleDrag.origMW + dx * sign) + 'px';
    } else {
      var sign = handleDrag.handle === 'n' ? -1 : 1;
      selectedEl.style.fontSize = Math.max(1, Math.round(handleDrag.origFS + dy * sign)) + 'px';
    }
    positionOverlay();
    updateFlyoutValues();
  }

  function onHandleUp() {
    document.removeEventListener('mousemove', onHandleDrag, true);
    document.removeEventListener('mouseup',   onHandleUp,   true);
    document.body.classList.remove('de-is-dragging');
    handleDrag = null;
    positionOverlay();
  }

  // ── Box model visualization ───────────────────────────────────
  function updateBoxModel() {
    if (!boxLayer) return;
    boxLayer.innerHTML = '';
    if (!selectedEl) { boxLayer.style.display = 'none'; return; }
    var cs   = getComputedStyle(selectedEl);
    var rect = selectedEl.getBoundingClientRect();
    var mt = parseFloat(cs.marginTop)    || 0;
    var mr = parseFloat(cs.marginRight)  || 0;
    var mb = parseFloat(cs.marginBottom) || 0;
    var ml = parseFloat(cs.marginLeft)   || 0;
    var pt = parseFloat(cs.paddingTop)   || 0;
    var pr = parseFloat(cs.paddingRight) || 0;
    var pb = parseFloat(cs.paddingBottom)|| 0;
    var pl = parseFloat(cs.paddingLeft)  || 0;
    var bt = parseFloat(cs.borderTopWidth)    || 0;
    var br = parseFloat(cs.borderRightWidth)  || 0;
    var bb = parseFloat(cs.borderBottomWidth) || 0;
    var bl = parseFloat(cs.borderLeftWidth)   || 0;

    if (mt > 0) addBand(rect.left,      rect.top - mt,     rect.width,              mt,              'margin',  'top',    mt, 'ns-resize');
    if (mb > 0) addBand(rect.left,      rect.bottom,       rect.width,              mb,              'margin',  'bottom', mb, 'ns-resize');
    if (ml > 0) addBand(rect.left - ml, rect.top - mt,     ml,  rect.height + mt + mb, 'margin',  'left',   ml, 'ew-resize');
    if (mr > 0) addBand(rect.right,     rect.top - mt,     mr,  rect.height + mt + mb, 'margin',  'right',  mr, 'ew-resize');

    var iT = pt + bt, iB = pb + bb, iL = pl + bl, iR = pr + br;
    if (iT > 0) addBand(rect.left + bl,   rect.top,              rect.width - bl - br, iT, 'padding', 'top',    pt||bt, 'ns-resize');
    if (iB > 0) addBand(rect.left + bl,   rect.bottom - iB,      rect.width - bl - br, iB, 'padding', 'bottom', pb||bb, 'ns-resize');
    if (iL > 0) addBand(rect.left,        rect.top + iT,         iL, rect.height - iT - iB, 'padding', 'left',  pl||bl, 'ew-resize');
    if (iR > 0) addBand(rect.right - iR,  rect.top + iT,         iR, rect.height - iT - iB, 'padding', 'right', pr||br, 'ew-resize');

    boxLayer.style.display = 'block';
  }

  function addBand(x, y, w, h, type, side, val, cursor) {
    if (w <= 0 || h <= 0) return;
    var div = document.createElement('div');
    div.className = 'de-box-band de-bm-' + type;
    div.style.cssText = 'left:'+x+'px;top:'+y+'px;width:'+Math.max(0,w)+'px;height:'+Math.max(0,h)+'px;cursor:'+cursor+';';
    if (Math.min(w, h) >= 12) {
      var lbl = document.createElement('span');
      lbl.className = 'de-box-label';
      lbl.textContent = Math.round(val) + 'px';
      div.appendChild(lbl);
    }
    div.addEventListener('mousedown', function(e) {
      e.preventDefault(); e.stopPropagation();
      startBoxDrag(e, type, side, val);
    });
    boxLayer.appendChild(div);
  }

  function startBoxDrag(e, type, side, startVal) {
    var cap = side[0].toUpperCase() + side.slice(1);
    var prop = (type === 'padding' ? 'padding' : 'margin') + cap;
    boxDrag = { prop: prop, side: side, startX: e.clientX, startY: e.clientY, startVal: startVal };
    document.addEventListener('mousemove', onBoxDrag, true);
    document.addEventListener('mouseup',   onBoxUp,   true);
    document.body.classList.add('de-is-dragging');
  }

  function onBoxDrag(e) {
    if (!boxDrag || !selectedEl) return;
    var d = boxDrag.side === 'top'    ? -(e.clientY - boxDrag.startY) :
            boxDrag.side === 'bottom' ?  (e.clientY - boxDrag.startY) :
            boxDrag.side === 'left'   ? -(e.clientX - boxDrag.startX) :
                                         (e.clientX - boxDrag.startX);
    selectedEl.style[boxDrag.prop] = Math.max(0, Math.round(boxDrag.startVal + d)) + 'px';
    positionOverlay();
    updateFlyoutValues();
  }

  function onBoxUp() {
    document.removeEventListener('mousemove', onBoxDrag, true);
    document.removeEventListener('mouseup',   onBoxUp,   true);
    document.body.classList.remove('de-is-dragging');
    boxDrag = null;
  }

  // ── Select / Deselect ─────────────────────────────────────────
  function getElTag(el) {
    var tag = el.tagName.toLowerCase();
    var id  = el.id ? '#' + el.id : '';
    var cls = '';
    if (el.className && typeof el.className === 'string') {
      var classes = el.className.trim().split(/\s+/)
        .filter(function(c) { return c && !c.startsWith('de-'); });
      if (classes.length) cls = '.' + classes.slice(0, 2).join('.');
    }
    return tag + id + cls;
  }

  function getActiveSlide() {
    return document.querySelector('.slide.active');
  }

  function isInActiveSlide(el) {
    var slide = getActiveSlide();
    return slide && slide.contains(el);
  }

  function selectElement(el) {
    if (!el || el === document.body) return;
    if (panel    && panel.contains(el))    return;
    if (flyout   && flyout.contains(el))   return;
    if (overlay  && overlay.contains(el))  return;
    if (boxLayer && boxLayer.contains(el)) return;
    // Only allow selecting elements on the currently active slide
    if (!isInActiveSlide(el)) return;

    selectedEl = el;
    if (!origStyles.has(el)) origStyles.set(el, el.getAttribute('style') || '');
    document.getElementById('deElTag').textContent = getElTag(el);

    positionOverlay();
    positionFlyout();
    buildLayerTree();
  }

  function deselectElement() {
    selectedEl = null;
    if (overlay)  { overlay.style.display  = 'none'; }
    if (flyout)   { flyout.style.display   = 'none'; }
    if (boxLayer) { boxLayer.innerHTML = ''; boxLayer.style.display = 'none'; }
    document.getElementById('deElTag').textContent = '—';
  }

  // ── Hover ─────────────────────────────────────────────────────
  function onHover(e) {
    if (!active || !highlight) return;
    if (activeTab === 'annotate') { highlight.style.display = 'none'; return; }
    if (panel    && panel.contains(e.target))    { highlight.style.display = 'none'; return; }
    if (flyout   && flyout.contains(e.target))   return;
    if (overlay  && overlay.contains(e.target))  return;
    if (handleDrag || moveDrag || boxDrag)        return;
    // Only highlight elements on the active slide
    if (!isInActiveSlide(e.target)) { highlight.style.display = 'none'; return; }
    var rect = e.target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    highlight.style.display = 'block';
    highlight.style.cssText =
      'display:block;top:'+rect.top+'px;left:'+rect.left+'px;width:'+rect.width+'px;height:'+rect.height+'px;';
  }

  // ── Main click-to-select ──────────────────────────────────────
  function onMouseDown(e) {
    if (!active || e.button !== 0) return;
    if (activeTab === 'annotate') return;
    if (panel    && panel.contains(e.target))    return;
    if (flyout   && flyout.contains(e.target))   return;
    if (overlay  && overlay.contains(e.target))  return;  // handles & selbox handled separately
    if (boxLayer && boxLayer.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(e.target);
    updateBreadcrumb(e.target);
  }

  function onScroll() { if (selectedEl) { positionOverlay(); positionFlyout(); } }
  function onResize() { if (selectedEl) { positionOverlay(); positionFlyout(); } }

  // ── CSS copy & reset ──────────────────────────────────────────
  function getElementPath(el) {
    var parts = [], cur = el;
    while (cur && cur !== document.body) {
      var tag = cur.tagName.toLowerCase();
      var id  = cur.id ? '#' + cur.id : '';
      var cls = (cur.className && typeof cur.className === 'string')
        ? '.' + cur.className.trim().split(/\s+/).filter(function(c) {
            return c && !c.startsWith('de-') && c !== 'active' && c !== 'fade-in';
          }).slice(0,2).join('.') : '';
      parts.unshift(tag + id + cls);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function copyCSS() {
    if (!selectedEl) return;
    var s  = selectedEl.style;
    var cs = getComputedStyle(selectedEl);
    var lines = ['/* Design Editor Export */', '/* ' + getElTag(selectedEl) + ' */',
                 '/* Path: ' + getElementPath(selectedEl) + ' */', ''];
    var props = ['fontSize','fontWeight','lineHeight','letterSpacing','color',
                 'backgroundColor','padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
                 'marginTop','marginRight','marginBottom','marginLeft',
                 'opacity','maxWidth','transform'];
    var hasChanges = false;
    props.forEach(function(p) {
      if (s[p]) { lines.push(p.replace(/([A-Z])/g,'-$1').toLowerCase() + ': ' + s[p] + ';'); hasChanges = true; }
    });
    if (!hasChanges) {
      lines.push('/* (no inline changes yet) */');
      lines.push('font-size: ' + cs.fontSize + ';');
      lines.push('color: ' + cs.color + ';');
    }
    var result = lines.join('\n');
    var out = document.getElementById('deOutput');
    if (out) { out.textContent = result; out.style.display = 'block'; }
    navigator.clipboard.writeText(result).catch(function() {});
    var btn = document.getElementById('deFvCopy');
    if (btn) { var o = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(function() { btn.textContent = o; }, 1400); }
  }

  function resetEl() {
    if (!selectedEl) return;
    selectedEl.setAttribute('style', origStyles.get(selectedEl) || '');
    positionOverlay();
    updateFlyoutValues();
  }

  // ── Global token controls ─────────────────────────────────────
  var TOKEN_VARS = [
    '--color-bg', '--color-bg-dark', '--color-bg-light', '--color-bg-light-alt',
    '--color-signal', '--color-text', '--color-accent'
  ];

  function buildTokenControls() {
    var container = document.getElementById('deTokensPanel');
    if (!container) return;
    var root  = document.documentElement;
    var style = getComputedStyle(root);
    container.innerHTML = '';
    TOKEN_VARS.forEach(function(token) {
      var val = style.getPropertyValue(token).trim();
      if (!val) return;
      var row    = document.createElement('div'); row.className = 'de-tok-row';
      var swatch = document.createElement('div'); swatch.className = 'de-tok-swatch';
      swatch.style.background = val;
      var input  = document.createElement('input'); input.type = 'color';
      input.value = rgbToHex(val.startsWith('#') ? val : val);
      input.style.cssText = 'position:absolute;opacity:0;width:1px;height:1px;pointer-events:none;';
      var name   = document.createElement('span'); name.className = 'de-tok-name';
      name.textContent = token.replace('--color-', ''); name.title = token;
      var hex    = document.createElement('span'); hex.className = 'de-tok-val';
      hex.textContent = rgbToHex(val.startsWith('#') ? val : val);
      swatch.addEventListener('click', function() {
        input.style.pointerEvents = 'all'; input.click();
        setTimeout(function() { input.style.pointerEvents = 'none'; }, 300);
      });
      input.addEventListener('input', function(e) {
        root.style.setProperty(token, e.target.value);
        swatch.style.background = e.target.value; hex.textContent = e.target.value;
      });
      row.appendChild(swatch); row.appendChild(input);
      row.appendChild(name);   row.appendChild(hex);
      container.appendChild(row);
    });
    if (!container.children.length) {
      container.innerHTML = '<span style="font-size:10px;color:#444;">No --color-* vars found</span>';
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    var t = rgb.trim();
    if (t.startsWith('#')) {
      if (t.length === 4) t = '#' + t[1]+t[1]+t[2]+t[2]+t[3]+t[3];
      return t.toLowerCase();
    }
    if (t === 'transparent' || t === 'rgba(0, 0, 0, 0)') return '#000000';
    var m = t.match(/\d+/g);
    if (!m || m.length < 3) return '#000000';
    return '#' + m.slice(0,3).map(function(x) { return ('0'+parseInt(x).toString(16)).slice(-2); }).join('');
  }

  // ── Layer Tree ────────────────────────────────────────────────
  function getLayerLabel(el) {
    var tag = el.tagName.toLowerCase();
    var id  = el.id ? '#' + el.id : '';
    var cls = '';
    if (el.className && typeof el.className === 'string' && el.className.trim()) {
      var classes = el.className.trim().split(/\s+/)
        .filter(function(c) { return c && !c.startsWith('de-') && c !== 'active' && c !== 'fade-in' && c !== 'visible'; });
      if (classes.length) cls = '.' + classes.slice(0, 2).join('.');
    }
    var label = tag + id + cls;
    if (!id && !cls) {
      var txt = (el.textContent || '').trim().replace(/\s+/g,' ').substring(0, 22);
      if (txt) label += ' "' + txt + (el.textContent.trim().length > 22 ? '…' : '') + '"';
    }
    return label;
  }

  function buildLayerNode(el, depth) {
    var wrapper = document.createElement('div');
    var hasKids = el.children.length > 0 && depth < 5;
    var isHidden = hiddenEls.get(el) || false;

    var row = document.createElement('div');
    row.className = 'de-layer-row' + (el === selectedEl ? ' selected' : '') + (isHidden ? ' hidden-el' : '');

    var tog = document.createElement('span');
    tog.className = 'de-layer-toggle';
    tog.textContent = hasKids ? '▶' : ' ';
    row.appendChild(tog);

    var lbl = document.createElement('span');
    lbl.className = 'de-layer-lbl'; lbl.textContent = getLayerLabel(el);
    row.appendChild(lbl);

    var eye = document.createElement('span');
    eye.className = 'de-layer-eye' + (isHidden ? ' eye-hidden' : '');
    eye.textContent = isHidden ? '○' : '●';
    row.appendChild(eye);

    wrapper.appendChild(row);
    var childWrap = document.createElement('div');
    childWrap.className = 'de-layer-children';
    childWrap.style.display = 'none';
    if (hasKids) Array.from(el.children).forEach(function(c) { childWrap.appendChild(buildLayerNode(c, depth + 1)); });
    wrapper.appendChild(childWrap);

    tog.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!hasKids) return;
      var open = childWrap.style.display !== 'none';
      childWrap.style.display = open ? 'none' : 'block';
      tog.textContent = open ? '▶' : '▼';
    });
    eye.addEventListener('click', function(e) {
      e.stopPropagation();
      var hidden = hiddenEls.get(el) || false;
      if (hidden) {
        el.style.visibility = ''; hiddenEls.set(el, false);
        eye.textContent = '●'; eye.classList.remove('eye-hidden'); row.classList.remove('hidden-el');
      } else {
        el.style.visibility = 'hidden'; hiddenEls.set(el, true);
        eye.textContent = '○'; eye.classList.add('eye-hidden'); row.classList.add('hidden-el');
      }
    });
    row.addEventListener('click', function() {
      document.querySelectorAll('#deLayersTree .de-layer-row.selected').forEach(function(r) { r.classList.remove('selected'); });
      row.classList.add('selected');
      updateBreadcrumb(el);
      selectElement(el);
    });
    row.addEventListener('mouseenter', function() {
      if (!highlight || handleDrag || moveDrag) return;
      var rect = el.getBoundingClientRect();
      highlight.style.cssText = 'display:block;top:'+rect.top+'px;left:'+rect.left+'px;width:'+rect.width+'px;height:'+rect.height+'px;';
    });
    return wrapper;
  }

  function updateBreadcrumb(el) {
    var bc = document.getElementById('deLayersBreadcrumb');
    if (!bc) return;
    var parts = [], cur = el;
    var slide = document.querySelector('.slide.active');
    while (cur && cur !== slide && parts.length < 5) {
      parts.unshift(cur.tagName.toLowerCase() +
        (cur.className && typeof cur.className === 'string' && cur.className.trim()
          ? '.' + cur.className.trim().split(/\s+/).filter(function(c) { return !c.startsWith('de-'); })[0] || ''
          : ''));
      cur = cur.parentElement;
    }
    bc.textContent = parts.join(' › ');
  }

  function buildLayerTree() {
    var container = document.getElementById('deLayersTree');
    var bc        = document.getElementById('deLayersBreadcrumb');
    if (!container) return;
    var slide = document.querySelector('.slide.active');
    if (!slide) { container.innerHTML = '<span style="color:#444">No active slide</span>'; return; }
    container.innerHTML = '';
    if (bc) bc.textContent = '';
    Array.from(slide.children).forEach(function(c) { container.appendChild(buildLayerNode(c, 0)); });
  }

  // ── Slide Diagnostics ─────────────────────────────────────────
  function refreshSlideDiag() {
    var diag = document.getElementById('deSlideDiag');
    if (!diag) return;
    var slides = Array.from(document.querySelectorAll('.slide'));
    var slide  = slides.find(function(s) { return s.classList.contains('active'); });
    if (!slide) { diag.innerHTML = '<span style="color:#444">No active slide</span>'; return; }
    var cs   = getComputedStyle(slide);
    var root = getComputedStyle(document.documentElement);
    var idx  = slides.indexOf(slide) + 1;
    var title = slide.getAttribute('data-title') || '?';
    var bgHex = rgbToHex(cs.backgroundColor);
    var tokenBgLight = root.getPropertyValue('--color-bg-light').trim();
    var tokenBgDark  = root.getPropertyValue('--color-bg-dark').trim();
    var tokenBg      = root.getPropertyValue('--color-bg').trim();
    var tokenText    = root.getPropertyValue('--color-text').trim();
    var fontDisplay  = root.getPropertyValue('--font-display').trim();
    var fontBody     = root.getPropertyValue('--font-body').trim();
    function norm(c) { return c.replace(/\s/g,'').toLowerCase(); }
    var bgMatch = '(hardcoded)', bgWarn = true;
    if (norm(bgHex) === norm(tokenBgLight))      { bgMatch = '--color-bg-light ✓'; bgWarn = false; }
    else if (norm(bgHex) === norm(tokenBgDark))  { bgMatch = '--color-bg-dark ✓';  bgWarn = false; }
    else if (norm(bgHex) === norm(tokenBg))      { bgMatch = '--color-bg ✓';        bgWarn = false; }
    else if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') { bgMatch = 'transparent'; bgWarn = false; }
    function lum(hex) {
      hex = hex.replace('#','');
      if (hex.length===3) hex=hex.split('').map(function(c){return c+c;}).join('');
      var r=parseInt(hex.substr(0,2),16)/255,g=parseInt(hex.substr(2,2),16)/255,b=parseInt(hex.substr(4,2),16)/255;
      function lin(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
      return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
    }
    function contrast(h1,h2){try{var l1=lum(h1),l2=lum(h2);return((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2);}catch(e){return'?';}}
    var textCR   = contrast(bgHex, (tokenText||'#f0ede8').replace(/['"]/g,'').trim());
    var h1 = slide.querySelector('h1,h2,h3');
    diag.innerHTML =
      '<div class="de-section" style="margin-top:0;border-top:none;padding-top:0;">Slide</div>' +
      tokRow('slide', idx + ' / ' + slides.length) +
      tokRow('title', '<span style="color:#eee">' + title + '</span>') +
      '<div class="de-section">Background</div>' +
      '<div class="de-swatch-row"><div class="de-swatch" style="background:'+bgHex+'"></div>' +
      '<div class="de-swatch-info"><div class="de-swatch-name">'+bgMatch+'</div>' +
      '<div class="de-swatch-hex">'+bgHex+'</div></div></div>' +
      '<div class="de-section">Contrast</div>' +
      tokRow('text/bg', '<span style="color:'+(parseFloat(textCR)<4.5?'#f97316':'#4ade80')+'">'+textCR+':1 '+(parseFloat(textCR)<4.5?'⚠':'✓ AA')+'</span>') +
      '<div class="de-section">Typography</div>' +
      tokRow('display', fontDisplay.split(',')[0] || '—') +
      tokRow('body',    fontBody.split(',')[0]    || '—') +
      (h1 ? tokRow('h1 size', getComputedStyle(h1).fontSize) : '');
  }

  function tokRow(name, val) {
    return '<div class="de-token-row"><span class="de-token-name">' + name +
           '</span><span class="de-token-val">' + val + '</span></div>';
  }

  // ── Toggle ────────────────────────────────────────────────────
  function toggle() {
    active = !active;
    if (!panel) createPanel();
    panel.style.display = active ? 'block' : 'none';

    if (active) {
      document.addEventListener('mousedown', onMouseDown, true);
      document.addEventListener('mousemove', onHover,     true);
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onResize);
      document.addEventListener('slidechange', onSlideChange);
      indicator = document.createElement('div');
      indicator.className = 'de-mode-indicator';
      indicator.textContent = '🎨 Design Mode — D to exit';
      document.body.appendChild(indicator);
      setTimeout(function() { window._deShowTab('layers'); }, 50);
    } else {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onHover,     true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('slidechange', onSlideChange);
      // Clean up annotation overlay
      if (window.PRES && window.PRES.annotate) {
        window.PRES.annotate.hide();
        window.PRES.annotate.clear();
      }
      // Clean up any active drags
      document.removeEventListener('mousemove', onHandleDrag, true);
      document.removeEventListener('mouseup',   onHandleUp,   true);
      document.removeEventListener('mousemove', onMoveDrag,   true);
      document.removeEventListener('mouseup',   onMoveUp,     true);
      document.removeEventListener('mousemove', onBoxDrag,    true);
      document.removeEventListener('mouseup',   onBoxUp,      true);
      document.body.classList.remove('de-is-dragging');
      handleDrag = moveDrag = boxDrag = null;
      deselectElement();
      if (highlight) highlight.style.display = 'none';
      if (indicator) { indicator.remove(); indicator = null; }
    }
  }

  function onSlideChange() {
    deselectElement();
    if (activeTab === 'slide')  refreshSlideDiag();
    if (activeTab === 'layers') buildLayerTree();
  }

  // ── Keybindings ───────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape' && active) deselectElement();
  });

  console.log('[DesignEditor v4] Ready — press D to toggle');
})();
