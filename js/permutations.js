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

  // Sequential: 5 cards, gradual drift from blue toward green
  var SEQ_COLORS = [
    { h: 210, s: 68, l: 44 },
    { h: 200, s: 64, l: 46 },
    { h: 188, s: 60, l: 44 },
    { h: 172, s: 56, l: 42 },
    { h: 156, s: 52, l: 40 },
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

  function makeCard(color, noRotation) {
    var rot = noRotation ? 0 : (Math.random() * 5.4 - 2.7).toFixed(1);
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
    var seqStage = document.getElementById('permSeqStage');
    if (!stage) return;

    var isExpanded = false;
    var wideCards = [];

    // ── Sequential side (click-through, one at a time) ──
    if (seqStage) {
      var seqStep = 0;
      var seqRows = [];
      var seqArrows = [];

      // Build all rows + arrows but hide everything after the first
      SEQ_COLORS.forEach(function (color, i) {
        var row = document.createElement('div');
        row.className = 'perm-row perm-row-seq';
        if (i > 0) row.style.display = 'none';

        var card = makeCard(color, true);
        if (i === 0) card.classList.add('perm-card--in'); // first one visible immediately
        row.appendChild(card);

        var stepLabel = document.createElement('div');
        stepLabel.className = 'perm-seq-step-label';
        stepLabel.textContent = 'v' + (i + 1);
        row.appendChild(stepLabel);

        seqStage.appendChild(row);
        seqRows.push({ row: row, card: card });

        if (i < SEQ_COLORS.length - 1) {
          var arrow = document.createElement('div');
          arrow.className = 'perm-seq-arrow-v2';
          arrow.textContent = '↓';
          arrow.style.display = 'none';
          seqStage.appendChild(arrow);
          seqArrows.push(arrow);
        }
      });

      // Hint
      var seqHint = document.createElement('div');
      seqHint.className = 'perm-hint';
      seqHint.textContent = 'click to iterate →';
      seqStage.appendChild(seqHint);

      // Counter (updates as you click)
      var seqCounter = document.createElement('div');
      seqCounter.className = 'perm-counter';
      seqCounter.innerHTML = 'Total explorations: <strong>1</strong>';
      seqStage.appendChild(seqCounter);

      var seqNote = document.createElement('div');
      seqNote.className = 'perm-note';
      seqNote.style.opacity = '0';
      seqNote.style.transition = 'opacity 0.3s ease';
      seqNote.textContent = 'Local maximum. You never searched beyond this narrow range.';
      seqStage.appendChild(seqNote);

      // Click the last visible card to reveal the next one
      seqStage.addEventListener('click', function () {
        if (seqStep >= SEQ_COLORS.length - 1) return; // all shown

        // Show arrow
        if (seqArrows[seqStep]) {
          seqArrows[seqStep].style.display = '';
        }

        seqStep++;

        // Show next row and animate card in
        var next = seqRows[seqStep];
        next.row.style.display = '';
        requestAnimationFrame(function () {
          next.card.classList.add('perm-card--in');
        });

        // Update counter
        seqCounter.innerHTML = 'Total explorations: <strong>' + (seqStep + 1) + '</strong>';

        // If all done, show the note and hide hint
        if (seqStep >= SEQ_COLORS.length - 1) {
          seqHint.classList.add('perm-hint--hidden');
          seqNote.style.opacity = '1';
        }
      });
    }

    // ── Wide & Deep side ──

    // Wide section (Generation 1)
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
    hint.textContent = 'click any card to go deep →';
    wideSection.appendChild(hint);

    // Counter for wide side — total solution space
    var wideCounter = document.createElement('div');
    wideCounter.className = 'perm-counter perm-counter-wide';
    wideCounter.id = 'permWideCounter';
    wideCounter.innerHTML = 'Total explorations: <strong>15</strong>';
    wideSection.appendChild(wideCounter);

    // Connector
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

    // Deep section (Generation 2)
    var deepSection = document.createElement('div');
    deepSection.className = 'perm-deep-section';

    var deepLabel = document.createElement('div');
    deepLabel.className = 'perm-phase-label';
    deepSection.appendChild(deepLabel);

    var deepRow1 = document.createElement('div');
    deepRow1.className = 'perm-row';
    var deepRow2 = document.createElement('div');
    deepRow2.className = 'perm-row';

    stage.appendChild(wideSection);
    stage.appendChild(connector);
    stage.appendChild(deepSection);

    // Card click → go deep
    wideCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var h = parseInt(card.dataset.h);
        deepLabel.textContent = 'Generation 2 — deep';

        wideCards.forEach(function (c) {
          c.classList.remove('perm-card--selected');
          if (c === card) c.classList.add('perm-card--selected');
        });

        hint.classList.add('perm-hint--hidden');
        connector.classList.add('perm-connector--visible');

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

        // Update counter — 15 wide + 10 deep = 25, but each of the 15 could go deep (150 total solution space)
        var counter = document.getElementById('permWideCounter');
        if (counter) counter.innerHTML = 'Total explorations: <strong>25</strong><span class="perm-counter-sub">Solution space: 15 directions × 10 variations = <strong>150</strong></span>';

        requestAnimationFrame(function () {
          deepSection.classList.add('perm-deep--visible');
          cascadeIn(newCards, isExpanded ? 0 : 160);
        });

        isExpanded = true;
      });
    });

    // Trigger wide cascade on slide enter
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
