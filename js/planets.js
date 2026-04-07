/**
 * planets.js — Space Planets Creation, Show/Hide, Drag Interaction
 *
 * Exports to PRES: spacePlanets, planetVelocities, draggedPlanet,
 * showSpacePlanets, hideSpacePlanets
 *
 * Depends on: PRES.scene, PRES.camera, PRES.current3DMode
 */
(function() {
  'use strict';

  var spacePlanets = [];
  var draggedPlanet = null;
  var dragPlane = null;
  var dragOffset = new THREE.Vector3();
  var mouseNDC = new THREE.Vector2();
  var prevMouseNDC = new THREE.Vector2();
  var planetVelocities = [];
  var dragRaycaster = new THREE.Raycaster();

  function createSpacePlanets() {
    var scene = PRES.scene;
    if (typeof THREE === 'undefined' || !scene) return;
    if (spacePlanets.length > 0) return;

    var planetData = [
      { radius: 1.8, detail: 1, color: 0x5b8aaf, emissive: 0x1a2838, orbitR: 14, speed: 0.02, offset: 0, y: 0 },
      { radius: 0.8, detail: 1, color: 0xd4a053, emissive: 0x4a3518, orbitR: 8, speed: 0.04, offset: 1.5, y: 4 },
      { radius: 1.4, detail: 1, color: 0x6b4a8a, emissive: 0x1a1028, orbitR: 18, speed: 0.01, offset: 3.8, y: -4 },
      { radius: 0.35, detail: 0, color: 0xe85d3a, emissive: 0x3a1510, orbitR: 6, speed: 0.07, offset: 0.5, y: 3 },
      { radius: 1.1, detail: 1, color: 0x2dd4bf, emissive: 0x0a3a32, orbitR: 12, speed: 0.025, offset: 5, y: -3 },
    ];

    var positions = [
      { x: -8, y: 0, z: 3 },
      { x: 6, y: 4, z: -2 },
      { x: 9, y: -4, z: 6 },
      { x: -3, y: 3, z: -4 },
      { x: -6, y: -3, z: 2 },
    ];

    planetData.forEach(function(d) {
      var geo = new THREE.IcosahedronGeometry(d.radius, d.detail);
      var mat = new THREE.MeshPhongMaterial({
        color: d.color,
        emissive: d.emissive,
        flatShading: true,
        shininess: 20
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.visible = false;
      var pos = positions[spacePlanets.length] || { x: 0, y: 0, z: 0 };
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      spacePlanets.push({
        mesh: mesh,
        orbitRadius: d.orbitR,
        orbitSpeed: d.speed,
        orbitOffset: d.offset,
        baseY: d.y
      });
      planetVelocities.push({ vx: 0, vy: 0, free: false, returnTimer: 0 });
    });

    // Ring around purple planet
    var ringGeo = new THREE.RingGeometry(1.8, 2.3, 32);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    spacePlanets[2].mesh.add(ring);

    // White shadow-receiving floor plane (invisible bg, just catches shadows)
    var floorGeo = new THREE.PlaneGeometry(60, 60);
    var floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -10;
    floor.receiveShadow = true;
    floor.visible = false;
    scene.add(floor);
    PRES.planetFloor = floor;

    // Update PRES references
    PRES.spacePlanets = spacePlanets;
    PRES.planetVelocities = planetVelocities;
  }

  function showSpacePlanets() {
    if (spacePlanets.length === 0) createSpacePlanets();
    spacePlanets.forEach(function(p) { p.mesh.visible = true; });
    if (PRES.planetFloor) PRES.planetFloor.visible = true;
  }

  function hideSpacePlanets() {
    spacePlanets.forEach(function(p) { p.mesh.visible = false; });
    if (PRES.planetFloor) PRES.planetFloor.visible = false;
  }

  // Planet click-to-drag event handlers
  (function initPlanetDrag() {
    var threeCanvas = document.getElementById('three-canvas');
    if (!threeCanvas) return;

    threeCanvas.addEventListener('mousedown', function(e) {
      if (PRES.current3DMode !== 'space') return;
      // space-mode class is omitted for slide-primitives (light bg) — use current3DMode only

      var camera = PRES.camera;
      if (!camera) return;

      var rect = threeCanvas.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      prevMouseNDC.copy(mouseNDC);

      dragRaycaster.setFromCamera(mouseNDC, camera);
      var meshes = spacePlanets.map(function(p) { return p.mesh; });
      var hits = dragRaycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        var hitMesh = hits[0].object;
        for (var i = 0; i < spacePlanets.length; i++) {
          if (spacePlanets[i].mesh === hitMesh) {
            draggedPlanet = i;
            PRES.draggedPlanet = i;
            break;
          }
        }
        var planeNormal = new THREE.Vector3(0, 0, 1);
        var planePoint = new THREE.Vector3(0, 0, hitMesh.position.z);
        dragPlane = new THREE.Plane();
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);

        var intersectPoint = new THREE.Vector3();
        dragRaycaster.ray.intersectPlane(dragPlane, intersectPoint);
        dragOffset.copy(hitMesh.position).sub(intersectPoint);

        planetVelocities[draggedPlanet].free = true;
        planetVelocities[draggedPlanet].vx = 0;
        planetVelocities[draggedPlanet].vy = 0;
        planetVelocities[draggedPlanet].returnTimer = 0;
        threeCanvas.style.cursor = 'grabbing';
      }
    });

    threeCanvas.addEventListener('mousemove', function(e) {
      if (PRES.current3DMode !== 'space') return;
      var camera = PRES.camera;
      if (!camera) return;

      var rect = threeCanvas.getBoundingClientRect();
      prevMouseNDC.copy(mouseNDC);
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (draggedPlanet !== null && dragPlane) {
        dragRaycaster.setFromCamera(mouseNDC, camera);
        var intersectPoint = new THREE.Vector3();
        if (dragRaycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
          spacePlanets[draggedPlanet].mesh.position.x = intersectPoint.x + dragOffset.x;
          spacePlanets[draggedPlanet].mesh.position.y = intersectPoint.y + dragOffset.y;
        }
      }
    });

    function releasePlanet() {
      if (draggedPlanet !== null) {
        var dx = mouseNDC.x - prevMouseNDC.x;
        var dy = mouseNDC.y - prevMouseNDC.y;
        planetVelocities[draggedPlanet].vx = dx * 120;
        planetVelocities[draggedPlanet].vy = dy * 120;
        draggedPlanet = null;
        PRES.draggedPlanet = null;
        dragPlane = null;
        threeCanvas.style.cursor = 'grab';
      }
    }

    threeCanvas.addEventListener('mouseup', releasePlanet);
    threeCanvas.addEventListener('mouseleave', releasePlanet);
  })();

  // Export to PRES
  PRES.spacePlanets = spacePlanets;
  PRES.planetVelocities = planetVelocities;
  PRES.draggedPlanet = null;
  PRES.showSpacePlanets = showSpacePlanets;
  PRES.hideSpacePlanets = hideSpacePlanets;

  // Animate planets to right-side composed positions (called by layout-compose)
  PRES.composePlanets = function() {
    var targets = [
      { x: 5.5, y:  2.5 },
      { x: 7.5, y: -1.5 },
      { x: 6.0, y:  4.0 },
      { x: 8.5, y: -3.0 },
      { x: 4.5, y:  0.5 },
    ];
    spacePlanets.forEach(function(p, i) {
      var pv = planetVelocities[i];
      if (!pv) return;
      pv.free    = true;
      pv.falling = false;
      pv.vx      = 0;
      pv.vy      = 0;
      pv.toX     = targets[i] ? targets[i].x : 5;
      pv.toY     = targets[i] ? targets[i].y : 0;
    });
  };

  // Reset planets back to orbits (called when leaving compose slide)
  PRES.deComposePlanets = function() {
    planetVelocities.forEach(function(pv) {
      if (!pv) return;
      delete pv.toX; delete pv.toY;
      pv.free = false; pv.falling = false; pv.vx = 0; pv.vy = 0;
    });
  };
})();
