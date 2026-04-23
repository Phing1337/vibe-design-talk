/* ============================================================
   color-lab.js — Interactive Color Lab  v3
   Curated palettes + rich preview card
   ============================================================ */

(function () {
  'use strict';

  /* ── Curated Palettes ─────────────────────────────────── */
  var PALETTES = [
    {
      name: 'Midnight',
      desc: 'Electric violet on deep navy. Bold tech energy.',
      bg: '#0b0d17', surface: '#13152a', border: 'rgba(114,90,255,0.2)',
      primary: '#7259ff', secondary: '#2a2560', accent: '#b8a9ff',
      muted: 'rgba(212,208,255,0.42)', text: '#ddd8ff', dark: true,
      swatches: ['#0b0d17','#13152a','#7259ff','#b8a9ff','#ddd8ff']
    },
    {
      name: 'Glacier',
      desc: 'Electric blue on pristine white. Precise and trustworthy.',
      bg: '#f8faff', surface: '#ffffff', border: 'rgba(37,99,235,0.12)',
      primary: '#2563eb', secondary: '#dbeafe', accent: '#1d4ed8',
      muted: 'rgba(15,23,42,0.42)', text: '#0f172a', dark: false,
      swatches: ['#f8faff','#dbeafe','#2563eb','#1d4ed8','#0f172a']
    },
    {
      name: 'Ivory',
      desc: 'Ink on cream. Warm editorial authority — timeless.',
      bg: '#faf7f2', surface: '#f2ede3', border: 'rgba(42,26,14,0.1)',
      primary: '#1a1008', secondary: '#e0d8c8', accent: '#8b5e3c',
      muted: 'rgba(42,26,14,0.38)', text: '#1a1008', dark: false,
      swatches: ['#faf7f2','#f2ede3','#e0d8c8','#8b5e3c','#1a1008']
    },
    {
      name: 'Sunglow',
      desc: 'Terracotta fire on dark amber dusk. Desert warmth.',
      bg: '#1a0e05', surface: '#2a1808', border: 'rgba(225,115,50,0.22)',
      primary: '#e17432', secondary: '#6d3010', accent: '#f4b96a',
      muted: 'rgba(249,228,192,0.38)', text: '#f9e8cc', dark: true,
      swatches: ['#1a0e05','#2a1808','#e17432','#f4b96a','#f9e8cc']
    },
    {
      name: 'Matcha',
      desc: 'Forest depth with botanical clarity. Grounded and fresh.',
      bg: '#f2f5ef', surface: '#e8ede2', border: 'rgba(35,80,55,0.12)',
      primary: '#2e6b4a', secondary: '#c5d9c0', accent: '#4fa876',
      muted: 'rgba(20,40,28,0.38)', text: '#1a2e22', dark: false,
      swatches: ['#f2f5ef','#c5d9c0','#4fa876','#2e6b4a','#1a2e22']
    },
    {
      name: 'Carbon',
      desc: 'Signal yellow on matte charcoal. Industrial edge.',
      bg: '#141414', surface: '#1e1e1e', border: 'rgba(250,200,20,0.18)',
      primary: '#f5c800', secondary: '#3d3200', accent: '#ffe566',
      muted: 'rgba(250,250,249,0.38)', text: '#f5f5f4', dark: true,
      swatches: ['#141414','#1e1e1e','#f5c800','#ffe566','#f5f5f4']
    },
    {
      name: 'Sakura',
      desc: 'Blush pink on warm white. Refined, not sweet.',
      bg: '#fff5f8', surface: '#ffffff', border: 'rgba(220,60,100,0.1)',
      primary: '#dc3c64', secondary: '#fce4ec', accent: '#f472a0',
      muted: 'rgba(26,10,18,0.38)', text: '#1a0a12', dark: false,
      swatches: ['#fff5f8','#fce4ec','#f472a0','#dc3c64','#1a0a12']
    },
    {
      name: 'Plum',
      desc: 'Molten gold glows against deep violet. Opulent.',
      bg: '#160a22', surface: '#221038', border: 'rgba(200,160,255,0.15)',
      primary: '#c89eff', secondary: '#6d2fa8', accent: '#f5d06a',
      muted: 'rgba(240,220,255,0.38)', text: '#f0dcff', dark: true,
      swatches: ['#160a22','#221038','#6d2fa8','#c89eff','#f5d06a']
    },
    {
      name: 'Tide',
      desc: 'Teal precision meets open-sky clarity. Clean SaaS.',
      bg: '#f0faf9', surface: '#ffffff', border: 'rgba(13,148,136,0.12)',
      primary: '#0d9488', secondary: '#ccf5f2', accent: '#0f766e',
      muted: 'rgba(15,31,30,0.38)', text: '#0f1f1e', dark: false,
      swatches: ['#f0faf9','#ccf5f2','#5eead4','#0d9488','#0f1f1e']
    },
    {
      name: 'Slate',
      desc: 'Cool grays with a focused blue thread. Quiet authority.',
      bg: '#1a1d21', surface: '#252a30', border: 'rgba(100,160,255,0.18)',
      primary: '#4f9cf9', secondary: '#1e2c44', accent: '#93c5fd',
      muted: 'rgba(220,226,235,0.38)', text: '#dce2eb', dark: true,
      swatches: ['#1a1d21','#252a30','#4f9cf9','#93c5fd','#dce2eb']
    },
    {
      name: 'Ember',
      desc: 'Deep scarlet on near-black. Controlled, assertive.',
      bg: '#0f0c0c', surface: '#1a1212', border: 'rgba(220,60,50,0.2)',
      primary: '#dc3c32', secondary: '#5a1410', accent: '#ff7d6e',
      muted: 'rgba(248,238,236,0.38)', text: '#f8eeec', dark: true,
      swatches: ['#0f0c0c','#1a1212','#dc3c32','#ff7d6e','#f8eeec']
    },
    {
      name: 'Chalk',
      desc: 'Nothing competes with the idea. Pure signal.',
      bg: '#ffffff', surface: '#f9fafb', border: 'rgba(0,0,0,0.08)',
      primary: '#111111', secondary: '#f3f4f6', accent: '#6b7280',
      muted: 'rgba(0,0,0,0.38)', text: '#111111', dark: false,
      swatches: ['#ffffff','#f3f4f6','#d1d5db','#6b7280','#111111']
    }
  ];

  var state = { paletteIdx: 0 };

  /* ── Color Utilities ─────────────────────────────────────── */
  function luminance(hex) {
    var r=parseInt(hex.slice(1,3),16)/255;
    var g=parseInt(hex.slice(3,5),16)/255;
    var b=parseInt(hex.slice(5,7),16)/255;
    function lin(c){ return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
  }

  function onColor(hex) {
    return luminance(hex) > 0.35 ? '#111111' : '#ffffff';
  }

  /* ── Render: Rich Preview Card ───────────────────────────── */
  function renderPreview(p) {
    var el=document.getElementById('cl-preview');
    if (!el) return;
    var textOn=onColor(p.primary);
    var mutedOn=onColor(p.surface);

    el.innerHTML =
      '<div class="cl-preview-card" style="background:'+p.bg+';border:1px solid '+p.border+';color:'+p.text+'">' +

        // Nav bar
        '<div class="cl-pv-nav" style="background:'+p.surface+';border-bottom:1px solid '+p.border+'">' +
          '<span class="cl-pv-logo" style="color:'+p.text+'">● Studio</span>' +
          '<span class="cl-pv-links">' +
            '<span style="color:'+p.muted+'">Dashboard</span>' +
            '<span style="color:'+p.muted+'">Projects</span>' +
            '<span style="color:'+p.muted+'">Assets</span>' +
            '<span style="color:'+p.muted+'">Settings</span>' +
          '</span>' +
          '<button class="cl-pv-cta" style="background:'+p.primary+';color:'+textOn+'">New project</button>' +
        '</div>' +

        // Body: hero + aside
        '<div class="cl-pv-body">' +

          // Left: content area
          '<div class="cl-pv-hero">' +
            '<span class="cl-pv-badge" style="background:'+p.secondary+';color:'+p.accent+'">Active</span>' +
            '<h3 class="cl-pv-heading" style="color:'+p.text+'">Design that speaks<br>before a word is read.</h3>' +
            '<p class="cl-pv-sub" style="color:'+p.muted+'">Color is the first thing users perceive. A derived palette builds trust and hierarchy automatically.</p>' +

            '<div class="cl-pv-chips">' +
              '<span style="background:'+p.secondary+';color:'+p.accent+'">Color</span>' +
              '<span style="background:'+p.secondary+';color:'+p.accent+'">Type</span>' +
              '<span style="background:'+p.secondary+';color:'+p.accent+'">Layout</span>' +
              '<span style="background:'+p.secondary+';color:'+p.accent+'">Hierarchy</span>' +
            '</div>' +

            '<div class="cl-pv-stats">' +
              '<div><strong style="color:'+p.text+'">5</strong><span style="color:'+p.muted+'">&nbsp;tokens</span></div>' +
              '<div class="cl-pv-stat-div" style="background:'+p.border+'"></div>' +
              '<div><strong style="color:'+p.text+'">'+p.name+'</strong><span style="color:'+p.muted+'">&nbsp;palette</span></div>' +
            '</div>' +

            '<div class="cl-pv-actions">' +
              '<button class="cl-pv-btn-primary" style="background:'+p.primary+';color:'+textOn+'">Apply palette</button>' +
              '<button class="cl-pv-btn-ghost" style="border-color:'+p.border+';color:'+p.text+'">Export</button>' +
            '</div>' +
          '</div>' +

          // Right: side card
          '<div class="cl-pv-aside" style="background:'+p.surface+';border:1px solid '+p.border+'">' +
            '<div class="cl-pv-card-label" style="color:'+p.muted+'">Palette</div>' +
            '<div class="cl-pv-card-name" style="color:'+p.text+'">'+p.name+'</div>' +
            '<div style="display:flex;flex-direction:column;gap:3px;margin:6px 0;flex:1;">' +
              p.swatches.map(function(c){
                return '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<div style="width:16px;height:16px;border-radius:4px;background:'+c+';border:1px solid '+p.border+';flex-shrink:0;"></div>' +
                  '<span style="font-size:0.5rem;font-family:var(--font-mono);color:'+p.muted+'">'+c.toUpperCase()+'</span>' +
                '</div>';
              }).join('') +
            '</div>' +
            '<button class="cl-pv-card-btn" style="background:'+p.primary+';color:'+textOn+'">Copy tokens</button>' +
          '</div>' +

        '</div>' +

        '<div class="cl-pv-strip">' +
          p.swatches.map(function(c){ return '<div style="flex:1;background:'+c+'"></div>'; }).join('') +
        '</div>' +

      '</div>';
  }

  /* ── Render: Palette Grid ────────────────────────────────── */
  function renderPaletteGrid() {
    var el=document.getElementById('cl-palette-grid');
    if (!el) return;
    el.innerHTML='';
    PALETTES.forEach(function(p, i) {
      var card=document.createElement('button');
      card.className='cl-pal-card'+(i===state.paletteIdx?' active':'');
      card.title=p.name+' — '+p.desc;

      var strip='<div class="cl-pal-strip">';
      p.swatches.forEach(function(c){ strip+='<div style="flex:1;background:'+c+'"></div>'; });
      strip+='</div>';
      card.innerHTML=strip+'<div class="cl-pal-name">'+p.name+'</div>';

      card.addEventListener('click', function() {
        state.paletteIdx=i;
        document.querySelectorAll('.cl-pal-card').forEach(function(c2,j){
          c2.classList.toggle('active', j===i);
        });
        updateAll();
      });
      el.appendChild(card);
    });
  }

  /* ── Update ──────────────────────────────────────────────── */
  function updateAll() {
    var p=PALETTES[state.paletteIdx];
    renderPreview(p);
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    if (!document.querySelector('.slide-colorlab')) return;
    renderPaletteGrid();
    updateAll();
  }

  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
