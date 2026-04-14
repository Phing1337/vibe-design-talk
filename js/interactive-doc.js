/* ============================================================
   interactive-doc.js — Paper card flip, tooltips, analytics
   Slide: Interactive Documents
   ============================================================ */

(function () {
  'use strict';

  /* ── Donut constants: r=22, circumference = 2π×22 = 138.23 ── */
  var DONUT_C = 138.23;
  var SCROLL_DEPTH = 0.73; /* 73% */

  /* ── Tooltip definitions for each annotated word ── */
  var TIPS = {
    whitespace: {
      title: 'Breathing Room',
      build: function () {
        return (
          '<div style="display:flex;gap:7px;margin-bottom:8px;">' +
            '<div style="flex:1;background:#e8e2d9;border-radius:3px;padding:6px;">' +
              '<div style="font-size:0.52rem;color:#6b5335;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;">Dense</div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:1px;margin-bottom:2px;"></div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:1px;margin-bottom:2px;"></div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:1px;margin-bottom:2px;"></div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:1px;margin-bottom:2px;"></div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:1px;"></div>' +
            '</div>' +
            '<div style="flex:1;background:#f9f7f4;border-radius:3px;padding:6px;border:1px solid rgba(0,0,0,0.06);">' +
              '<div style="font-size:0.52rem;color:#6b5335;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Spacious</div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.18);border-radius:1px;margin-bottom:6px;"></div>' +
              '<div style="height:3px;background:rgba(0,0,0,0.18);border-radius:1px;width:70%;"></div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:0.72rem;color:#1a1612;font-weight:700;">+20% comprehension</div>' +
          '<div style="font-size:0.62rem;color:#8b7355;margin-top:2px;">with generous whitespace — Nielsen Norman</div>'
        );
      }
    },

    typography: {
      title: 'Typography',
      build: function () {
        var bars = [
          { label: 'Typography', pct: 78, color: '#5c3d1e' },
          { label: 'Layout', pct: 64, color: '#8b7355' },
          { label: 'Color', pct: 42, color: '#b89a75' }
        ];
        var rows = bars.map(function (b) {
          return (
            '<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">' +
              '<div style="font-size:0.6rem;color:#6b5335;width:66px;flex-shrink:0;">' + b.label + '</div>' +
              '<div style="flex:1;height:7px;background:rgba(139,115,85,0.12);border-radius:3px;overflow:hidden;">' +
                '<div style="width:' + b.pct + '%;height:100%;background:' + b.color + ';border-radius:3px;"></div>' +
              '</div>' +
              '<div style="font-size:0.6rem;color:#8b7355;width:22px;text-align:right;">' + b.pct + '%</div>' +
            '</div>'
          );
        }).join('');
        return (
          '<div style="font-size:0.62rem;color:#6b5335;margin-bottom:7px;">First impressions rely on:</div>' +
          rows +
          '<div style="font-size:0.6rem;color:#8b7355;margin-top:5px;font-style:italic;">"Web design is 95% typography" — O. Reichenstein</div>'
        );
      }
    },

    hierarchy: {
      title: 'Visual Priority',
      build: function () {
        var tiers = [
          { w: 44, label: 'Focal', color: '#3d2710' },
          { w: 96, label: 'Supporting', color: '#5c3d1e' },
          { w: 148, label: 'Ambient', color: '#8b7355' },
          { w: 196, label: 'Decorative', color: '#b89a75' }
        ];
        var rects = tiers.map(function (t, i) {
          var x = (196 - t.w) / 2;
          var y = i * 22 + 4;
          return (
            '<rect x="' + x + '" y="' + y + '" width="' + t.w + '" height="17" rx="2" fill="' + t.color + '"/>' +
            '<text x="98" y="' + (y + 12) + '" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="8" font-family="Inter,sans-serif" font-weight="600">' + t.label + '</text>'
          );
        }).join('');
        return '<svg width="196" height="96" viewBox="0 0 196 96">' + rects + '</svg>';
      }
    },

    rhythm: {
      title: 'Visual Cadence',
      build: function () {
        var r = 5;
        var evenXs = [14, 44, 74, 104, 134];
        var unevenXs = [14, 28, 66, 82, 134];
        function dots(xs, y, fill) {
          return xs.map(function (x) {
            return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"/>';
          }).join('');
        }
        return (
          '<svg width="196" height="76" viewBox="0 0 196 76">' +
            '<text x="2" y="12" font-size="7" font-family="Inter,sans-serif" fill="#8b7355" font-weight="700" letter-spacing="0.08em">CONSISTENT</text>' +
            dots(evenXs, 26, '#5c3d1e') +
            '<text x="2" y="50" font-size="7" font-family="Inter,sans-serif" fill="#c4a882" font-weight="700" letter-spacing="0.08em">INCONSISTENT</text>' +
            dots(unevenXs, 66, '#c4a882') +
          '</svg>' +
          '<div style="font-size:0.6rem;color:#8b7355;margin-top:2px;">Even spacing creates visual rhythm</div>'
        );
      }
    },

    contrast: {
      title: 'Contrast Ratio',
      build: function () {
        return (
          '<div style="display:flex;gap:5px;margin-bottom:8px;">' +
            '<div style="flex:1;background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:4px;padding:8px 6px;text-align:center;">' +
              '<div style="font-size:1.1rem;font-weight:700;color:#1a1612;font-family:Georgia,serif;">Aa</div>' +
              '<div style="font-size:0.52rem;color:#3d7a3d;font-weight:700;margin-top:2px;">7:1 ✓ AAA</div>' +
            '</div>' +
            '<div style="flex:1;background:#767676;border-radius:4px;padding:8px 6px;text-align:center;">' +
              '<div style="font-size:1.1rem;font-weight:700;color:#fff;font-family:Georgia,serif;">Aa</div>' +
              '<div style="font-size:0.52rem;color:rgba(255,255,255,0.75);font-weight:700;margin-top:2px;">4.5:1 ✓ AA</div>' +
            '</div>' +
            '<div style="flex:1;background:#aaa;border-radius:4px;padding:8px 6px;text-align:center;">' +
              '<div style="font-size:1.1rem;font-weight:700;color:#ccc;font-family:Georgia,serif;">Aa</div>' +
              '<div style="font-size:0.52rem;color:rgba(255,255,255,0.6);font-weight:700;margin-top:2px;">1.8:1 ✗ Fail</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:0.62rem;color:#8b7355;">WCAG 2.2 requires 4.5:1 for normal text (AA)</div>'
        );
      }
    }
  };

  function init() {
    var wrapper = document.getElementById('paperWrapper');
    var toggleBtn = document.getElementById('paperToggleBtn');
    var tooltip = document.getElementById('doc-tooltip');
    var tipTitle = document.getElementById('tipTitle');
    var tipContent = document.getElementById('tipContent');

    if (!wrapper || !tooltip) return;

    var animTriggered = false;
    var isAnimating = false;
    var isAnalyticsOpen = false;
    var currentWord = null;
    var panel = document.getElementById('paperAnalytics');
    var track = document.getElementById('idocScrollTrack');

    var HALF = 310; /* ms per half of the flip */

    /* ── Card flip — half-flip technique (works with overflow:hidden ancestor) ── */
    function flip(toBack) {
      if (!panel || !track || isAnimating) return;
      isAnimating = true;

      if (toBack) {
        /* Phase 1: paper folds away to the right edge */
        track.style.transition = 'transform ' + HALF + 'ms cubic-bezier(0.55,0,0.9,0.6)';
        track.style.transform = 'rotateY(90deg)';

        setTimeout(function () {
          /* Mid-flip: hide paper, prep analytics at left edge */
          track.style.transition = 'none';
          track.style.visibility = 'hidden';

          panel.style.transition = 'none';
          panel.style.transform = 'rotateY(-90deg)';
          panel.style.opacity = '1';
          panel.style.pointerEvents = 'auto';
          panel.setAttribute('aria-hidden', 'false');

          /* Force reflow before animating */
          panel.offsetWidth; // jshint ignore:line

          /* Phase 2: analytics unfolds from left edge */
          panel.style.transition = 'transform ' + HALF + 'ms cubic-bezier(0.1,0.4,0.45,1)';
          panel.style.transform = 'rotateY(0deg)';
          panel.classList.add('analytics-open');

          if (toggleBtn) { toggleBtn.textContent = '✕'; toggleBtn.title = 'Back to document'; }

          setTimeout(function () {
            isAnimating = false;
            if (!animTriggered) {
              animTriggered = true;
              animateAnalytics();
            }
          }, HALF + 20);
        }, HALF + 20);

      } else {
        /* Phase 1: analytics folds away to the right edge */
        panel.style.transition = 'transform ' + HALF + 'ms cubic-bezier(0.55,0,0.9,0.6)';
        panel.style.transform = 'rotateY(90deg)';

        setTimeout(function () {
          /* Mid-flip: hide analytics, prep paper at left edge */
          panel.style.transition = 'none';
          panel.style.opacity = '0';
          panel.style.pointerEvents = 'none';
          panel.setAttribute('aria-hidden', 'true');
          panel.classList.remove('analytics-open');

          track.style.transition = 'none';
          track.style.visibility = 'visible';
          track.style.transform = 'rotateY(-90deg)';

          track.offsetWidth; // jshint ignore:line

          /* Phase 2: paper unfolds from left edge */
          track.style.transition = 'transform ' + HALF + 'ms cubic-bezier(0.1,0.4,0.45,1)';
          track.style.transform = 'rotateY(0deg)';

          if (toggleBtn) { toggleBtn.innerHTML = '&#9783;'; toggleBtn.title = 'View Analytics'; }

          setTimeout(function () {
            isAnimating = false;
            animTriggered = false;
            resetAnalytics();
          }, HALF + 20);
        }, HALF + 20);
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        isAnalyticsOpen = !isAnalyticsOpen;
        flip(isAnalyticsOpen);
      });
    }

    /* ── Analytics animations ── */
    function animateAnalytics() {
      /* Donut: stroke-dashoffset from DONUT_C → DONUT_C*(1-0.73) */
      var arc = document.getElementById('donutArc');
      if (arc) {
        arc.style.transition = 'stroke-dashoffset 1s ease-out';
        arc.style.strokeDashoffset = (DONUT_C * (1 - SCROLL_DEPTH)).toFixed(1);
      }

      /* Engagement bars */
      document.querySelectorAll('.eng-bar-fill').forEach(function (bar) {
        var pct = parseFloat(bar.getAttribute('data-pct') || '0');
        bar.style.transform = 'scaleX(' + pct + ')';
      });
    }

    function resetAnalytics() {
      var arc = document.getElementById('donutArc');
      if (arc) {
        arc.style.transition = 'none';
        arc.style.strokeDashoffset = DONUT_C;
      }
      document.querySelectorAll('.eng-bar-fill').forEach(function (bar) {
        bar.style.transition = 'none';
        bar.style.transform = 'scaleX(0)';
        /* re-enable transition after brief delay */
        setTimeout(function () { bar.style.transition = ''; }, 50);
      });
    }

    function drawSparkline() {
      var line = document.getElementById('sparklineLine');
      var dot = document.getElementById('sparklineDot');
      if (!line) return;

      var data = [3, 7, 5, 9, 8, 15, 12];
      var maxVal = 15;
      var w = 100, h = 26;
      var xStep = w / (data.length - 1);

      var pts = data.map(function (v, i) {
        var x = +(i * xStep).toFixed(1);
        var y = +(h - (v / maxVal) * (h - 6) - 3).toFixed(1);
        return x + ',' + y;
      }).join(' ');

      line.setAttribute('points', pts);

      var lastY = +(h - (12 / maxVal) * (h - 6) - 3).toFixed(1);
      if (dot) {
        dot.setAttribute('cx', w);
        dot.setAttribute('cy', lastY);
      }
    }

    /* ── Tooltip system ── */
    function showTip(e) {
      var word = e.currentTarget;
      var key = word.getAttribute('data-tip');
      var tip = TIPS[key];
      if (!tip) return;

      currentWord = word;
      tipTitle.textContent = tip.title;
      tipContent.innerHTML = tip.build();
      tooltip.removeAttribute('aria-hidden');
      tooltip.classList.add('visible');
      positionTip(word);
    }

    function hideTip() {
      tooltip.classList.remove('visible');
      tooltip.setAttribute('aria-hidden', 'true');
      currentWord = null;
    }

    function positionTip(word) {
      var rect = word.getBoundingClientRect();
      var tipW = 220;
      var tipH = tooltip.offsetHeight || 130;

      var left = rect.left + rect.width / 2 - tipW / 2;
      var top = rect.top - tipH - 14;

      /* clamp to viewport */
      left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
      if (top < 8) top = rect.bottom + 14; /* flip below if no room above */

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.style.width = tipW + 'px';
    }

    document.querySelectorAll('.doc-word').forEach(function (word) {
      word.addEventListener('mouseenter', showTip);
      word.addEventListener('mouseleave', hideTip);
    });

    /* reposition tooltip if user scrolls the paper */
    var paperScroll = document.getElementById('paperScroll');
    if (paperScroll) {
      paperScroll.addEventListener('scroll', function () {
        if (currentWord) positionTip(currentWord);
      });
    }

    /* ── Reader scatter cloud hover ── */
    var cloudTip = document.getElementById('cloudTip');
    if (cloudTip) {
      document.querySelectorAll('.rdr-dot').forEach(function(dot) {
        dot.addEventListener('mouseenter', function(e) {
          cloudTip.textContent = dot.dataset.lbl;
          cloudTip.classList.add('visible');
          moveTip(e);
        });
        dot.addEventListener('mousemove', moveTip);
        dot.addEventListener('mouseleave', function() {
          cloudTip.classList.remove('visible');
        });
      });
      function moveTip(e) {
        var svg = document.getElementById('readerCloud');
        if (!svg) return;
        var rect = svg.getBoundingClientRect();
        cloudTip.style.left = (e.clientX - rect.left) + 'px';
        cloudTip.style.top  = (e.clientY - rect.top)  + 'px';
      }
    }

    /* ── Bubble hover ── */
    document.querySelectorAll('.bbl').forEach(function(b) {
      b.style.cursor = 'pointer';
      b.addEventListener('mouseenter', function() { b.style.opacity = '1'; b.setAttribute('stroke-width', '2.5'); });
      b.addEventListener('mouseleave', function() { b.style.opacity = '';  b.setAttribute('stroke-width', '1.5'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
