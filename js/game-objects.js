/**
 * game-objects.js — Info Points, Deadline Entity, Debug Markers
 *
 * Handles: info point creation/update/open/close, deadline creation/update,
 * debug marker placement/panel/coords, debug keyboard shortcuts.
 *
 * Exports to PRES: createInfoPoints, updateInfoPoints, openInfoPanel,
 * closeInfoPanel, nearbyInfoPoint, activeInfoPanel, infoPointMeshes,
 * createDeadline, updateDeadline, deadlineObj, deadlinePos,
 * updateDebugCoords
 *
 * Depends on: PRES.scene, PRES.camera, PRES.player, PRES.gameActive
 */
(function() {
  'use strict';

  // --- Info points ---
  var infoPoints = [
    {
      x: 1.87, y: 1.91, z: -3.63,
      title: '🎨 Interactive UI',
      body: 'Presentations can contain real, functional UI components — buttons, sliders, inputs that actually work. Not screenshots. Not mockups. The real thing, running live.',
      color: 0x4a9eff
    },
    {
      x: -2.61, y: 1.91, z: -1.43,
      title: '📊 Live Data',
      body: 'Pull real-time data from APIs — weather, analytics, databases — and visualize it on the fly. Your presentations can react to the world as it changes.',
      color: 0x2dd4bf
    },
    {
      x: -1.9, y: -3.24, z: 1.47,
      title: '🌐 Spatial Communication',
      body: 'Ideas don\'t have to live on flat slides. Place information in 3D space. Let people explore. Context becomes environment.',
      color: 0xa78bfa
    }
  ];

  var infoPointMeshes = [];
  var nearbyInfoPoint = null;
  var activeInfoPanel = false;

  function createInfoPoints() {
    var scene = PRES.scene;
    var player = PRES.player;
    if (typeof THREE === 'undefined' || !scene || !player) return;

    infoPoints.forEach(function(pt, i) {
      var geo = new THREE.SphereGeometry(0.2, 16, 16);
      var mat = new THREE.MeshBasicMaterial({
        color: pt.color,
        transparent: true,
        opacity: 0.8
      });
      var sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(pt.x, pt.y - player.height + 0.5, pt.z);
      scene.add(sphere);

      var ringGeo = new THREE.RingGeometry(0.3, 0.45, 32);
      var ringMat = new THREE.MeshBasicMaterial({
        color: pt.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(sphere.position);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);

      infoPointMeshes.push({ sphere: sphere, ring: ring, index: i, baseY: sphere.position.y });
    });

    PRES.infoPointMeshes = infoPointMeshes;
  }

  function updateInfoPoints() {
    if (!PRES.gameActive || infoPointMeshes.length === 0) return;

    var player = PRES.player;
    var promptEl = document.getElementById('infoPrompt');
    var closest = null;
    var closestDist = Infinity;

    var time = performance.now() * 0.001;
    infoPointMeshes.forEach(function(ip) {
      ip.sphere.position.y = ip.baseY + Math.sin(time * 2 + ip.index) * 0.1;
      ip.ring.position.y = ip.sphere.position.y;
      ip.ring.rotation.z = time * 0.5;

      ip.sphere.material.opacity = 0.6 + Math.sin(time * 3 + ip.index * 2) * 0.2;

      var dx = player.position.x - ip.sphere.position.x;
      var dz = player.position.z - ip.sphere.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < closestDist) {
        closestDist = dist;
        closest = ip;
      }
    });

    if (closest && closestDist < 2.5 && !activeInfoPanel) {
      nearbyInfoPoint = closest.index;
      PRES.nearbyInfoPoint = nearbyInfoPoint;
      if (promptEl) {
        promptEl.style.opacity = '1';
        promptEl.textContent = 'Press E — ' + infoPoints[closest.index].title;
      }
    } else if (!activeInfoPanel) {
      nearbyInfoPoint = null;
      PRES.nearbyInfoPoint = null;
      if (promptEl) promptEl.style.opacity = '0';
    }
  }

  function openInfoPanel(index) {
    var pt = infoPoints[index];
    var panel = document.getElementById('infoPanel');
    var title = document.getElementById('infoPanelTitle');
    var body = document.getElementById('infoPanelBody');

    if (!panel || !title || !body) return;

    title.textContent = pt.title;
    body.textContent = pt.body;
    panel.style.borderColor = '#' + pt.color.toString(16).padStart(6, '0');
    panel.classList.add('visible');
    activeInfoPanel = true;
    PRES.activeInfoPanel = true;
  }

  function closeInfoPanel() {
    var panel = document.getElementById('infoPanel');
    if (panel) panel.classList.remove('visible');
    activeInfoPanel = false;
    PRES.activeInfoPanel = false;
  }

  // --- Deadline entity ---
  var deadlineObj = null;
  var deadlinePos = null;
  var deadlineText = null;

  function createDeadline() {
    var scene = PRES.scene;
    if (typeof THREE === 'undefined' || !scene || deadlineObj) return;

    var geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mat = new THREE.MeshPhongMaterial({
      color: 0xff2020,
      emissive: 0x800000,
      flatShading: true,
      transparent: true,
      opacity: 0.85
    });
    deadlineObj = new THREE.Mesh(geo, mat);
    deadlineObj.castShadow = true;
    deadlineObj.visible = false;

    var glowGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xff4040,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    var glowMesh = new THREE.Mesh(glowGeo, glowMat);
    deadlineObj.add(glowMesh);

    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff3030';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEADLINE', 128, 40);
    var texture = new THREE.CanvasTexture(canvas);
    var spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
    deadlineText = new THREE.Sprite(spriteMat);
    deadlineText.scale.set(2, 0.5, 1);
    deadlineText.position.y = 0.8;
    deadlineObj.add(deadlineText);

    scene.add(deadlineObj);
    PRES.deadlineObj = deadlineObj;
  }

  function updateDeadline() {
    var player = PRES.player;
    var camera = PRES.camera;
    if (!deadlineObj || !deadlineObj.visible || !player || !player.position) return;

    var time = Date.now() * 0.001;

    if (!deadlinePos) {
      deadlinePos = new THREE.Vector3(
        player.position.x - 5,
        player.position.y - 0.5,
        player.position.z - 5
      );
      PRES.deadlinePos = deadlinePos;
    }

    var targetX = player.position.x;
    var targetZ = player.position.z;
    var targetY = player.position.y - 0.3;

    var followSpeed = 0.008;
    deadlinePos.x += (targetX - deadlinePos.x) * followSpeed;
    deadlinePos.y += (targetY - deadlinePos.y) * followSpeed;
    deadlinePos.z += (targetZ - deadlinePos.z) * followSpeed;

    var dx = player.position.x - deadlinePos.x;
    var dz = player.position.z - deadlinePos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2) {
      var pushX = dx / dist * 2;
      var pushZ = dz / dist * 2;
      deadlinePos.x = player.position.x - pushX;
      deadlinePos.z = player.position.z - pushZ;
    }

    deadlineObj.position.copy(deadlinePos);
    deadlineObj.position.y += Math.sin(time * 2) * 0.15;
    deadlineObj.rotation.y += 0.02;
    deadlineObj.rotation.x = Math.sin(time * 1.5) * 0.1;

    deadlineObj.children[0].material.opacity = 0.1 + Math.sin(time * 3) * 0.08;

    if (deadlineText && camera) {
      deadlineText.lookAt(camera.position);
    }
  }

  // --- Debug mode ---
  var debugMarkers = [];
  var debugSprites = [];

  function placeMarker() {
    var player = PRES.player;
    var scene = PRES.scene;
    if (!PRES.gameActive || !player || !player.position) return;

    var pos = {
      x: Math.round(player.position.x * 100) / 100,
      y: Math.round(player.position.y * 100) / 100,
      z: Math.round(player.position.z * 100) / 100,
      label: 'Marker ' + (debugMarkers.length + 1)
    };
    debugMarkers.push(pos);

    if (typeof THREE !== 'undefined' && scene) {
      var geo = new THREE.SphereGeometry(0.15, 8, 8);
      var mat = new THREE.MeshBasicMaterial({ color: 0xd4a053 });
      var sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(pos.x, pos.y - player.height + 0.5, pos.z);
      scene.add(sphere);
      debugSprites.push(sphere);
    }

    updateDebugPanel();
  }

  function updateDebugPanel() {
    var panel = document.getElementById('debugPanel');
    var list = document.getElementById('debugMarkerList');
    if (!panel || !list) return;

    panel.classList.add('visible');
    list.innerHTML = debugMarkers.map(function(m, i) {
      return '<div class="debug-marker" onclick="console.log(JSON.stringify(PRES._debugMarkers[' + i + ']))">' +
        '#' + (i + 1) + ' — x:' + m.x + ' y:' + m.y + ' z:' + m.z + '</div>';
    }).join('');
  }

  function updateDebugCoords() {
    var el = document.getElementById('debugCoords');
    var player = PRES.player;
    if (!el || !PRES.gameActive) {
      if (el) el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    var p = player.position;
    el.textContent = 'x:' + p.x.toFixed(2) + ' y:' + p.y.toFixed(2) + ' z:' + p.z.toFixed(2);
  }

  // Copy markers to clipboard
  window.copyMarkers = function() {
    var json = JSON.stringify(debugMarkers, null, 2);
    navigator.clipboard.writeText(json).then(function() {
      var btn = document.querySelector('#debugPanel button');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(function() { btn.textContent = 'Copy JSON'; }, 1500); }
    });
  };

  // Debug keyboard shortcuts (capture phase): P = place marker, 1-8 = camera controls
  document.addEventListener('keydown', function(e) {
    if (!PRES.gameActive) return;
    var k = e.key;

    if (k.toLowerCase() === 'p') { placeMarker(); e.preventDefault(); e.stopPropagation(); return; }

    if (k.toLowerCase() === 'm') {
      var json = JSON.stringify(debugMarkers, null, 2);
      navigator.clipboard.writeText(json).then(function() {
        var tut = document.getElementById('gameTutorial');
        if (tut) {
          tut.querySelector('.game-tutorial-text').textContent = '📋 ' + debugMarkers.length + ' markers copied to clipboard!';
          setTimeout(function() {
            tut.querySelector('.game-tutorial-text').textContent = 'Walk around to explore. Press P to place markers, M to copy them.';
          }, 2000);
        }
      });
      e.preventDefault(); e.stopPropagation(); return;
    }

    var step = 0.5;
    var changed = false;
    if (k === '1') { window._camDist = Math.max(1, (window._camDist || 4) - step); changed = true; }
    if (k === '2') { window._camDist = Math.min(15, (window._camDist || 4) + step); changed = true; }
    if (k === '3') { window._camHeight = Math.max(0.5, (window._camHeight || 2.5) - step); changed = true; }
    if (k === '4') { window._camHeight = Math.min(10, (window._camHeight || 2.5) + step); changed = true; }
    if (k === '5') { window._camFov = Math.max(40, (window._camFov || 75) - 5); changed = true; }
    if (k === '6') { window._camFov = Math.min(120, (window._camFov || 75) + 5); changed = true; }
    if (k === '7') { window._moveSpeed = Math.max(1, (window._moveSpeed || 5) - 0.5); changed = true; }
    if (k === '8') { window._moveSpeed = Math.min(15, (window._moveSpeed || 5) + 0.5); changed = true; }

    if (changed) {
      var dv = document.getElementById('camDistVal');
      var hv = document.getElementById('camHeightVal');
      var fv = document.getElementById('camFovVal');
      var sv = document.getElementById('camSpeedVal');
      if (dv) dv.textContent = (window._camDist || 4);
      if (hv) hv.textContent = (window._camHeight || 2.5);
      if (fv) fv.textContent = (window._camFov || 75);
      if (sv) sv.textContent = (window._moveSpeed || 5);
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Export to PRES
  PRES.createInfoPoints = createInfoPoints;
  PRES.updateInfoPoints = updateInfoPoints;
  PRES.openInfoPanel = openInfoPanel;
  PRES.closeInfoPanel = closeInfoPanel;
  PRES.nearbyInfoPoint = null;
  PRES.activeInfoPanel = false;
  PRES.infoPointMeshes = infoPointMeshes;
  PRES.createDeadline = createDeadline;
  PRES.updateDeadline = updateDeadline;
  PRES.deadlineObj = null;
  PRES.deadlinePos = null;
  PRES.updateDebugCoords = updateDebugCoords;
  PRES._debugMarkers = debugMarkers;
})();
