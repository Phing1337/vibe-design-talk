/**
 * index-grid.js — Holographic Card Grid with WebGL Foil Shader
 *
 * Each card shows a realistic miniature preview of its slide.
 * A shared WebGL canvas renders an iridescent thin-film shader
 * that moves to whichever card is hovered. 3D tilt + parallax.
 *
 * Depends on: PRES.slides, PRES.goToSlide
 */
(function() {
  'use strict';

  var slides = PRES.slides;
  var goToSlide = PRES.goToSlide;
  var TILT_MAX = 15;
  var PARALLAX_PX = 6;
  var REF_W = 1920;
  var REF_H = 1080;

  var beatLabels = {
    '1': 'The Big Picture',
    '2': 'The Dynamic Medium',
    '3': 'Design Principles',
    '4': 'Putting It to Practice',
    'showcase': 'See It in Action',
    '5': 'Wrapping Up'
  };

  // ═══════════════════════════════════════════════════
  //  WebGL Holographic Shader
  // ═══════════════════════════════════════════════════

  var VERT_SRC = [
    'attribute vec2 a_pos;',
    'varying vec2 v_uv;',
    'void main() {',
    '  v_uv = a_pos * 0.5 + 0.5;',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG_SRC = [
    'precision mediump float;',
    'varying vec2 v_uv;',
    'uniform vec2 u_mouse;',
    'uniform float u_time;',
    '',
    'vec3 hsv2rgb(vec3 c) {',
    '  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);',
    '  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);',
    '  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
    '}',
    '',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
    '}',
    '',
    'void main() {',
    '  vec2 uv = v_uv;',
    '  vec2 delta = uv - u_mouse;',
    '  float dist = length(delta);',
    '  float angle = atan(delta.y, delta.x);',
    '',
    '  // Thin-film iridescence',
    '  float hue = fract(angle / 6.2832 + dist * 2.0 + u_time * 0.05);',
    '  float sat = 0.55 + 0.25 * sin(dist * 12.0 + u_time * 0.3);',
    '  float val = 0.75 + 0.25 * sin(angle * 3.0 + dist * 8.0);',
    '  vec3 iri = hsv2rgb(vec3(hue, sat, val));',
    '',
    '  // Specular near mouse',
    '  float spec = exp(-dist * dist * 18.0) * 0.45;',
    '',
    '  // Sparkle grain',
    '  float grain = hash(uv * 220.0 + u_time * 0.5);',
    '  grain = smoothstep(0.93, 1.0, grain) * 0.35;',
    '',
    '  vec3 col = iri * 0.3 + spec + grain;',
    '',
    '  // Edge fade',
    '  float edge = smoothstep(0.0, 0.06, uv.x) * smoothstep(0.0, 0.06, uv.y)',
    '             * smoothstep(0.0, 0.06, 1.0 - uv.x) * smoothstep(0.0, 0.06, 1.0 - uv.y);',
    '',
    '  float alpha = (0.12 + spec * 1.3 + grain) * edge;',
    '  alpha = clamp(alpha, 0.0, 0.55);',
    '',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  var holoCanvas = null;
  var gl = null;
  var program = null;
  var uMouse = null;
  var uTime = null;
  var animFrame = null;
  var activeThumb = null;
  var mousePos = { x: 0.5, y: 0.5 };
  var startTime = Date.now();

  function initHoloShader() {
    holoCanvas = document.createElement('canvas');
    holoCanvas.className = 'index-holo-canvas';
    holoCanvas.width = 400;
    holoCanvas.height = 225;

    gl = holoCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return false;

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERT_SRC);
    gl.compileShader(vs);

    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FRAG_SRC);
    gl.compileShader(fs);

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    uMouse = gl.getUniformLocation(program, 'u_mouse');
    uTime = gl.getUniformLocation(program, 'u_time');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  function renderHolo() {
    if (!gl || !activeThumb) return;
    var t = (Date.now() - startTime) / 1000;
    gl.uniform2f(uMouse, mousePos.x, 1.0 - mousePos.y);
    gl.uniform1f(uTime, t);
    gl.viewport(0, 0, holoCanvas.width, holoCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animFrame = requestAnimationFrame(renderHolo);
  }

  function attachHolo(thumb) {
    if (activeThumb === thumb) return;
    activeThumb = thumb;
    var rect = thumb.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    holoCanvas.width = Math.round(rect.width * dpr);
    holoCanvas.height = Math.round(rect.height * dpr);
    thumb.appendChild(holoCanvas);
    if (!animFrame) animFrame = requestAnimationFrame(renderHolo);
  }

  function detachHolo() {
    if (holoCanvas && holoCanvas.parentNode) holoCanvas.parentNode.removeChild(holoCanvas);
    activeThumb = null;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  }

  var shaderReady = initHoloShader();

  // ── Clone a slide for preview, stripping runtime elements ──
  function cloneSlideForPreview(slide) {
    var clone = slide.cloneNode(true);

    // Remove IDs to avoid duplicates
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(function(el) { el.removeAttribute('id'); });

    // Remove scripts, videos, canvases, iframes
    clone.querySelectorAll('video, canvas, iframe, script, style').forEach(function(el) {
      el.parentNode.removeChild(el);
    });

    // Mark as preview slide (CSS forces visibility)
    clone.className = 'slide index-preview-slide';
    // Copy the original inline background style
    if (slide.style.cssText) {
      clone.style.cssText = slide.style.cssText;
    }
    // Force visible
    clone.style.opacity = '1';
    clone.style.transform = 'none';
    clone.style.position = 'absolute';

    return clone;
  }

  // ── Build index grid grouped by beat ──
  var grid = document.getElementById('indexGrid');
  if (!grid) return;

  var beatGroups = {};
  var beatOrder = [];
  var allThumbs = [];
  var cardsBySlideIndex = {}; // maps slide index → thumb element (for zoom-out)

  slides.forEach(function(slide, i) {
    if (i < 2) return;
    var beat = slide.getAttribute('data-beat') || '0';
    if (!beatGroups[beat]) {
      beatGroups[beat] = [];
      beatOrder.push(beat);
    }
    beatGroups[beat].push({ slide: slide, index: i });
  });

  var slideCounter = 0;
  beatOrder.forEach(function(beat) {
    var group = document.createElement('div');
    group.className = 'index-beat-group';

    var label = document.createElement('div');
    label.className = 'index-beat-label';
    label.textContent = beatLabels[beat] || ('Part ' + beat);
    group.appendChild(label);

    var cardsRow = document.createElement('div');
    cardsRow.className = 'index-beat-cards';

    beatGroups[beat].forEach(function(entry) {
      slideCounter++;
      var slide = entry.slide;
      var i = entry.index;
      var title = slide.getAttribute('data-title') || '';

      var thumb = document.createElement('div');
      thumb.className = 'index-thumb';
      thumb.setAttribute('data-slide-index', i);

      // Background from the slide
      var bgColor = slide.style.background || getComputedStyle(slide).backgroundColor || '#0a0a0a';
      var bgClean = bgColor.includes('!important') ? bgColor.replace('!important','').trim() : (bgColor || 'var(--color-bg)');
      thumb.style.background = bgClean;

      // ── Realistic preview: clone the slide DOM ──
      var preview = document.createElement('div');
      preview.className = 'index-thumb-preview';

      var previewInner = document.createElement('div');
      previewInner.className = 'index-thumb-preview-inner';

      var slideClone = cloneSlideForPreview(slide);
      previewInner.appendChild(slideClone);
      preview.appendChild(previewInner);
      thumb.appendChild(preview);

      allThumbs.push({ thumb: thumb, inner: previewInner });
      cardsBySlideIndex[i] = thumb;

      // Label
      var thumbLabel = document.createElement('div');
      thumbLabel.className = 'index-thumb-label';
      thumbLabel.innerHTML = '<span class="index-thumb-number">' + slideCounter + '</span>' + title;
      thumb.appendChild(thumbLabel);

      // ── 3D Tilt + Shader + Parallax ──
      thumb.addEventListener('mousemove', function(e) {
        var rect = thumb.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
        var pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));
        var fromCenter = Math.min(1, Math.sqrt(
          Math.pow((pctY - 50), 2) + Math.pow((pctX - 50), 2)
        ) / 50);

        var normX = (x - centerX) / centerX;
        var normY = (y - centerY) / centerY;
        var rotateY = normX * TILT_MAX;
        var rotateX = -normY * TILT_MAX;
        thumb.style.transform = 'rotateX(' + rotateX.toFixed(1) + 'deg) rotateY(' + rotateY.toFixed(1) + 'deg) scale(1.03)';

        thumb.style.setProperty('--pointer-x', pctX.toFixed(1) + '%');
        thumb.style.setProperty('--pointer-y', pctY.toFixed(1) + '%');
        thumb.style.setProperty('--pointer-from-center', fromCenter.toFixed(3));
        thumb.style.setProperty('--parallax-x', (-normX * PARALLAX_PX).toFixed(1) + 'px');
        thumb.style.setProperty('--parallax-y', (-normY * PARALLAX_PX).toFixed(1) + 'px');

        // Drive shader
        if (shaderReady) {
          mousePos.x = pctX / 100;
          mousePos.y = pctY / 100;
          attachHolo(thumb);
        }
      });

      thumb.addEventListener('mouseleave', function() {
        thumb.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        thumb.style.setProperty('--pointer-x', '50%');
        thumb.style.setProperty('--pointer-y', '50%');
        thumb.style.setProperty('--pointer-from-center', '0');
        thumb.style.setProperty('--parallax-x', '0px');
        thumb.style.setProperty('--parallax-y', '0px');
        detachHolo();
      });

      // ── Click — Zoom into slide ──
      thumb.addEventListener('click', function(e) {
        var rect = thumb.getBoundingClientRect();
        detachHolo();

        // Small ripple for tactile feedback
        var ripple = document.createElement('div');
        ripple.className = 'index-click-ripple';
        var rippleSize = Math.max(rect.width, rect.height);
        ripple.style.width = rippleSize + 'px';
        ripple.style.height = rippleSize + 'px';
        ripple.style.left = (e.clientX - rect.left - rippleSize / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - rippleSize / 2) + 'px';
        thumb.appendChild(ripple);
        setTimeout(function() {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 700);

        // Zoom into the slide from this card's position
        PRES.zoomToSlide(i, rect);
      });

      cardsRow.appendChild(thumb);
    });

    group.appendChild(cardsRow);
    grid.appendChild(group);
  });

  // ── Calculate preview scale once cards are in the DOM ──
  function updatePreviewScales() {
    allThumbs.forEach(function(entry) {
      var rect = entry.thumb.getBoundingClientRect();
      if (rect.width === 0) return;
      var scaleX = rect.width / REF_W;
      var scaleY = rect.height / REF_H;
      var scale = Math.min(scaleX, scaleY);
      entry.inner.style.transform = 'scale(' + scale + ')';
    });
  }

  // Run after layout settles
  requestAnimationFrame(function() {
    requestAnimationFrame(updatePreviewScales);
  });
  window.addEventListener('resize', updatePreviewScales);

  // Slide number click → zoom out to index
  var slideNumberEl = document.getElementById('slideNumber');
  if (slideNumberEl) {
    slideNumberEl.addEventListener('click', function() {
      var currentIdx = PRES.currentIndex;
      // If already on index or title, just go to index
      if (currentIdx <= 1) {
        PRES.goToSlide(1);
        return;
      }
      // Find the card for the current slide to zoom out to
      var card = cardsBySlideIndex[currentIdx];
      if (card && PRES.zoomToIndex) {
        // We need the card's rect, but index might not be visible.
        // Temporarily show index off-screen to measure, then zoom.
        var indexSlide = PRES.slides[1];
        var wasHidden = !indexSlide.classList.contains('active');
        if (wasHidden) {
          indexSlide.style.opacity = '0';
          indexSlide.style.pointerEvents = 'none';
          indexSlide.classList.add('active');
          indexSlide.offsetWidth; // reflow to measure
        }
        var rect = card.getBoundingClientRect();
        if (wasHidden) {
          indexSlide.classList.remove('active');
          indexSlide.style.opacity = '';
          indexSlide.style.pointerEvents = '';
        }
        PRES.zoomToIndex(rect);
      } else {
        PRES.goToSlide(1);
      }
    });
  }

  // Glossary download
  var dlBtn = document.getElementById('downloadGlossary');
  if (dlBtn) {
    dlBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var md = '# Design Vocabulary Glossary\n\n';
      md += '| Term | Definition |\n|---|---|\n';
      var terms = [
        ['Composition', 'The arrangement of visual elements to create a cohesive whole.'],
        ['White Space', 'Empty area that gives elements room to breathe. Not wasted — intentional.'],
        ['Hierarchy', 'Visual priority. What the eye sees first, second, third.'],
        ['Alignment', 'Elements sharing a common edge or centerline. Creates order.'],
        ['Proximity', 'Related elements placed near each other. Distance implies relationship.'],
        ['Contrast', 'Difference between elements. Size, color, weight — contrast creates focus.'],
        ['Balance', 'Visual weight distributed evenly or intentionally offset.'],
        ['Rhythm', 'Repeated patterns of spacing, size, or color. Creates flow.'],
        ['Typography', 'The art of arranging type. Font, size, weight, spacing, line height.'],
        ['Component', 'A reusable UI building block. Buttons, cards, inputs, modals.'],
        ['Token', 'A named design value (color, spacing, font size) for consistency.'],
        ['Progressive Disclosure', 'Showing only what is needed now. Reveal complexity as needed.'],
        ['Affordance', 'A visual cue that suggests how to interact.'],
        ['Delight', 'Small moments of joy. Animation, micro-interactions, polish.'],
        ['Easing', 'How animation accelerates/decelerates.'],
        ['Anticipation', 'A brief motion before the main action. Prepares the viewer.'],
        ['Visual Weight', 'How much attention an element demands.'],
        ['Grid', 'An invisible structure that aligns content. Columns, gutters, margins.'],
      ];
      terms.forEach(function(t) { md += '| **' + t[0] + '** | ' + t[1] + ' |\n'; });
      var blob = new Blob([md], { type: 'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'design-vocabulary-glossary.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();
