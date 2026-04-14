/* ============================================================
   garden.js  Work Digital Garden Showcase Slide
   Card interaction: FLIP on actual card element.
   Card is reparented to document.body before going position:fixed
   so that position:fixed is viewport-relative (not relative to
   the CSS-transformed #slidesContainer from scaler.js).
   ============================================================ */

(function () {
  'use strict';

  /* Must match nth-child rotate values in garden.css */
  var ROTATIONS = [-2.6, 1.7, -1.1, 3.2, -0.7, 2.3];
  var EXP_W = 520;
  var EXP_H = 560;

  var CARD_DATA = [
    {
      title:   'Xbox Mode Transitions',
      desc:    'Full interaction prototype for the Windows to Xbox mode switching experience on Helix. Boot sequence, overlay navigation, and session handoff between PC and Xbox mode.',
      stripeColor: '#c8613f',
      date:    '2025',
      collabs: 'Helix team',
      links: [
        { label: 'View Prototype', href: '#' },
        { label: 'Read Spec',      href: '#' }
      ]
    },
    {
      title:   'XDS Token Extraction',
      desc:    '847 semantic design tokens extracted from the Xbox Design System. Colors, spacing, typography, density, component-level tokens, structured for AI tooling.',
      stripeColor: '#e8a020',
      date:    '2025',
      collabs: 'Solo',
      links: [
        { label: 'Browse Tokens', href: '#' },
        { label: 'Download JSON', href: '#' }
      ]
    },
    {
      title:   'QS Overlay Redesign',
      desc:    'From-scratch redesign of the Xbox Quick Settings overlay. Unified underlay and panel system, optimized for 10-foot UI and keyboard-first gaming PCs.',
      stripeColor: '#7a9e6b',
      date:    '2025',
      collabs: 'Shell team',
      links: [
        { label: 'View Screens',  href: '#' },
        { label: 'See Prototype', href: '#' }
      ]
    },
    {
      title:   'Digital Garden Concept',
      desc:    "What if every PM and designer had a browsable, living work identity? A proof-of-concept for replacing static portfolios with navigable personal pages. You're looking at it.",
      stripeColor: '#5b8ac7',
      date:    '2025',
      collabs: 'Personal',
      links: [
        { label: 'Read the Brief', href: '#' }
      ]
    },
    {
      title:   'Dashboard Nav Research',
      desc:    'Navigation patterns and mental models for the Xbox dashboard. 10-foot UI, content density, gamepad affordances, and friction points in current navigation.',
      stripeColor: '#c8613f',
      date:    '2024',
      collabs: 'Research',
      links: [
        { label: 'View Research', href: '#' }
      ]
    },
    {
      title:   'Notification Design System',
      desc:    'A systematic approach to in-game and OS-level notifications on Xbox. Hierarchy, timing, surface rules, and the interplay between game and shell layers.',
      stripeColor: '#9b7bc7',
      date:    '2023',
      collabs: 'Shell team',
      links: [
        { label: 'View System', href: '#' }
      ]
    }
  ];

  function qs(el, sel) { return el.querySelector(sel); }

  function initGarden() {
    var section = document.querySelector('.slide-garden');
    if (!section) return;

    var cards = section.querySelectorAll('.gd-deck-scroll .gd-card');
    if (!cards.length) return;

    /*
     * Body-level backdrop — lives outside #slidesContainer so that
     * it truly covers the full viewport (not clipped by the scale transform).
     */
    var backdrop = document.createElement('div');
    backdrop.style.cssText =
      'position:fixed;inset:0;z-index:9000;' +
      'background:rgba(8,7,5,0.72);backdrop-filter:blur(2px);' +
      'opacity:0;pointer-events:none;' +
      'transition:opacity 0.30s ease;cursor:pointer;';
    document.body.appendChild(backdrop);

    var activeCard   = null;
    var activeIdx    = -1;
    var activeSpacer = null;

    /* Fill expanded content from CARD_DATA */
    function populate(card, idx) {
      var d         = CARD_DATA[idx];
      var heroBgEl  = qs(card, '.gd-exp-hero-bg');
      var kickerEl  = qs(card, '.gd-exp-kicker');
      var titleEl   = qs(card, '.gd-exp-title');
      var descEl    = qs(card, '.gd-exp-desc');
      var dateEl    = qs(card, '.gd-exp-date');
      var collabsEl = qs(card, '.gd-exp-collabs');
      var linksEl   = qs(card, '.gd-exp-links');
      var stripeEl  = qs(card, '.gd-card-stripe');

      if (heroBgEl)  heroBgEl.style.background = d.stripeColor;
      if (kickerEl)  kickerEl.textContent = d.date + (d.collabs ? '  \u00b7  ' + d.collabs : '');
      if (titleEl)   titleEl.textContent  = d.title;
      if (descEl)    descEl.textContent   = d.desc;
      if (dateEl)    dateEl.textContent   = d.date;
      if (collabsEl) collabsEl.textContent = d.collabs;
      /* Set stripe explicitly — nth-child won't apply when card is at body level */
      if (stripeEl)  stripeEl.style.background = d.stripeColor;
      if (linksEl) {
        linksEl.innerHTML = '';
        d.links.forEach(function (lk) {
          var a = document.createElement('a');
          a.className   = 'gd-exp-link';
          a.href        = lk.href;
          a.textContent = lk.label;
          linksEl.appendChild(a);
        });
      }
    }

    /* FLIP: reparent card to body, animate from deck position to center */
    function openCard(idx) {
      if (activeIdx === idx) return;
      if (activeIdx >= 0) forceClose();

      var card     = cards[idx];
      var rotation = ROTATIONS[idx];

      /* Measure card's viewport position BEFORE moving it */
      var rect = card.getBoundingClientRect();
      var vpW  = window.innerWidth;
      var vpH  = window.innerHeight;

      /*
       * Insert spacer in card's exact DOM slot to preserve flex layout.
       * insertBefore(spacer, card) puts spacer where card currently is.
       */
      var spacer = document.createElement('div');
      spacer.style.cssText =
        'width:' + rect.width + 'px;height:' + rect.height + 'px;' +
        'flex-shrink:0;pointer-events:none;';
      card.parentNode.insertBefore(spacer, card);
      activeSpacer = spacer;

      /*
       * Move card to document.body — now outside #slidesContainer's
       * CSS transform, so position:fixed is relative to the real viewport.
       */
      document.body.appendChild(card);

      populate(card, idx);
      card.classList.add('is-expanded');

      /* FLIP math: offset from viewport center to card's original center */
      var fromX = (rect.left + rect.width  / 2) - vpW / 2;
      var fromY = (rect.top  + rect.height / 2) - vpH / 2;
      var scX   = rect.width  / EXP_W;
      var scY   = rect.height / EXP_H;

      /* Place card at expanded size, FLIP-translated to its original viewport position */
      card.style.cssText =
        'position:fixed;left:50%;top:50%;' +
        'width:' + EXP_W + 'px;height:' + EXP_H + 'px;' +
        'z-index:9001;transition:none;overflow:hidden;border-radius:5px;' +
        'transform:translate(calc(-50% + ' + fromX + 'px),calc(-50% + ' + fromY + 'px))' +
        ' scale(' + scX + ',' + scY + ')' +
        ' rotate(' + rotation + 'deg);';

      /* Show backdrop */
      backdrop.style.pointerEvents = 'auto';
      backdrop.style.opacity       = '1';

      activeCard = card;
      activeIdx  = idx;

      /* Two rAFs: add transition, then animate to center */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          card.style.transition =
            'transform 0.42s cubic-bezier(0.22,0,0,1),' +
            'box-shadow 0.35s ease,' +
            'border-radius 0.28s ease';
          card.style.transform    = 'translate(-50%,-50%) rotate(0deg)';
          card.style.borderRadius = '8px';
        });
      });
    }

    /* Start close: fade exp content, then FLIP card back to deck */
    function closeCard() {
      if (activeIdx < 0) return;

      var card     = activeCard;
      var spacer   = activeSpacer;
      var rotation = ROTATIONS[activeIdx];

      /* Trigger closing transitions: exp fades, compact content returns */
      card.classList.add('is-closing');

      backdrop.style.opacity       = '0';
      backdrop.style.pointerEvents = 'none';

      activeCard   = null;
      activeIdx    = -1;
      activeSpacer = null;

      var savedCard   = card;
      var savedSpacer = spacer;

      /* Short delay lets is-closing CSS transitions begin before FLIP */
      setTimeout(function () {
        var sr  = savedSpacer.getBoundingClientRect();
        var vpW = window.innerWidth;
        var vpH = window.innerHeight;
        var toX = (sr.left + sr.width  / 2) - vpW / 2;
        var toY = (sr.top  + sr.height / 2) - vpH / 2;
        var scX = sr.width  / EXP_W;
        var scY = sr.height / EXP_H;

        savedCard.style.transition =
          'transform 0.36s cubic-bezier(0.22,0,0,1),' +
          'border-radius 0.28s ease';
        savedCard.style.transform =
          'translate(calc(-50% + ' + toX + 'px),calc(-50% + ' + toY + 'px))' +
          ' scale(' + scX + ',' + scY + ') rotate(' + rotation + 'deg)';
        savedCard.style.borderRadius = '5px';
      }, 60);

      /* After FLIP completes: restore card to deck */
      setTimeout(function () {
        savedCard.removeAttribute('style');
        savedCard.classList.remove('is-expanded');
        savedCard.classList.remove('is-closing');
        var stripeEl = qs(savedCard, '.gd-card-stripe');
        if (stripeEl) stripeEl.style.background = '';
        savedSpacer.parentNode.insertBefore(savedCard, savedSpacer);
        savedSpacer.parentNode.removeChild(savedSpacer);
      }, 60 + 390);
    }

    /* Instant close — used when switching directly between cards */
    function forceClose() {
      if (activeIdx < 0) return;
      var card   = activeCard;
      var spacer = activeSpacer;
      card.removeAttribute('style');
      card.classList.remove('is-expanded');
      card.classList.remove('is-closing');
      var stripeEl = qs(card, '.gd-card-stripe');
      if (stripeEl) stripeEl.style.background = '';
      spacer.parentNode.insertBefore(card, spacer);
      spacer.parentNode.removeChild(spacer);
      backdrop.style.opacity       = '0';
      backdrop.style.pointerEvents = 'none';
      activeCard   = null;
      activeIdx    = -1;
      activeSpacer = null;
    }

    cards.forEach(function (card, idx) {
      card.addEventListener('click', function () {
        if (!card.classList.contains('is-expanded')) openCard(idx);
      });
    });

    section.querySelectorAll('.gd-exp-close').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeCard();
      });
    });

    backdrop.addEventListener('click', closeCard);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeIdx >= 0) closeCard();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGarden);
  } else {
    initGarden();
  }

})();