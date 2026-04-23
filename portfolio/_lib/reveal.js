// ============================================================
// reveal system — runs on load for every [data-reveal] element
// combo (default): scramble + stream typing
// raster: low-to-high resolution image build-up (figure with canvas)
// ============================================================
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];
  const srcText = (el) => el.dataset.text ?? el.textContent;

  // --- combo: scramble + stream --------------------------------
  const COMBO = { speed: 14, chunk: 3, window: 4 };

  function runCombo(el) {
    const final = srcText(el);
    if (reduceMotion) { el.textContent = final; return Promise.resolve(); }
    const len = final.length;

    el.innerHTML = '';
    const spans = [];
    for (let k = 0; k < len; k++) {
      const s = document.createElement('span');
      s.textContent = final[k];
      s.style.visibility = 'hidden';
      el.appendChild(s);
      spans.push(s);
    }

    let i = 0, lastTick = 0;
    return new Promise((resolve) => {
      function frame(now) {
        if (now - lastTick >= COMBO.speed) {
          lastTick = now;
          const r = Math.random();
          const chunk = Math.max(1, Math.floor(r * r * COMBO.chunk) + 1);
          i = Math.min(i + chunk, len);
        }
        const W = COMBO.window;
        for (let k = 0; k < len; k++) {
          const ch = final[k];
          if (k < i) {
            spans[k].textContent = ch;
            spans[k].style.visibility = 'visible';
            spans[k].className = '';
          } else if (k < i + W) {
            if (ch === ' ' || ch === '\n') {
              spans[k].textContent = ch;
              spans[k].style.visibility = 'visible';
              spans[k].className = '';
            } else {
              spans[k].textContent = rand();
              spans[k].style.visibility = 'visible';
              spans[k].className = (k - i) < 2 ? 'scrambling hot' : 'scrambling';
            }
          } else {
            spans[k].textContent = ch;
            spans[k].style.visibility = 'hidden';
            spans[k].className = '';
          }
        }
        if (i >= len) {
          el.textContent = final;
          resolve();
          return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // --- raster ----------------------------------------------------
  const RASTER = { start: 4, steps: 7, stepMs: 110 };
  const _imgCache = new Map();
  function loadImage(src) {
    if (_imgCache.has(src)) return _imgCache.get(src);
    const p = new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
    _imgCache.set(src, p);
    return p;
  }

  async function runRaster(figure) {
    const src = figure.dataset.src;
    const canvas = figure.querySelector('canvas');
    if (!canvas || !src) return;
    let img;
    try { img = await loadImage(src); } catch { return; }

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
    const aspect = img.naturalHeight / img.naturalWidth;
    const cssH = Math.round(cssW * aspect);
    canvas.style.height = cssH + 'px';
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = canvas.getContext('2d');

    if (reduceMotion) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return;
    }

    const target = img.naturalWidth;
    const ladder = [];
    let r = Math.max(2, RASTER.start);
    const ratio = Math.pow(target / RASTER.start, 1 / Math.max(1, RASTER.steps - 1));
    while (r < target && ladder.length < RASTER.steps - 1) {
      ladder.push(Math.round(r));
      r = r * ratio;
    }
    ladder.push(target);

    const tiny = document.createElement('canvas');
    const tctx = tiny.getContext('2d');

    for (let s = 0; s < ladder.length; s++) {
      const w = ladder[s];
      const h = Math.max(1, Math.round(w * aspect));
      tiny.width = w; tiny.height = h;
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(img, 0, 0, w, h);

      const isFinal = s === ladder.length - 1;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tiny, 0, 0, canvas.width, canvas.height);
      if (!isFinal) await new Promise(res => setTimeout(res, RASTER.stepMs));
    }
  }

  // --- pre-hide everything immediately to prevent flash ---------
  function preHide() {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const fx = el.dataset.fx || 'combo';
      if (fx === 'combo') {
        if (!el.dataset.text) el.dataset.text = el.textContent;
        el.innerHTML = '';
        const ghost = document.createElement('span');
        ghost.textContent = el.dataset.text;
        ghost.style.visibility = 'hidden';
        el.appendChild(ghost);
      }
    });
  }

  // --- play everything in document order with a small stagger ---
  const STAGGER_STEP = 35;
  const STAGGER_MAX = 600;

  function play(el) {
    const fx = el.dataset.fx || 'combo';
    if (fx === 'raster') runRaster(el);
    else runCombo(el);
  }

  function inViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  async function playAll() {
    const els = [...document.querySelectorAll('[data-reveal]')];
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }

    // partition: in-viewport now (play with stagger) vs below the fold (lazy on scroll)
    const eager = [];
    const lazy = [];
    els.forEach(el => (inViewport(el) ? eager : lazy).push(el));

    eager.forEach((el, idx) => {
      const stagger = Math.min(idx * STAGGER_STEP, STAGGER_MAX);
      setTimeout(() => play(el), stagger);
    });

    if (lazy.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target;
            io.unobserve(el);
            setTimeout(() => play(el), Math.min(i * STAGGER_STEP, STAGGER_MAX));
          }
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      lazy.forEach(el => io.observe(el));
    } else {
      // no IO: fall back to playing everything
      lazy.forEach((el, idx) => setTimeout(() => play(el), Math.min(idx * STAGGER_STEP, STAGGER_MAX)));
    }
  }

  // pre-hide as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { preHide(); playAll(); });
  } else {
    preHide();
    playAll();
  }
})();
