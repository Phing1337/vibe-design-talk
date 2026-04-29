/**
 * game-controller.js — Player State, Game Mode, Movement, Mouse Look
 *
 * Handles: activateGameMode, deactivateGameMode, updateGame,
 * mouse look, WASD key handlers (capture phase), collision detection,
 * camera toggle.
 *
 * Exports to PRES: gameActive, player, keys, activateGameMode,
 * deactivateGameMode, updateGame
 *
 * Depends on: PRES.scene, PRES.camera, PRES.controls,
 * PRES.apartmentModel, PRES.collisionRaycaster, PRES.marvModel,
 * PRES.apartmentFloorY, PRES.next, PRES.createInfoPoints,
 * PRES.createDeadline, PRES.updateDeadline, PRES.updateInfoPoints,
 * PRES.updateDebugCoords, PRES.closeInfoPanel, PRES.nearbyInfoPoint,
 * PRES.activeInfoPanel, PRES.openInfoPanel, PRES.deadlineObj
 */
(function() {
  'use strict';

  var gameActive = false;
  var thirdPerson = false;
  var lastGameTime = 0;
  var pointerLockJustActivated = false;

  var player = {
    position: null,
    velocity: null,
    rotation: { yaw: 0, pitch: 0 },
    speed: 5,
    jumpForce: 8,
    gravity: -20,
    onGround: true,
    height: 1.6,
  };

  var keys = { w: false, a: false, s: false, d: false, space: false, shift: false };

  function getGroundHeight(position) {
    var apartmentModel = PRES.apartmentModel;
    var collisionRaycaster = PRES.collisionRaycaster;
    if (!apartmentModel || !collisionRaycaster) return null;
    var origin = new THREE.Vector3(position.x, position.y + 0.3, position.z);
    collisionRaycaster.set(origin, new THREE.Vector3(0, -1, 0));
    collisionRaycaster.far = 20;
    var intersects = collisionRaycaster.intersectObject(apartmentModel, true);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
    return null;
  }

  function checkWallCollision(position, direction) {
    var apartmentModel = PRES.apartmentModel;
    var collisionRaycaster = PRES.collisionRaycaster;
    if (!apartmentModel || !collisionRaycaster) return false;
    var origin = new THREE.Vector3(position.x, position.y - 0.3, position.z);
    collisionRaycaster.set(origin, direction.normalize());
    collisionRaycaster.far = 0.8;
    var intersects = collisionRaycaster.intersectObject(apartmentModel, true);
    if (intersects.length > 0) return true;
    origin.y = position.y - 1.0;
    collisionRaycaster.set(origin, direction.normalize());
    var intersects2 = collisionRaycaster.intersectObject(apartmentModel, true);
    return intersects2.length > 0;
  }

  function activateGameMode() {
    var camera = PRES.camera;
    var controls = PRES.controls;
    gameActive = true;
    PRES.gameActive = true;

    var canvas = document.getElementById('three-canvas');
    canvas.requestPointerLock();

    if (controls) {
      controls.enabled = false;
      controls.autoRotate = false;
    }

    document.getElementById('crosshair').classList.add('visible');

    var apartmentModel = PRES.apartmentModel;
    if (apartmentModel) {
      var box = new THREE.Box3().setFromObject(apartmentModel);
      var center = box.getCenter(new THREE.Vector3());
      player.position.set(center.x, box.min.y + player.height + 0.5, center.z);
    }

    player.velocity.set(0, 0, 0);
    player.rotation.yaw = 0;
    player.rotation.pitch = 0;
    player.onGround = false;
    thirdPerson = false;

    keys.w = false; keys.a = false; keys.s = false; keys.d = false; keys.space = false; keys.shift = false;

    var dp = document.getElementById('debugPanel');
    if (dp) dp.classList.add('visible');

    camera.position.copy(player.position);
    camera.rotation.set(0, 0, 0);

    lastGameTime = performance.now();

    if (PRES.createInfoPoints) PRES.createInfoPoints();
    if (PRES.createDeadline) PRES.createDeadline();
    var deadlineObj = PRES.deadlineObj;
    if (deadlineObj) { deadlineObj.visible = true; PRES.deadlinePos = null; }
  }

  function deactivateGameMode() {
    gameActive = false;
    PRES.gameActive = false;
    if (PRES.closeInfoPanel) PRES.closeInfoPanel();
    document.exitPointerLock();
    document.getElementById('crosshair').classList.remove('visible');

    var ip = document.getElementById('infoPrompt');
    if (ip) ip.style.opacity = '0';

    var dp = document.getElementById('debugPanel');
    if (dp) dp.classList.remove('visible');
    var dc = document.getElementById('debugCoords');
    if (dc) dc.style.display = 'none';

    if (window._spotlight) window._spotlight.visible = false;

    var deadlineObj = PRES.deadlineObj;
    if (deadlineObj) deadlineObj.visible = false;

    var marvModel = PRES.marvModel;
    if (marvModel) marvModel.visible = false;

    keys.w = false; keys.a = false; keys.s = false; keys.d = false; keys.space = false; keys.shift = false;
  }

  function toggleCamera() {
    thirdPerson = !thirdPerson;
    var marvModel = PRES.marvModel;
    if (marvModel) {
      marvModel.visible = thirdPerson;
    }
  }

  function updateGame() {
    if (!gameActive) return;
    if (!player.position) return;

    var camera = PRES.camera;
    var now = performance.now();
    var dt = Math.min((now - lastGameTime) / 1000, 0.05);
    lastGameTime = now;

    var forward = new THREE.Vector3(
      -Math.sin(player.rotation.yaw),
      0,
      -Math.cos(player.rotation.yaw)
    );
    var right = new THREE.Vector3(
      Math.cos(player.rotation.yaw),
      0,
      -Math.sin(player.rotation.yaw)
    );

    var moveDir = new THREE.Vector3(0, 0, 0);
    if (keys.w) moveDir.add(forward);
    if (keys.s) moveDir.sub(forward);
    if (keys.d) moveDir.add(right);
    if (keys.a) moveDir.sub(right);

    if (moveDir.length() > 0) {
      var speed = window._moveSpeed || player.speed;
      var step = moveDir.normalize().multiplyScalar(speed * dt);
      if (!checkWallCollision(player.position, moveDir.clone())) {
        player.position.add(step);
      }
    }

    if (keys.space && player.onGround) {
      player.velocity.y = player.jumpForce;
      player.onGround = false;
    }

    player.velocity.y += player.gravity * dt;
    player.position.y += player.velocity.y * dt;

    var groundY = getGroundHeight(player.position);
    var apartmentFloorY = PRES.apartmentFloorY || 0;
    var groundLevel = groundY !== null ? groundY + player.height :
      (apartmentFloorY + player.height);

    if (player.position.y <= groundLevel) {
      player.position.y = groundLevel;
      player.velocity.y = 0;
      player.onGround = true;
    } else if (player.onGround && groundY !== null) {
      var dropDist = player.position.y - (groundY + player.height);
      if (dropDist > 0 && dropDist < 1.5) {
        player.position.y -= dropDist * 0.4;
      } else if (dropDist >= 1.5) {
        player.onGround = false;
      }
    }

    var camFov = window._camFov || 75;
    if (camera.fov !== camFov) {
      camera.fov = camFov;
      camera.updateProjectionMatrix();
    }
    camera.position.set(player.position.x, player.position.y, player.position.z);
    camera.quaternion.setFromEuler(new THREE.Euler(player.rotation.pitch, player.rotation.yaw, 0, 'YXZ'));

    if (window._spotlight && window._flashlightOn) {
      window._spotlight.visible = true;
      window._spotlight.position.copy(camera.position);
      var lookDir = new THREE.Vector3(0, 0, -1);
      lookDir.applyQuaternion(camera.quaternion);
      window._spotlight.target.position.copy(camera.position).add(lookDir.multiplyScalar(10));
    } else if (window._spotlight) {
      window._spotlight.visible = false;
    }

    var marvModel = PRES.marvModel;
    if (marvModel) marvModel.visible = false;

    if (PRES.updateDeadline) PRES.updateDeadline();
    if (PRES.updateInfoPoints) PRES.updateInfoPoints();
    if (PRES.updateDebugCoords) PRES.updateDebugCoords();
  }

  // Mouse look
  document.addEventListener('pointerlockchange', function() {
    if (document.pointerLockElement === document.getElementById('three-canvas')) {
      pointerLockJustActivated = true;
      setTimeout(function() { pointerLockJustActivated = false; }, 100);
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (!gameActive) return;
    if (document.pointerLockElement !== document.getElementById('three-canvas')) return;
    if (pointerLockJustActivated) return;

    var mx = Math.max(-20, Math.min(20, e.movementX));
    var my = Math.max(-20, Math.min(20, e.movementY));

    var sensitivity = 0.0015;
    player.rotation.yaw -= mx * sensitivity;
    player.rotation.pitch -= my * sensitivity;
    player.rotation.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, player.rotation.pitch));
  });

  // Key handlers for game (capture phase to intercept before navigation)
  document.addEventListener('keydown', function(e) {
    if (!gameActive) return;

    var key = e.key.toLowerCase();

    if (key in keys) {
      keys[key] = true;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (key === ' ' || e.key === ' ') {
      keys.space = true;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === 'Shift') {
      keys.shift = true;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (key === 'c') {
      toggleCamera();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (key === 'e') {
      if (PRES.activeInfoPanel) {
        if (PRES.closeInfoPanel) PRES.closeInfoPanel();
      } else if (PRES.nearbyInfoPoint !== null) {
        if (PRES.openInfoPanel) PRES.openInfoPanel(PRES.nearbyInfoPoint);
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (key === 'f') {
      window._flashlightOn = !window._flashlightOn;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // ArrowRight exits game mode and lets the presentation advance
    if (e.key === 'ArrowRight') {
      deactivateGameMode();
      return; // Don't stopPropagation — let navigation handle it
    }
    if (e.key === 'Escape') {
      deactivateGameMode();
      e.preventDefault();
      e.stopPropagation();
      if (PRES.next) PRES.next();
      return;
    }
  }, true); // capture phase

  document.addEventListener('keyup', function(e) {
    if (!gameActive) return;
    var key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
    if (key === ' ' || e.key === ' ') keys.space = false;
    if (e.key === 'Shift') keys.shift = false;
  }, true);

  // Click to re-lock pointer when in game mode
  document.addEventListener('click', function(e) {
    if (!gameActive) return;
    var canvas = document.getElementById('three-canvas');
    if (canvas && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  // Export to PRES
  PRES.gameActive = gameActive;
  PRES.player = player;
  PRES.keys = keys;
  PRES.activateGameMode = activateGameMode;
  PRES.deactivateGameMode = deactivateGameMode;
  PRES.updateGame = updateGame;
})();
