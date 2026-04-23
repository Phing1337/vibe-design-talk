// ============================================================
// display menu — color theme, text size, density
// theme uses circular wipe (View Transitions API + clip-path fallback)
// ============================================================
(function () {
  const THEMES = ['amber-dark', 'cool-dark', 'paper-light', 'terminal-green'];
  const THEME_BG = {
    'amber-dark':     '#0f0e0c',
    'cool-dark':      '#0a0e14',
    'paper-light':    '#f1ece0',
    'terminal-green': '#050905'
  };
  const THEME_ACCENT = {
    'amber-dark':     '#d98a3d',
    'cool-dark':      '#6db4ff',
    'paper-light':    '#b86621',
    'terminal-green': '#4cff8a'
  };
  const SIZES = ['compact', 'normal', 'airy'];
  // each size pairs a text scale + a density
  const SIZE_TO_TEXT    = { compact: 'sm', normal: 'md', airy: 'lg' };
  const SIZE_TO_DENSITY = { compact: 'compact', normal: 'normal', airy: 'airy' };

  const KEY_THEME = 'nick.theme';
  const KEY_SIZE  = 'nick.size';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // normalize defaults
  if (!THEMES.includes(root.dataset.theme)) root.dataset.theme = 'paper-light';
  if (!SIZES.includes(root.dataset.size))   root.dataset.size  = 'airy';
  // mirror size -> text + density data attributes (consumed by CSS)
  root.dataset.text    = SIZE_TO_TEXT[root.dataset.size];
  root.dataset.density = SIZE_TO_DENSITY[root.dataset.size];

  // ---------- color theme with wipe ----------
  function originPoint(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function maxRadius(x, y) {
    return Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
  }
  function setTheme(name, originEl, btn) {
    if (!THEMES.includes(name) || root.dataset.theme === name) return;

    const { x, y } = originPoint(originEl);
    const r = maxRadius(x, y);
    root.style.setProperty('--vt-x', x + 'px');
    root.style.setProperty('--vt-y', y + 'px');
    root.style.setProperty('--vt-r', r + 'px');
    root.style.setProperty('--vt-accent', THEME_ACCENT[name]);

    if (btn) {
      btn.classList.add('firing');
      setTimeout(() => btn.classList.remove('firing'), 400);
    }

    const apply = () => {
      root.dataset.theme = name;
      try { localStorage.setItem(KEY_THEME, name); } catch (e) {}
      updateActive();
    };

    if (reduceMotion) { apply(); return; }

    if (document.startViewTransition) {
      document.startViewTransition(apply);
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'theme-wipe';
    overlay.style.background = THEME_BG[name];
    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.transition = 'clip-path 950ms cubic-bezier(.16, 1, .3, 1)';
      overlay.style.clipPath = `circle(${r}px at ${x}px ${y}px)`;
    });
    setTimeout(() => {
      apply();
      overlay.style.transition = 'opacity 280ms ease-out';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }, 960);
  }

  // ---------- size (text + density combined) ----------
  function setSize(value) {
    if (!SIZES.includes(value)) return;
    root.dataset.size    = value;
    root.dataset.text    = SIZE_TO_TEXT[value];
    root.dataset.density = SIZE_TO_DENSITY[value];
    try { localStorage.setItem(KEY_SIZE, value); } catch (e) {}
    updateActive();
  }

  // ---------- active state reflection ----------
  function updateActive() {
    document.querySelectorAll('.theme-opt').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === root.dataset.theme);
    });
    document.querySelectorAll('.seg.size button').forEach(b => {
      b.classList.toggle('active', b.dataset.value === root.dataset.size);
    });
  }

  // ---------- flyout open/close ----------
  function initFlyout() {
    const menu = document.querySelector('.display-menu');
    if (!menu) return;
    const trigger = menu.querySelector('.display-trigger');
    if (!trigger) return;

    function close() {
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggle(e) {
      e.stopPropagation();
      const wasOpen = menu.classList.contains('open');
      if (wasOpen) close();
      else {
        menu.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }
    trigger.addEventListener('click', toggle);
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    // clicks inside the flyout (other than buttons) shouldn't bubble-close
    menu.querySelector('.display-flyout')?.addEventListener('click', (e) => e.stopPropagation());
  }

  function init() {
    initFlyout();
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const swatch = btn.querySelector('.swatch') || btn;
        setTheme(btn.dataset.theme, swatch, btn);
      });
    });
    document.querySelectorAll('.seg.size button').forEach(btn => {
      btn.addEventListener('click', () => setSize(btn.dataset.value));
    });
    updateActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
