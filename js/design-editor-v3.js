/**
 * Live Design Editor — Toggle with 'D' key
 * Canvas-first: drag border to move, handles to resize, box-model visualization,
 * inline floating toolbar, global token controls. 'D' toggles, Esc deselects.
 */
(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────
  var active     = false;
  var selectedEl = null;
  var panel      = null;
  var highlight  = null;
  var overlay    = null;
  var toolbar    = null;
  var boxLayer   = null;
  var activeTab  = 'layers';
  var handleDrag = null;
  var moveDrag   = null;
  var boxDrag    = null;
  var indicator  = null;
  var hiddenEls  = new WeakMap();
  var origStyles = new WeakMap();

  // ── CSS ───────────────────────────────────────────────────────
  var PANEL_CSS = `
    #designEditorPanel {
      position: fixed; top: 60px; right: 16px; z-index: 99999;
      width: 268px; background: rgba(12,10,8,0.97); color: #eee;
      border: 1px solid rgba(255,255,255,0.13); border-radius: 10px;
      font-family: 'Inter', system-ui, sans-serif; font-size: 12px;
      padding: 14px; display: none; backdrop-filter: blur(14px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      max-height: calc(100vh - 80px); overflow-y: auto;
    }
    #designEditorPanel .de-title {
      font-size: 13px; font-weight: 700; color: #a78bfa;
      margin-bottom: 10px; display: flex; align-items: center;
      justify-content: space-between;
    }
    #designEditorPanel .de-title-left { display:flex; align-items:center; gap:8px; }
    #designEditorPanel .de-tag {
      font-size: 10px; color: #888; background: rgba(255,255,255,0.06);
      padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace;
    }
    #designEditorPanel .de-export-btn {
      background: rgba(167,139,250,0.12); color: #a78bfa; border: none;
      padding: 4px 9px; border-radius: 5px; font-size: 10px; font-weight: 600;
      cursor: pointer;
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
    /* Token edit row */
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
    .de-tok-val { font-size: 10px; color: #888; font-family: 'Courier New', monospace; }
    /* Layers tree */
    .de-layer-row {
      display: flex; align-items: center; gap: 4px;
      padding: 2px 4px; border-radius: 3px; cursor: pointer;
      font-family: 'Courier New', monospace; font-size: 10px;
      color: #777; transition: background 0.1s; white-space: nowrap; overflow: hidden;
    }
    .de-layer-row:hover { background: rgba(167,139,250,0.08); color: #ccc; }
    .de-layer-row.selected { background: rgba(167,139,250,0.16); color: #a78bfa; }
    .de-layer-row.hidden-el { opacity: 0.3; }
    .de-layer-toggle { flex-shrink:0; width:12px; font-size:9px; color:#444; cursor:pointer; user-select:none; text-align:center; }
    .de-layer-toggle:hover { color: #ccc; }
    .de-layer-lbl { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .de-layer-eye { flex-shrink:0; font-size:9px; color:#333; cursor:pointer; padding:0 2px; user-select:none; opacity:0; }
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
    /* Mode indicator */
    .de-mode-indicator {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      z-index: 99999; background: #a78bfa; color: #000; font-weight: 700;
      font-size: 12px; padding: 6px 16px; border-radius: 20px;
      font-family: 'Inter', system-ui, sans-serif;
      box-shadow: 0 4px 16px rgba(167,139,250,0.4); pointer-events: none;
    }
    /* Hover preview */
    #designEditorHighlight {
      position: fixed; z-index: 99995; pointer-events: none;
      border: 1.5px solid rgba(167,139,250,0.55); border-radius: 3px;
      background: rgba(167,139,250,0.04);
      transition: top 0.05s ease, left 0.05s ease, width 0.05s ease, height 0.05s ease;
    }
    /* Selection overlay */
    #deSelOverlay { position: fixed; z-index: 99997; pointer-events: none; }
    #deSelBox {
      position: absolute; inset: 0;
      border: 1.5px dashed #a78bfa; border-radius: 2px; pointer-events: none;
    }
    #deSelLabel {
      position: absolute; bottom: calc(100% + 6px); left: 0;
      background: #a78bfa; color: #000;
      font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
      font-family: 'Courier New', monospace; pointer-events: none; white-space: nowrap;
      max-width: 220px; overflow: hidden; text-overflow: ellipsis;
    }
    /* Border mover strips — 16px wide, centered on each edge */
    .de-sel-mover {
      position: absolute; cursor: move; pointer-events: all; z-index: 0;
    }
    #deSelMoverTop    { top: -8px;    left: -8px;  right: -8px;   height: 16px; }
    #deSelMoverBottom { bottom: -8px; left: -8px;  right: -8px;   height: 16px; }
    #deSelMoverLeft   { left: -8px;   top: -8px;   bottom: -8px;  width:  16px; }
    #deSelMoverRight  { right: -8px;  top: -8px;   bottom: -8px;  width:  16px; }
    /* Handles */
    .de-handle {
      position: absolute; width: 9px; height: 9px;
      background: #fff; border: 1.5px solid #a78bfa; border-radius: 2px;
      transform: translate(-50%, -50%); pointer-events: all; z-index: 1;
    }
    .de-handle:hover { background: #a78bfa; }
    .de-handle[data-handle="nw"] { left: 0;    top: 0;    cursor: nwse-resize; }
    .de-handle[data-handle="n"]  { left: 50%;  top: 0;    cursor: ns-resize; }
    .de-handle[data-handle="ne"] { left: 100%; top: 0;    cursor: nesw-resize; }
    .de-handle[data-handle="e"]  { left: 100%; top: 50%;  cursor: ew-resize; }
    .de-handle[data-handle="se"] { left: 100%; top: 100%; cursor: nwse-resize; }
    .de-handle[data-handle="s"]  { left: 50%;  top: 100%; cursor: ns-resize; }
    .de-handle[data-handle="sw"] { left: 0;    top: 100%; cursor: nesw-resize; }
    .de-handle[data-handle="w"]  { left: 0;    top: 50%;  cursor: ew-resize; }
    /* Box model layer */
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
    /* Floating toolbar */
    #deFloatingToolbar {
      position: fixed; z-index: 99999; display: none; align-items: center;
      background: rgba(10,8,7,0.98); border: 1px solid rgba(255,255,255,0.11);
      border-radius: 99px; padding: 5px 10px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.65);
      font-family: 'Inter', system-ui, sans-serif;
      backdrop-filter: blur(18px); white-space: nowrap; gap: 0;
    }
    .de-ft-grp { display: flex; align-items: center; gap: 2px; padding: 0 5px; }
    .de-ft-icon { font-size: 9px; color: #555; user-select: none; min-width: 16px; text-align: center; }
    .de-ft-btn {
      background: none; border: none; color: #666;
      font-size: 15px; line-height: 1; padding: 1px 4px;
      cursor: pointer; border-radius: 4px; user-select: none;
    }
    .de-ft-btn:hover { color: #a78bfa; background: rgba(167,139,250,0.1); }
    .de-ft-val {
      font-size: 11px; color: #e0e0e0; font-family: 'Courier New', monospace;
      min-width: 34px; text-align: center; padding: 0 2px;
    }
    .de-ft-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.07); margin: 0 1px; }
    .de-ft-action {
      background: none; border: none; color: #666;
      font-size: 12px; padding: 3px 6px; cursor: pointer; border-radius: 5px;
    }
    .de-ft-action:hover { color: #a78bfa; background: rgba(167,139,250,0.1); }
    .de-ft-close:hover { color: #f87171; background: rgba(248,113,113,0.1); }
    .de-ft-swatch {
      width: 14px; height: 14px; border-radius: 3px;
      border: 1.5px solid rgba(255,255,255,0.2); cursor: pointer; flex-shrink: 0;
    }
    /* Drag cursors */
    .de-dragging, .de-dragging * { cursor: grabbing !important; user-select: none !important; }
  `;

  // ── Create panel + overlay + toolbar + box layer ──────────────
  function createPanel() {
    // Inject global CSS
    var styleEl = document.createElement('style');
    styleEl.textContent = PANEL_CSS;
    document.head.appendChild(styleEl);

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
      <div class="de-output" id="deOutput"></div>
    `;
    document.body.appendChild(panel);

    // Hover highlight
    highlight = document.createElement('div');
    highlight.id = 'designEditorHighlight';
    highlight.style.display = 'none';
    document.body.appendChild(highlight);

    // Selection overlay with mover strips + handles
    overlay = document.createElement('div');
    overlay.id = 'deSelOverlay';
    overlay.innerHTML =
      '<div id="deSelBox"></div>' +
      '<div id="deSelLabel"></div>' +
      '<div id="deSelMoverTop"    class="de-sel-mover"></div>' +
      '<div id="deSelMoverBottom" class="de-sel-mover"></div>' +
      '<div id="deSelMoverLeft"   class="de-sel-mover"></div>' +
      '<div id="deSelMoverRight"  class="de-sel-mover"></div>' +
      ['nw','n','ne','e','se','s','sw','w'].map(function(h) {
        return '<div class="de-handle" data-handle="' + h + '"></div>';
      }).join('');
    overlay.style.display = 'none';
    document.body.appendChild(overlay);

    // Wire handle drags
    overlay.querySelectorAll('.de-handle').forEach(function(h) {
      h.addEventListener('mousedown', function(e) {
        e.preventDefault(); e.stopPropagation();
        startHandleDrag(e, h.dataset.handle);
      }, true);
    });

    // Wire mover strips (drag = translate; click = drill)
    ['deSelMoverTop','deSelMoverBottom','deSelMoverLeft','deSelMoverRight'].forEach(function(id) {
      document.getElementById(id).addEventListener('mousedown', function(e) {
        e.preventDefault(); e.stopPropagation();
        startMoveDrag(e);
      }, true);
    });

    // Box model layer
    boxLayer = document.createElement('div');
    boxLayer.id = 'deBoxModelLayer';
    boxLayer.style.display = 'none';
    document.body.appendChild(boxLayer);

    // Floating toolbar
    toolbar = document.createElement('div');
    toolbar.id = 'deFloatingToolbar';
    toolbar.innerHTML =
      ftGrp('Aa',  'fontSize',     'deFtFontSize',     '—') +
      sep() +
      ftGrp('↕',   'lineHeight',   'deFtLineHeight',   '—') +
      sep() +
      ftGrp('A—',  'letterSpacing','deFtLetterSpacing','—') +
      sep() +
      ftGrp('↔',   'maxWidth',     'deFtMaxWidth',     '—') +
      sep() +
      ftGrp('○',   'opacity',      'deFtOpacity',      '—') +
      sep() +
      ftGrp('⬜',  'padding',      'deFtPadding',      '—') +
      sep() +
      '<div class="de-ft-grp">' +
        '<div class="de-ft-swatch" id="deFtSwatch" title="Text color"></div>' +
        '<input type="color" id="deFtColorPicker" style="position:absolute;opacity:0;width:1px;height:1px;pointer-events:none;">' +
      '</div>' +
      sep() +
      '<button class="de-ft-action" id="deFtCopy" title="Copy CSS">📋</button>' +
      '<button class="de-ft-action" id="deFtReset" title="Reset">↩</button>' +
      '<button class="de-ft-action de-ft-close" id="deFtClose" title="Deselect">×</button>';
    toolbar.style.display = 'none';
    document.body.appendChild(toolbar);

    wireToolbar();

    document.getElementById('dePanelCopy').addEventListener('click', copyCSS);

    window._deShowTab = function(tab) {
      activeTab = tab;
      document.getElementById('deTabSlide').classList.toggle('active', tab === 'slide');
      document.getElementById('deTabLayers').classList.toggle('active', tab === 'layers');
      document.getElementById('deSlidePanel').style.display  = tab === 'slide'  ? 'block' : 'none';
      document.getElementById('deLayersPanel').style.display = tab === 'layers' ? 'block' : 'none';
      if (tab === 'slide')  { refreshSlideDiag(); buildTokenControls(); }
      if (tab === 'layers') buildLayerTree();
    };
    window._deRefreshSlide = function() { refreshSlideDiag(); buildTokenControls(); };
  }

  function ftGrp(icon, prop, valId, init) {
    return '<div class="de-ft-grp">' +
      '<span class="de-ft-icon">' + icon + '</span>' +
      '<button class="de-ft-btn" data-prop="' + prop + '" data-dir="-1">−</button>' +
      '<span class="de-ft-val" id="' + valId + '">' + init + '</span>' +
      '<button class="de-ft-btn" data-prop="' + prop + '" data-dir="1">+</button>' +
      '</div>';
  }
  function sep() { return '<div class="de-ft-sep"></div>'; }

  function wireToolbar() {
    toolbar.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-prop][data-dir]');
      if (!btn) return;
      stepProp(btn.dataset.prop, parseFloat(btn.dataset.dir));
    });
    document.getElementById('deFtSwatch').addEventListener('click', function() {
      var p = document.getElementById('deFtColorPicker');
      p.style.pointerEvents = 'all';
      p.click();
      setTimeout(function() { p.style.pointerEvents = 'none'; }, 300);
    });
    document.getElementById('deFtColorPicker').addEventListener('input', function(e) {
      if (!selectedEl) return;
      selectedEl.style.color = e.target.value;
      document.getElementById('deFtSwatch').style.background = e.target.value;
    });
    document.getElementById('deFtCopy').addEventListener('click', copyCSS);
    document.getElementById('deFtReset').addEventListener('click', resetEl);
    document.getElementById('deFtClose').addEventListener('click', deselectElement);
  }

  // ── Transform helpers ─────────────────────────────────────────
  function getTranslate(el) {
    var m = (el.style.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
    return m ? { x: parseFloat(m[1]) || 0, y: parseFloat(m[2]) || 0 } : { x: 0, y: 0 };
  }

  function getScale(el) {
    var m = (el.style.transform || '').match(/scale\(([^,)]+)(?:,\s*([^)]+))?\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2] || m[1]) } : { x: 1, y: 1 };
  }

  function setTransform(el, tx, ty, sx, sy) {
    var parts = [];
    if (tx !== 0 || ty !== 0)
      parts.push('translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)');
    if (Math.abs(sx - 1) > 0.0005 || Math.abs(sy - 1) > 0.0005)
      parts.push('scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')');
    el.style.transform = parts.join(' ');
  }

  // ── Overlay & toolbar positioning ─────────────────────────────
  var PAD = 6; // overlay padding around element

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

  function positionToolbar() {
    if (!toolbar || !selectedEl) return;
    var rect = selectedEl.getBoundingClientRect();
    var margin = 12;
    toolbar.style.visibility = 'hidden';
    toolbar.style.display    = 'flex';
    var tbW = toolbar.offsetWidth  || 620;
    var tbH = toolbar.offsetHeight || 42;
    toolbar.style.visibility = '';
    var top  = rect.bottom + margin;
    if (top + tbH > window.innerHeight - 16) top = rect.top - tbH - margin;
    var left = rect.left + rect.width / 2 - tbW / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tbW - 10));
    toolbar.style.top  = top  + 'px';
    toolbar.style.left = left + 'px';
    updateToolbarValues();
  }

  function updateToolbarValues() {
    if (!selectedEl || !toolbar) return;
    var cs = getComputedStyle(selectedEl);
    var fs  = parseFloat(cs.fontSize)  || 16;
    var lh  = parseFloat(cs.lineHeight);
    var ls  = parseFloat(cs.letterSpacing) || 0;
    var mw  = parseFloat(cs.maxWidth);
    var op  = parseFloat(cs.opacity != null ? cs.opacity : '1');
    var pt  = parseFloat(cs.paddingTop)    || 0;
    var pr  = parseFloat(cs.paddingRight)  || 0;
    var pb  = parseFloat(cs.paddingBottom) || 0;
    var pl  = parseFloat(cs.paddingLeft)   || 0;
    var pad = (pt === pr && pr === pb && pb === pl) ? pt : Math.round((pt+pr+pb+pl)/4);

    setFtVal('deFtFontSize',      Math.round(fs) + 'px');
    setFtVal('deFtLineHeight',    (lh && fs ? (lh / fs).toFixed(2) : '—'));
    setFtVal('deFtLetterSpacing', ls.toFixed(1) + 'px');
    setFtVal('deFtMaxWidth',      isNaN(mw) ? 'auto' : Math.round(mw) + 'px');
    setFtVal('deFtOpacity',       Math.round(op * 100) + '%');
    setFtVal('deFtPadding',       Math.round(pad) + 'px');

    var swatch = document.getElementById('deFtSwatch');
    if (swatch) swatch.style.background = cs.color;
    var picker = document.getElementById('deFtColorPicker');
    if (picker) picker.value = rgbToHex(cs.color);
  }

  function setFtVal(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  // ── Stepper ───────────────────────────────────────────────────
  var STEPS = { fontSize: 1, lineHeight: 0.05, letterSpacing: 0.5, maxWidth: 10, opacity: 0.05, padding: 2 };

  function stepProp(prop, dir) {
    if (!selectedEl) return;
    var cs = getComputedStyle(selectedEl);
    var step = STEPS[prop] || 1;

    if (prop === 'fontSize') {
      var v = Math.max(1, (parseFloat(cs.fontSize) || 16) + dir * step);
      selectedEl.style.fontSize = v + 'px';
    } else if (prop === 'lineHeight') {
      var fs = parseFloat(cs.fontSize) || 16;
      var lh = parseFloat(cs.lineHeight);
      var r  = (lh && fs ? lh / fs : 1.4);
      selectedEl.style.lineHeight = Math.max(0.5, r + dir * step).toFixed(2);
    } else if (prop === 'letterSpacing') {
      var v = (parseFloat(cs.letterSpacing) || 0) + dir * step;
      selectedEl.style.letterSpacing = v.toFixed(1) + 'px';
    } else if (prop === 'maxWidth') {
      var cur = parseFloat(cs.maxWidth);
      var base = isNaN(cur) ? (parseFloat(cs.width) || 400) : cur;
      selectedEl.style.maxWidth = Math.max(50, base + dir * step) + 'px';
    } else if (prop === 'opacity') {
      var v = Math.max(0, Math.min(1, (parseFloat(cs.opacity) || 1) + dir * step));
      selectedEl.style.opacity = v.toFixed(2);
    } else if (prop === 'padding') {
      var cur = parseFloat(cs.paddingTop) || 0;
      selectedEl.style.padding = Math.max(0, cur + dir * step) + 'px';
    }

    positionOverlay();
    updateToolbarValues();
  }

  // ── Move drag (translate via border strips) ───────────────────
  function startMoveDrag(e) {
    if (!selectedEl) return;
    var t = getTranslate(selectedEl);
    moveDrag = { startX: e.clientX, startY: e.clientY, baseX: t.x, baseY: t.y, moved: false };
    document.addEventListener('mousemove', onMoveDrag, true);
    document.addEventListener('mouseup',   onMoveUp,   true);
    document.body.classList.add('de-dragging');
  }

  function onMoveDrag(e) {
    if (!moveDrag || !selectedEl) return;
    var dx = e.clientX - moveDrag.startX;
    var dy = e.clientY - moveDrag.startY;
    if (!moveDrag.moved && Math.sqrt(dx*dx + dy*dy) > 4) moveDrag.moved = true;
    if (!moveDrag.moved) return;
    var sc = getScale(selectedEl);
    setTransform(selectedEl, Math.round(moveDrag.baseX + dx), Math.round(moveDrag.baseY + dy), sc.x, sc.y);
    positionOverlay();
  }

  function onMoveUp(e) {
    document.removeEventListener('mousemove', onMoveDrag, true);
    document.removeEventListener('mouseup',   onMoveUp,   true);
    document.body.classList.remove('de-dragging');
    var wasDrag = moveDrag && moveDrag.moved;
    moveDrag = null;
    if (!wasDrag) {
      // Click without drag: drill into child element
      overlay.style.display = 'none';
      var el = document.elementFromPoint(e.clientX, e.clientY);
      overlay.style.display = 'block';
      if (el && el !== selectedEl && el !== document.body && !panel.contains(el)) {
        selectElement(el);
        updateBreadcrumb(el);
      }
    }
  }

  // ── Handle drag (scale / maxWidth / fontSize) ─────────────────
  function startHandleDrag(e, handle) {
    if (!selectedEl) return;
    var cs   = getComputedStyle(selectedEl);
    var rect = selectedEl.getBoundingClientRect();
    var isCorner = /^(nw|ne|se|sw)$/.test(handle);
    handleDrag = {
      handle:    handle,
      type:      isCorner ? 'scale' : (handle==='e'||handle==='w') ? 'maxWidth' : 'fontSize',
      startX:    e.clientX,
      startY:    e.clientY,
      origW:     rect.width,
      origH:     rect.height,
      origTX:    getTranslate(selectedEl).x,
      origTY:    getTranslate(selectedEl).y,
      origSX:    getScale(selectedEl).x,
      origSY:    getScale(selectedEl).y,
      origFS:    parseFloat(cs.fontSize) || 16,
      origMW:    (parseFloat(cs.maxWidth) || rect.width)
    };
    document.addEventListener('mousemove', onHandleDrag, true);
    document.addEventListener('mouseup',   onHandleUp,   true);
    document.body.classList.add('de-dragging');
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
    updateToolbarValues();
  }

  function onHandleUp() {
    document.removeEventListener('mousemove', onHandleDrag, true);
    document.removeEventListener('mouseup',   onHandleUp,   true);
    document.body.classList.remove('de-dragging');
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
    var pt = parseFloat(cs.paddingTop)    || 0;
    var pr = parseFloat(cs.paddingRight)  || 0;
    var pb = parseFloat(cs.paddingBottom) || 0;
    var pl = parseFloat(cs.paddingLeft)   || 0;
    var bt = parseFloat(cs.borderTopWidth)    || 0;
    var br = parseFloat(cs.borderRightWidth)  || 0;
    var bb = parseFloat(cs.borderBottomWidth) || 0;
    var bl = parseFloat(cs.borderLeftWidth)   || 0;

    // Margin bands (amber) — outside element
    if (mt > 0) addBand(rect.left, rect.top - mt, rect.width, mt, 'margin', 'top',    mt, 'ns-resize');
    if (mb > 0) addBand(rect.left, rect.bottom,   rect.width, mb, 'margin', 'bottom', mb, 'ns-resize');
    if (ml > 0) addBand(rect.left - ml, rect.top - mt, ml, rect.height + mt + mb, 'margin', 'left',  ml, 'ew-resize');
    if (mr > 0) addBand(rect.right,     rect.top - mt, mr, rect.height + mt + mb, 'margin', 'right', mr, 'ew-resize');

    // Padding bands (teal) — inside element at edges
    var innerT = pt + bt, innerB = pb + bb, innerL = pl + bl, innerR = pr + br;
    if (innerT > 0) addBand(rect.left + bl,       rect.top,              rect.width - bl - br, innerT, 'padding', 'top',    pt||bt, 'ns-resize');
    if (innerB > 0) addBand(rect.left + bl,       rect.bottom - innerB,  rect.width - bl - br, innerB, 'padding', 'bottom', pb||bb, 'ns-resize');
    if (innerL > 0) addBand(rect.left,             rect.top + innerT,     innerL, rect.height - innerT - innerB, 'padding', 'left',  pl||bl, 'ew-resize');
    if (innerR > 0) addBand(rect.right - innerR,   rect.top + innerT,     innerR, rect.height - innerT - innerB, 'padding', 'right', pr||br, 'ew-resize');

    boxLayer.style.display = 'block';
  }

  function addBand(x, y, w, h, type, side, val, cursor) {
    if (w < 0 || h < 0) return;
    var div = document.createElement('div');
    div.className = 'de-box-band de-bm-' + type;
    div.style.cssText =
      'left:' + x + 'px;top:' + y + 'px;' +
      'width:' + Math.max(0, w) + 'px;height:' + Math.max(0, h) + 'px;' +
      'cursor:' + cursor + ';';

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

  // Box model drag to resize margin/padding
  function startBoxDrag(e, type, side, startVal) {
    var prop = type === 'padding'
      ? 'padding' + side[0].toUpperCase() + side.slice(1)
      : 'margin'  + side[0].toUpperCase() + side.slice(1);
    boxDrag = { side: side, prop: prop, startX: e.clientX, startY: e.clientY, startVal: startVal };
    document.addEventListener('mousemove', onBoxDrag, true);
    document.addEventListener('mouseup',   onBoxUp,   true);
    document.body.classList.add('de-dragging');
  }

  function onBoxDrag(e) {
    if (!boxDrag || !selectedEl) return;
    var delta = (boxDrag.side === 'top')    ? -(e.clientY - boxDrag.startY) :
                (boxDrag.side === 'bottom') ?  (e.clientY - boxDrag.startY) :
                (boxDrag.side === 'left')   ? -(e.clientX - boxDrag.startX) :
                                               (e.clientX - boxDrag.startX);
    var newVal = Math.max(0, Math.round(boxDrag.startVal + delta));
    selectedEl.style[boxDrag.prop] = newVal + 'px';
    positionOverlay();
    updateToolbarValues();
  }

  function onBoxUp() {
    document.removeEventListener('mousemove', onBoxDrag, true);
    document.removeEventListener('mouseup',   onBoxUp,   true);
    document.body.classList.remove('de-dragging');
    boxDrag = null;
  }

  // ── Select / Deselect ─────────────────────────────────────────
  function getElTag(el) {
    var tag = el.tagName.toLowerCase();
    var id  = el.id ? '#' + el.id : '';
    var cls = '';
    if (el.className && typeof el.className === 'string') {
      var classes = el.className.trim().split(/\s+/).filter(function(c) { return c && !c.startsWith('de-'); });
      if (classes.length) cls = '.' + classes.slice(0, 2).join('.');
    }
    return tag + id + cls;
  }

  function selectElement(el) {
    if (!el || el === document.body) return;
    if (panel   && panel.contains(el))   return;
    if (toolbar && toolbar.contains(el)) return;
    if (overlay && el.id && el.id.startsWith('deSel')) return;
    if (boxLayer && boxLayer.contains(el)) return;

    selectedEl = el;
    if (!origStyles.has(el)) origStyles.set(el, el.getAttribute('style') || '');

    document.getElementById('deElTag').textContent = getElTag(el);
    // Update layers tree highlight
    var tree = document.getElementById('deLayersTree');
    if (tree) tree.querySelectorAll('.de-layer-row.selected').forEach(function(r) { r.classList.remove('selected'); });

    positionOverlay();
    positionToolbar();
  }

  function deselectElement() {
    selectedEl = null;
    if (overlay)   overlay.style.display   = 'none';
    if (toolbar)   toolbar.style.display   = 'none';
    if (boxLayer)  boxLayer.style.display  = 'none';
    if (boxLayer)  boxLayer.innerHTML      = '';
    document.getElementById('deElTag').textContent = '—';
  }

  // ── Hover preview ─────────────────────────────────────────────
  function onHover(e) {
    if (!active || !highlight) return;
    if (panel   && panel.contains(e.target))   { highlight.style.display = 'none'; return; }
    if (toolbar && toolbar.contains(e.target)) return;
    if (e.target.classList.contains('de-handle')) return;
    if (handleDrag || moveDrag || boxDrag) return;
    var rect = e.target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    highlight.style.display = 'block';
    highlight.style.top    = rect.top    + 'px';
    highlight.style.left   = rect.left   + 'px';
    highlight.style.width  = rect.width  + 'px';
    highlight.style.height = rect.height + 'px';
  }

  // ── Main mousedown → select ───────────────────────────────────
  function onMouseDown(e) {
    if (!active) return;
    if (panel   && panel.contains(e.target))   return;
    if (toolbar && toolbar.contains(e.target)) return;
    if (e.target.classList.contains('de-handle') || e.target.classList.contains('de-sel-mover')) return;
    if (overlay  && overlay.contains(e.target))  return;
    if (boxLayer && boxLayer.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(e.target);
    updateBreadcrumb(e.target);
  }

  function onScroll()  { if (selectedEl) { positionOverlay(); positionToolbar(); } }
  function onResize()  { if (selectedEl) { positionOverlay(); positionToolbar(); } }

  // ── CSS copy & reset ──────────────────────────────────────────
  function getElementPath(el) {
    var parts = [], cur = el;
    while (cur && cur !== document.body) {
      var tag = cur.tagName.toLowerCase();
      var id  = cur.id ? '#' + cur.id : '';
      var cls = (cur.className && typeof cur.className === 'string')
        ? '.' + cur.className.trim().split(/\s+/).filter(function(c) {
            return c && !c.startsWith('de-') && c !== 'active' && c !== 'fade-in';
          }).join('.') : '';
      parts.unshift(tag + id + cls);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function copyCSS() {
    if (!selectedEl) { showCopyFeedback('nothing selected'); return; }
    var s  = selectedEl.style;
    var cs = getComputedStyle(selectedEl);
    var lines = ['/* Design Editor Export */', '/* ' + getElTag(selectedEl) + ' */', '/* Path: ' + getElementPath(selectedEl) + ' */', ''];
    var props = ['fontSize','fontWeight','lineHeight','letterSpacing','color',
                 'backgroundColor','padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
                 'marginTop','marginRight','marginBottom','marginLeft',
                 'opacity','maxWidth','transform'];
    var hasChanges = false;
    props.forEach(function(p) {
      if (s[p]) { lines.push(p.replace(/([A-Z])/g,'-$1').toLowerCase() + ': ' + s[p] + ';'); hasChanges = true; }
    });
    if (!hasChanges) {
      lines.push('/* (no inline changes) */');
      lines.push('font-size: ' + cs.fontSize + ';');
      lines.push('color: ' + cs.color + ';');
    }
    var result = lines.join('\n');
    var out = document.getElementById('deOutput');
    if (out) { out.textContent = result; out.style.display = 'block'; }
    navigator.clipboard.writeText(result).catch(function() {});
    showCopyFeedback('✓ Copied!');
  }

  function resetEl() {
    if (!selectedEl) return;
    selectedEl.setAttribute('style', origStyles.get(selectedEl) || '');
    positionOverlay();
    updateToolbarValues();
    var out = document.getElementById('deOutput');
    if (out) out.style.display = 'none';
  }

  function showCopyFeedback(msg) {
    var btn = document.getElementById('deFtCopy');
    if (!btn) return;
    var orig = btn.textContent; btn.textContent = msg;
    setTimeout(function() { btn.textContent = orig; }, 1400);
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

      var row    = document.createElement('div');
      row.className = 'de-tok-row';

      var swatch = document.createElement('div');
      swatch.className = 'de-tok-swatch';
      swatch.style.background = val;

      var input  = document.createElement('input');
      input.type = 'color';
      input.value = rgbToHex(val.trim().startsWith('#') ? val.trim() : val);
      input.style.cssText = 'position:absolute;opacity:0;width:1px;height:1px;pointer-events:none;';

      var name   = document.createElement('span');
      name.className = 'de-tok-name';
      name.textContent = token.replace('--color-', '');
      name.title = token;

      var hex    = document.createElement('span');
      hex.className = 'de-tok-val';
      hex.textContent = rgbToHex(val.trim().startsWith('#') ? val.trim() : val);

      swatch.addEventListener('click', function() {
        input.style.pointerEvents = 'all';
        input.click();
        setTimeout(function() { input.style.pointerEvents = 'none'; }, 300);
      });
      input.addEventListener('input', function(e) {
        root.style.setProperty(token, e.target.value);
        swatch.style.background = e.target.value;
        hex.textContent = e.target.value;
      });

      row.appendChild(swatch);
      row.appendChild(input);
      row.appendChild(name);
      row.appendChild(hex);
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
      var txt = (el.textContent || '').trim().replace(/\s+/g,' ').substring(0,22);
      if (txt) label += ' "' + txt + (el.textContent.trim().length > 22 ? '…' : '') + '"';
    }
    return label;
  }

  function buildLayerNode(el, depth) {
    var wrapper = document.createElement('div');
    var hasKids = el.children.length > 0 && depth < 5;
    var isHidden = hiddenEls.get(el) || false;

    var row = document.createElement('div');
    row.className = 'de-layer-row' + (isHidden ? ' hidden-el' : '');

    var tog = document.createElement('span');
    tog.className = 'de-layer-toggle';
    tog.textContent = hasKids ? '▶' : ' ';
    row.appendChild(tog);

    var lbl = document.createElement('span');
    lbl.className = 'de-layer-lbl';
    lbl.textContent = getLayerLabel(el);
    row.appendChild(lbl);

    var eye = document.createElement('span');
    eye.className = 'de-layer-eye' + (isHidden ? ' eye-hidden' : '');
    eye.textContent = isHidden ? '○' : '●';
    row.appendChild(eye);

    wrapper.appendChild(row);
    var childWrap = document.createElement('div');
    childWrap.className = 'de-layer-children';
    childWrap.style.display = 'none';
    if (hasKids) Array.from(el.children).forEach(function(c) { childWrap.appendChild(buildLayerNode(c, depth+1)); });
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
      var ct = document.getElementById('deLayersTree');
      if (ct) ct.querySelectorAll('.de-layer-row.selected').forEach(function(r) { r.classList.remove('selected'); });
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
          ? '.' + cur.className.trim().split(/\s+/).filter(function(c){return !c.startsWith('de-');})[0] : ''));
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
    var tokenSignal  = root.getPropertyValue('--color-signal').trim();
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
      var r=parseInt(hex.substr(0,2),16)/255, g=parseInt(hex.substr(2,2),16)/255, b=parseInt(hex.substr(4,2),16)/255;
      function lin(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
      return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
    }
    function contrast(h1,h2) { var l1=lum(h1),l2=lum(h2); return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2); }
    var textCR='?', signalCR='?';
    try { textCR   = contrast(bgHex,(tokenText  ||'#f0ede8').replace(/['"]/g,'').trim()); } catch(e){}
    try { signalCR = contrast(bgHex, tokenSignal||'#c43e1c'); } catch(e){}

    var h1 = slide.querySelector('h1,h2,h3');
    var inlineStyle = slide.getAttribute('style') || '';
    var ibM = inlineStyle.match(/background:\s*([^;]+)/);
    var ib  = ibM ? ibM[1].trim() : '';

    diag.innerHTML =
      '<div class="de-section" style="margin-top:0;border-top:none;padding-top:0;">Slide</div>' +
      tokRow('slide', idx + ' / ' + slides.length) +
      tokRow('title', '<span style="color:#eee">' + title + '</span>') +
      '<div class="de-section">Background</div>' +
      '<div class="de-swatch-row"><div class="de-swatch" style="background:'+bgHex+'"></div>' +
      '<div class="de-swatch-info"><div class="de-swatch-name">'+bgMatch+'</div>' +
      '<div class="de-swatch-hex">'+bgHex+'</div></div></div>' +
      tokRow('inline bg', '<span style="color:'+(bgWarn?'#f97316':'#4ade80')+';max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+ib+'">'+  (ib||'(none)')+'</span>') +
      '<div class="de-section">Contrast</div>' +
      tokRow('text on bg', '<span style="color:'+(parseFloat(textCR)<4.5?'#f97316':'#4ade80')+'">'+textCR+':1 '+(parseFloat(textCR)<4.5?'⚠':'✓ AA')+'</span>') +
      tokRow('signal on bg','<span style="color:'+(parseFloat(signalCR)<3?'#f97316':'#4ade80')+'">'+signalCR+':1 '+(parseFloat(signalCR)<3?'⚠':'✓')+'</span>') +
      '<div class="de-section">Typography</div>' +
      tokRow('display', fontDisplay.split(',')[0]) +
      tokRow('body',    fontBody.split(',')[0]) +
      (h1 ? tokRow('h1/h2 size', getComputedStyle(h1).fontSize + ' / ' + getComputedStyle(h1).fontWeight) : '');
  }

  function tokRow(name, val) {
    return '<div class="de-token-row"><span class="de-token-name">' + name + '</span>' +
           '<span class="de-token-val">' + val + '</span></div>';
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
      indicator.textContent = '🎨 Design Mode — press D to exit';
      document.body.appendChild(indicator);

      setTimeout(function() { window._deShowTab('layers'); }, 50);
    } else {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onHover,     true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('slidechange', onSlideChange);
      document.removeEventListener('mousemove', onHandleDrag, true);
      document.removeEventListener('mouseup',   onHandleUp,   true);
      document.removeEventListener('mousemove', onMoveDrag, true);
      document.removeEventListener('mouseup',   onMoveUp,   true);
      document.removeEventListener('mousemove', onBoxDrag, true);
      document.removeEventListener('mouseup',   onBoxUp,   true);
      document.body.classList.remove('de-dragging');
      handleDrag = moveDrag = boxDrag = null;
      deselectElement();
      if (highlight) highlight.style.display = 'none';
      if (indicator) { indicator.remove(); indicator = null; }
    }
  }

  function onSlideChange() {
    deselectElement();
    refreshSlideDiag();
    buildLayerTree();
  }

  // ── Keybindings ───────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape' && active) deselectElement();
  });

  console.log('[DesignEditor] Ready — press D to toggle');
})();
