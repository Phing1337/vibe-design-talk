/**
 * index-grid.js — Visual Slide Grid, Zoom-to-Enter, Slide Number Click
 *
 * Handles: build visual slide grid, zoom-to-enter click handler,
 * slide number click-to-index.
 *
 * Depends on: PRES.slides, PRES.goToSlide
 */
(function() {
  'use strict';

  var slides = PRES.slides;
  var goToSlide = PRES.goToSlide;

  // Build index grid
  var grid = document.getElementById('indexGrid');
  if (grid) {
    slides.forEach(function(slide, i) {
      if (i < 2) return; // skip title + index

      var thumb = document.createElement('div');
      thumb.className = 'index-thumb';
      thumb.setAttribute('data-slide-index', i);

      var label = document.createElement('div');
      label.className = 'index-thumb-label';
      label.innerHTML = '<span class="index-thumb-number">' + (i - 1) + '</span>' + (slide.getAttribute('data-title') || '');
      thumb.appendChild(label);

      var bgColor = slide.style.background || getComputedStyle(slide).backgroundColor || '#0a0a0a';
      thumb.style.background = bgColor.includes('!important') ? bgColor.replace('!important','').trim() : (bgColor || 'var(--color-bg)');

      var img = slide.querySelector('img');
      if (img) {
        var thumbImg = document.createElement('img');
        thumbImg.src = img.src;
        thumbImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.7;';
        thumb.insertBefore(thumbImg, label);
      }

      // Click handler — zoom to slide
      thumb.addEventListener('click', function() {
        var rect = thumb.getBoundingClientRect();
        var overlay = document.getElementById('indexZoomOverlay');
        overlay.innerHTML = '';

        var clone = document.createElement('div');
        clone.className = 'index-zoom-clone';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.background = thumb.style.background;

        if (img) {
          var cloneImg = document.createElement('img');
          cloneImg.src = img.src;
          cloneImg.style.cssText = 'width:100%;height:100%;object-fit:cover;';
          clone.appendChild(cloneImg);
        }

        overlay.appendChild(clone);

        clone.offsetWidth; // force reflow
        requestAnimationFrame(function() {
          clone.classList.add('zoomed');
          clone.style.left = '0px';
          clone.style.top = '0px';
          clone.style.width = '100vw';
          clone.style.height = '100vh';
        });

        setTimeout(function() {
          goToSlide(i);
          overlay.innerHTML = '';
        }, 650);
      });

      grid.appendChild(thumb);
    });
  }

  // Slide number click → go to index (slide 1)
  var slideNumberEl = document.getElementById('slideNumber');
  if (slideNumberEl) {
    slideNumberEl.addEventListener('click', function() {
      goToSlide(1);
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
