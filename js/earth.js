/**
 * earth.js — Earth Creation, Show/Hide, Render Loop
 *
 * Exports to PRES: earthGroup, showEarth, hideEarth
 *
 * Depends on: PRES.scene
 */
(function() {
  'use strict';

  var earthGroup = null;

  function createEarth() {
    var scene = PRES.scene;
    if (typeof THREE === 'undefined' || !scene) return;
    if (earthGroup) return;

    earthGroup = new THREE.Group();
    earthGroup.visible = false;

    // Planet body — low poly icosahedron with land/ocean colors
    var earthGeo = new THREE.IcosahedronGeometry(12, 3);
    var colors = [];
    var positions = earthGeo.attributes.position;
    for (var i = 0; i < positions.count; i++) {
      var y = positions.getY(i);
      var x = positions.getX(i);
      var z = positions.getZ(i);
      var n = Math.sin(x * 2.5) * Math.cos(z * 2.5) + Math.sin(y * 3.0) * 0.5;
      if (n > 0.1) {
        var g = 0.25 + Math.random() * 0.15;
        colors.push(0.15 + Math.random() * 0.1, g, 0.08 + Math.random() * 0.05);
      } else {
        colors.push(0.1, 0.25 + Math.random() * 0.15, 0.5 + Math.random() * 0.2);
      }
    }
    earthGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    var earthMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      flatShading: true,
      shininess: 30
    });
    var earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    earthGroup.add(earthMesh);
    earthGroup.userData.planet = earthMesh;

    // Clouds layer
    var cloudGeo = new THREE.IcosahedronGeometry(12.4, 3);
    var cloudMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      flatShading: true,
      side: THREE.DoubleSide
    });
    var cloudPositions = cloudGeo.attributes.position;
    var cloudAlphas = [];
    for (var j = 0; j < cloudPositions.count; j++) {
      cloudAlphas.push(Math.random() > 0.5 ? 1 : 0, Math.random() > 0.5 ? 1 : 0, Math.random() > 0.5 ? 1 : 0);
    }
    cloudGeo.setAttribute('color', new THREE.Float32BufferAttribute(cloudAlphas, 3));
    cloudMat.vertexColors = true;
    var cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);
    earthGroup.userData.clouds = cloudMesh;

    // Atmosphere glow
    var atmosGeo = new THREE.IcosahedronGeometry(13, 2);
    var atmosMat = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    var atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmosMesh);

    // Outer glow ring
    var glowGeo = new THREE.IcosahedronGeometry(14, 1);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide
    });
    var glowMesh = new THREE.Mesh(glowGeo, glowMat);
    earthGroup.add(glowMesh);

    scene.add(earthGroup);
    PRES.earthGroup = earthGroup;
  }

  function showEarth() {
    if (!earthGroup) createEarth();
    if (earthGroup) earthGroup.visible = true;
  }

  function hideEarth() {
    if (earthGroup) earthGroup.visible = false;
  }

  // Export to PRES
  PRES.earthGroup = null;
  PRES.showEarth = showEarth;
  PRES.hideEarth = hideEarth;
})();
