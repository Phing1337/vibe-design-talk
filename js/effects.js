/**
 * effects.js — Visual Canvas Effects
 *
 * Handles: boat sunrise canvas renderer, pixel sky canvases,
 * title shader, star generation.
 *
 * No exports to PRES. Self-contained.
 */
(function() {
  'use strict';

  // Generate stars for space scene
  (function generateStars() {
    var container = document.getElementById('starsContainer');
    if (!container) return;
    for (var i = 0; i < 200; i++) {
      var star = document.createElement('div');
      star.className = 'star' + (Math.random() > 0.6 ? ' star-twinkle' : '');
      var size = Math.random() * 2.5 + 0.5;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.opacity = Math.random() * 0.7 + 0.2;
      if (star.classList.contains('star-twinkle')) {
        star.style.animationDuration = (Math.random() * 3 + 2) + 's';
        star.style.animationDelay = (Math.random() * 5) + 's';
      }
      container.appendChild(star);
    }
  })();

  // Pixel art sunrise/sunset sky shader
  (function initPixelSkies() {
    var canvases = [
      { id: 'shaderSky1', type: 'sunrise' },
      { id: 'shaderSky2', type: 'sunset' }
    ];

    var pixelSize = 6;

    function lerpColor(a, b, t) {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
      ];
    }

    function drawSky(canvas, type) {
      if (!canvas) return;
      var rect = canvas.parentElement.getBoundingClientRect();
      var w = Math.ceil(rect.width / pixelSize);
      var h = Math.ceil(rect.height / pixelSize);
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      var t = (Date.now() * 0.0001) % 1;

      var colors;
      if (type === 'sunrise') {
        colors = [
          [15, 10, 40], [40, 20, 70], [120, 50, 80],
          [210, 120, 60], [240, 180, 80], [250, 210, 140]
        ];
      } else {
        colors = [
          [10, 15, 45], [30, 25, 80], [100, 40, 100],
          [180, 60, 70], [220, 100, 50], [240, 160, 60]
        ];
      }

      for (var y = 0; y < h; y++) {
        var gradT = y / h;
        var segment = gradT * (colors.length - 1);
        var idx = Math.min(Math.floor(segment), colors.length - 2);
        var localT = segment - idx;
        var col = lerpColor(colors[idx], colors[idx + 1], localT);

        for (var x = 0; x < w; x++) {
          var noise = (Math.sin(x * 0.7 + y * 0.3 + t * 20) * 5);
          ctx.fillStyle = 'rgb(' +
            Math.max(0, Math.min(255, Math.round(col[0] + noise))) + ',' +
            Math.max(0, Math.min(255, Math.round(col[1] + noise))) + ',' +
            Math.max(0, Math.min(255, Math.round(col[2] + noise))) + ')';
          ctx.fillRect(x, y, 1, 1);
        }
      }

      var sunX = w * (type === 'sunrise' ? 0.7 : 0.3);
      var sunY = h * 0.7 + Math.sin(t * Math.PI * 2) * h * 0.05;
      var sunR = Math.min(w, h) * 0.06;
      var sunColor = type === 'sunrise' ? [255, 220, 120] : [255, 160, 80];

      for (var sy = -sunR - 3; sy <= sunR + 3; sy++) {
        for (var sx = -sunR - 3; sx <= sunR + 3; sx++) {
          var dist = Math.sqrt(sx * sx + sy * sy);
          if (dist < sunR) {
            ctx.fillStyle = 'rgb(' + sunColor[0] + ',' + sunColor[1] + ',' + sunColor[2] + ')';
            ctx.fillRect(Math.round(sunX + sx), Math.round(sunY + sy), 1, 1);
          } else if (dist < sunR + 2) {
            ctx.fillStyle = 'rgba(' + sunColor[0] + ',' + sunColor[1] + ',' + sunColor[2] + ',0.3)';
            ctx.fillRect(Math.round(sunX + sx), Math.round(sunY + sy), 1, 1);
          }
        }
      }

      drawPixelClouds(ctx, w, h, t, type);
    }

    function drawPixelClouds(ctx, w, h, t, type) {
      var clouds = type === 'sunrise' ? [
        { x: 0.15, y: 0.25, w: 0.2, h: 0.04, speed: 0.3 },
        { x: 0.55, y: 0.35, w: 0.25, h: 0.035, speed: 0.2 },
        { x: 0.3, y: 0.5, w: 0.18, h: 0.03, speed: 0.4 },
        { x: 0.75, y: 0.15, w: 0.15, h: 0.03, speed: 0.15 },
        { x: 0.1, y: 0.6, w: 0.22, h: 0.04, speed: 0.25 },
      ] : [
        { x: 0.2, y: 0.2, w: 0.22, h: 0.04, speed: 0.25 },
        { x: 0.6, y: 0.3, w: 0.18, h: 0.035, speed: 0.35 },
        { x: 0.4, y: 0.45, w: 0.2, h: 0.03, speed: 0.2 },
        { x: 0.8, y: 0.55, w: 0.16, h: 0.03, speed: 0.3 },
        { x: 0.05, y: 0.4, w: 0.2, h: 0.035, speed: 0.15 },
      ];

      clouds.forEach(function(c) {
        var cx = ((c.x + t * c.speed) % 1.3 - 0.15) * w;
        var cy = c.y * h;
        var cw = c.w * w;
        var ch = c.h * h;

        var brightness = 1 - (c.y * 0.6);
        var baseCol = type === 'sunrise'
          ? [200 * brightness + 55, 160 * brightness + 40, 140 * brightness + 30]
          : [180 * brightness + 40, 120 * brightness + 30, 160 * brightness + 40];

        for (var py = 0; py < ch; py++) {
          var rowT = py / ch;
          var rowWidth = cw * (1 - Math.pow(rowT * 2 - 1, 2) * 0.6);
          var rowOffset = (cw - rowWidth) / 2;
          var bumps = Math.sin(py * 1.5 + cx * 0.1) * cw * 0.08;

          for (var px = 0; px < rowWidth; px++) {
            var cloudNoise = Math.sin(px * 0.8 + py * 1.2 + t * 10);
            if (cloudNoise < -0.3) continue;

            var alpha = cloudNoise > 0.3 ? 0.9 : 0.6;
            var shade = cloudNoise * 15;
            ctx.fillStyle = 'rgba(' +
              Math.round(Math.min(255, baseCol[0] + shade)) + ',' +
              Math.round(Math.min(255, baseCol[1] + shade)) + ',' +
              Math.round(Math.min(255, baseCol[2] + shade)) + ',' + alpha + ')';
            ctx.fillRect(Math.round(cx + rowOffset + px + bumps), Math.round(cy + py), 1, 1);
          }
        }
      });
    }

    var skyCanvases = canvases.map(function(c) {
      return { canvas: document.getElementById(c.id), type: c.type };
    }).filter(function(c) { return c.canvas; });

    function animateSkies() {
      requestAnimationFrame(animateSkies);
      skyCanvases.forEach(function(c) {
        var slide = c.canvas.closest('.slide');
        if (slide && slide.classList.contains('active')) {
          drawSky(c.canvas, c.type);
        }
      });
    }
    if (skyCanvases.length > 0) animateSkies();
  })();

  // Dynamic sunrise for boat slide
  (function initBoatSunrise() {
    var canvas = document.getElementById('boatSunrise');
    if (!canvas) return;

    var horizonY = 0.9;
    var startTime = null;

    function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
    function lerpCol(a, b, t) { return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }
    function col(c) { return 'rgb('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+')'; }
    function cola(c, a) { return 'rgba('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+','+a+')'; }

    function draw() {
      requestAnimationFrame(draw);
      var slide = canvas.closest('.slide');
      if (!slide || !slide.classList.contains('active')) { startTime = null; return; }

      if (startTime === null) startTime = Date.now();
      var elapsed = (Date.now() - startTime) / 1000;

      var w = canvas.offsetWidth || window.innerWidth;
      var h = canvas.offsetHeight || window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio, 2);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var cycle = Math.min(elapsed / 45, 1);
      var sunAngle = cycle * Math.PI * 0.8 + 0.1;
      var sunX = w * (0.15 + 0.7 * cycle);
      var sunArcH = h * 0.5;
      var sunY = h * horizonY - Math.sin(sunAngle) * sunArcH;
      var sunHeight = Math.sin(sunAngle);

      // Sky gradient
      var skyGrad = ctx.createLinearGradient(0, 0, 0, h * horizonY);
      if (sunHeight < 0.15) {
        skyGrad.addColorStop(0, col(lerpCol([10,8,30], [30,15,60], sunHeight/0.15)));
        skyGrad.addColorStop(0.4, col(lerpCol([20,12,40], [80,30,70], sunHeight/0.15)));
        skyGrad.addColorStop(0.7, col(lerpCol([30,15,45], [200,80,50], sunHeight/0.15)));
        skyGrad.addColorStop(1, col(lerpCol([40,20,50], [255,140,40], sunHeight/0.15)));
      } else if (sunHeight < 0.5) {
        var t = (sunHeight - 0.15) / 0.35;
        skyGrad.addColorStop(0, col(lerpCol([30,15,60], [50,100,180], t)));
        skyGrad.addColorStop(0.4, col(lerpCol([80,30,70], [90,150,210], t)));
        skyGrad.addColorStop(0.7, col(lerpCol([200,80,50], [160,200,230], t)));
        skyGrad.addColorStop(1, col(lerpCol([255,140,40], [200,220,240], t)));
      } else {
        var t2 = (sunHeight - 0.5) / 0.5;
        skyGrad.addColorStop(0, col(lerpCol([50,100,180], [70,130,210], t2)));
        skyGrad.addColorStop(0.5, col(lerpCol([90,150,210], [130,180,230], t2)));
        skyGrad.addColorStop(1, col(lerpCol([200,220,240], [190,215,240], t2)));
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * horizonY + 2);

      // Sun
      var sunR = 40 + sunHeight * 20;
      var scatterR = sunR * 8;
      var scatter = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, scatterR);
      var warmth = sunHeight < 0.3 ? [255,130,30] : [255,220,140];
      var scatterAlpha = sunHeight < 0.2 ? 0.25 : 0.12;
      scatter.addColorStop(0, cola(warmth, scatterAlpha));
      scatter.addColorStop(0.4, cola(warmth, scatterAlpha * 0.3));
      scatter.addColorStop(1, cola(warmth, 0));
      ctx.fillStyle = scatter;
      ctx.fillRect(0, 0, w, h);

      if (sunY < h * horizonY + sunR) {
        var glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3);
        glow.addColorStop(0, 'rgba(255,255,245,0.9)');
        glow.addColorStop(0.2, cola(sunHeight<0.3 ? [255,200,100] : [255,240,200], 0.5));
        glow.addColorStop(0.5, cola(sunHeight<0.3 ? [255,150,50] : [255,220,160], 0.15));
        glow.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 3, 0, Math.PI * 2);
        ctx.fill();

        var core = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
        core.addColorStop(0, 'rgba(255,255,255,1)');
        core.addColorStop(0.6, cola(sunHeight<0.3 ? [255,230,170] : [255,250,230], 0.9));
        core.addColorStop(1, cola([255,200,100], 0));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Water
      var waterCol = sunHeight > 0.3
        ? lerpCol([30,70,120], [70,130,180], sunHeight)
        : lerpCol([12,18,35], [30,60,100], sunHeight * 3);
      var waterGrad = ctx.createLinearGradient(0, h * horizonY, 0, h);
      waterGrad.addColorStop(0, col(waterCol));
      waterGrad.addColorStop(1, col([waterCol[0]*0.2, waterCol[1]*0.2, waterCol[2]*0.25]));
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, h * horizonY, w, h * (1 - horizonY));

      if (sunY < h * horizonY + sunR) {
        var refW = 30 + sunHeight * 60;
        var refGrad = ctx.createLinearGradient(0, h * horizonY, 0, h);
        var rAlpha = sunHeight < 0.2 ? 0.25 : 0.12;
        refGrad.addColorStop(0, cola([255,200,100], rAlpha));
        refGrad.addColorStop(0.5, cola([255,160,60], rAlpha * 0.3));
        refGrad.addColorStop(1, 'rgba(255,100,30,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(sunX - refW, h * horizonY, refW * 2, h * (1 - horizonY));
      }

      // Text readability overlay
      var overlay1 = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
      overlay1.addColorStop(0, 'rgba(0,0,0,0.45)');
      overlay1.addColorStop(0.4, 'rgba(0,0,0,0.25)');
      overlay1.addColorStop(0.7, 'rgba(0,0,0,0.08)');
      overlay1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = overlay1;
      ctx.fillRect(0, 0, w, h);

      var overlay2 = ctx.createRadialGradient(w * 0.15, h * 0.3, 0, w * 0.15, h * 0.3, w * 0.4);
      overlay2.addColorStop(0, 'rgba(0,0,0,0.2)');
      overlay2.addColorStop(0.5, 'rgba(0,0,0,0.08)');
      overlay2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = overlay2;
      ctx.fillRect(0, 0, w, h);

      // Update boat content colors
      var boatContent = document.querySelector('.boat-content');
      if (boatContent) {
        boatContent.style.color = '#ffffff';
        boatContent.querySelectorAll('.body').forEach(function(el) { el.style.color = 'rgba(255,255,255,0.9)'; });
        boatContent.querySelectorAll('.label').forEach(function(el) { el.style.color = 'rgba(255,255,255,0.7)'; });
      }

      // Dynamic color temperature on the boat illustration
      var boatImg = document.getElementById('boatImg');
      if (boatImg) {
        var imgWarmth, bright, sat;
        if (sunHeight < 0.15) {
          var ft = sunHeight / 0.15;
          imgWarmth = lerp(140, 115, ft);
          bright = lerp(0.25, 0.65, ft);
          sat = lerp(0.5, 0.8, ft);
        } else if (sunHeight < 0.5) {
          var ft2 = (sunHeight - 0.15) / 0.35;
          imgWarmth = lerp(115, 100, ft2);
          bright = lerp(0.65, 1.15, ft2);
          sat = lerp(0.8, 1.05, ft2);
        } else {
          imgWarmth = 100;
          bright = 1.15;
          sat = 1.05;
        }
        boatImg.style.filter = 'brightness('+bright.toFixed(2)+') saturate('+sat.toFixed(2)+') sepia(0.2) hue-rotate('+(imgWarmth-100)+'deg)';
      }
    }

    draw();
  })();

  // Title slide shader — subtle organic shifting blobs
  (function initTitleShader() {
    var canvas = document.getElementById('titleShader');
    if (!canvas) return;

    function draw() {
      requestAnimationFrame(draw);
      var slide = canvas.closest('.slide');
      if (!slide || !slide.classList.contains('active')) return;

      var w = canvas.offsetWidth || window.innerWidth;
      var h = canvas.offsetHeight || window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio, 2);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      var t = Date.now() * 0.0003;

      var blobs = [
        { x: 0.3, y: 0.4, r: 0.35, color: [212, 160, 83], speed: 0.7, phase: 0 },
        { x: 0.7, y: 0.6, r: 0.3, color: [100, 60, 140], speed: 0.5, phase: 2 },
        { x: 0.5, y: 0.2, r: 0.25, color: [74, 158, 255], speed: 0.6, phase: 4 },
        { x: 0.2, y: 0.7, r: 0.28, color: [45, 180, 160], speed: 0.4, phase: 1 },
      ];

      blobs.forEach(function(b) {
        var bx = (b.x + Math.sin(t * b.speed + b.phase) * 0.08) * w;
        var by = (b.y + Math.cos(t * b.speed * 0.8 + b.phase) * 0.06) * h;
        var br = b.r * Math.min(w, h);

        var grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ', 0.06)');
        grad.addColorStop(0.5, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ', 0.025)');
        grad.addColorStop(1, 'rgba(' + b.color[0] + ',' + b.color[1] + ',' + b.color[2] + ', 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
    }
    draw();
  })();
})();
