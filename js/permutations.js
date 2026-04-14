(function () {
  'use strict';

  var WIDE_COLORS = [
    { h: 8,   s: 70, l: 46 },
    { h: 22,  s: 76, l: 48 },
    { h: 38,  s: 80, l: 50 },
    { h: 60,  s: 68, l: 44 },
    { h: 92,  s: 56, l: 40 },
    { h: 148, s: 54, l: 38 },
    { h: 188, s: 62, l: 38 },
    { h: 210, s: 70, l: 44 },
    { h: 232, s: 65, l: 48 },
    { h: 254, s: 60, l: 46 },
    { h: 276, s: 60, l: 44 },
    { h: 308, s: 60, l: 42 },
    { h: 338, s: 68, l: 46 },
    { h: 24,  s: 26, l: 50 },
    { h: 202, s: 22, l: 48 },
  ];

  function hsl(h, s, l) {
    var hh = ((h % 360) + 360) % 360;
    return 'hsl(' + hh + ',' + s + '%,' + l + '%)';
  }

  function deepColors(baseH) {
    return [
      { h: baseH - 22, s: 72, l: 30 },
      { h: baseH - 12, s: 82, l: 36 },
      { h: baseH - 4,  s: 88, l: 42 },
      { h: baseH,      s: 80, l: 48 },
      { h: baseH + 8,  s: 72, l: 55 },
      { h: baseH - 18, s: 64, l: 26 },
      { h: baseH + 16, s: 84, l: 60 },
      { h: baseH - 8,  s: 58, l: 66 },
      { h: baseH + 24, s: 46, l: 36 },
      { h: baseH,      s: 92, l: 38 },
    ];
  }

  function makeCard(color) {
    var rot = (Math.random() * 5.4 - 2.7).toFixed(1);
    var el = document.createElement('div');
    el.className = 'perm-card';
    el.style.cssText = '--rot:' + rot + 'deg;background:' + hsl(color.h, color.s, color.l) + ';';
    el.dataset.h = color.h;
    return el;
  }

  function cascadeIn(cards, startDelay) {
    cards.forEach(function (card, i) {
      setTimeout(function () {
        card.classList.add('perm-card--in');
      }, startDelay + i * 52);
    });
  }

  function initPermutations() {
    var stage = document.getElementById('permStage');
    if (!stage) return;

    var isExpanded = false;
    var wideCards = [];

    // ── Wide section ──
    var wideSection = document.createElement('div');
    wideSection.className = 'perm-wide-section';

    var wideLabel = document.createElement('div');
    wideLabel.className = 'perm-phase-label';
    wideLabel.textContent = 'Generation 1 — wide';
    wideSection.appendChild(wideLabel);

    var wideRows = [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ];
    wideRows.forEach(function (r) { r.className = 'perm-row'; });

    WIDE_COLORS.forEach(function (color, i) {
      var card = makeCard(color);
      wideCards.push(card);
      wideRows[Math.floor(i / 5)].appendChild(card);
    });
    wideRows.forEach(function (r) { wideSection.appendChild(r); });

    var hint = document.createElement('div');
    hint.className = 'perm-hint';
    hint.textContent = 'click any card to go deep \u2192';
    wideSection.appendChild(hint);

    // ── Connector (hidden until click) ──
    var connector = document.createElement('div');
    connector.className = 'perm-connector';
    var connLine1 = document.createElement('div');
    connLine1.className = 'perm-connector-line';
    var connLabel = document.createElement('div');
    connLabel.className = 'perm-connector-label';
    connLabel.textContent = 'going deeper';
    var connLine2 = document.createElement('div');
    connLine2.className = 'perm-connector-line';
    connector.appendChild(connLine1);
    connector.appendChild(connLabel);
    connector.appendChild(connLine2);

    // ── Deep section ──
    var deepSection = document.createElement('div');
    deepSection.className = 'perm-deep-section';

    var deepLabel = document.createElement('div');
    deepLabel.className = 'perm-phase-label';
    deepSection.appendChild(deepLabel);

    var deepRow1 = document.createElement('div');
    deepRow1.className = 'perm-row';
    var deepRow2 = document.createElement('div');
    deepRow2.className = 'perm-row';

    // ── Reset button ──
    var resetBtn = document.createElement('button');
    resetBtn.className = 'perm-reset';
    resetBtn.textContent = '\u2190 reset';

    stage.appendChild(wideSection);
    stage.appendChild(connector);
    stage.appendChild(deepSection);
    stage.appendChild(resetBtn);

    // ── Card click handler ──
    wideCards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (isExpanded) return;
        isExpanded = true;

        var h = parseInt(card.dataset.h);
        deepLabel.textContent = 'Generation 2 — deep (same direction)';

        wideCards.forEach(function (c) {
          c.classList.remove('perm-card--selected', 'perm-card--dim');
          if (c === card) c.classList.add('perm-card--selected');
          else c.classList.add('perm-card--dim');
        });

        hint.classList.add('perm-hint--hidden');
        connector.classList.add('perm-connector--visible');

        // Build deep cards
        var dc = deepColors(h);
        var newCards = [];
        deepRow1.innerHTML = '';
        deepRow2.innerHTML = '';

        dc.forEach(function (color, i) {
          var c = makeCard(color);
          newCards.push(c);
          (i < 5 ? deepRow1 : deepRow2).appendChild(c);
        });

        deepSection.appendChild(deepRow1);
        deepSection.appendChild(deepRow2);

        requestAnimationFrame(function () {
          deepSection.classList.add('perm-deep--visible');
          cascadeIn(newCards, 160);
        });

        setTimeout(function () {
          resetBtn.classList.add('perm-reset--visible');
        }, 700);
      });
    });

    // ── Reset ──
    resetBtn.addEventListener('click', function () {
      isExpanded = false;
      wideCards.forEach(function (c) {
        c.classList.remove('perm-card--selected', 'perm-card--dim');
      });
      deepSection.classList.remove('perm-deep--visible');
      connector.classList.remove('perm-connector--visible');
      hint.classList.remove('perm-hint--hidden');
      resetBtn.classList.remove('perm-reset--visible');
      deepRow1.innerHTML = '';
      deepRow2.innerHTML = '';
    });

    // ── Trigger cascade when slide enters viewport ──
    var slide = stage.closest('.slide');
    var target = slide || stage;

    var triggered = false;
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !triggered) {
        triggered = true;
        cascadeIn(wideCards, 0);
        observer.disconnect();
      }
    }, { threshold: 0.55 });

    observer.observe(target);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPermutations);
  } else {
    initPermutations();
  }
})();
