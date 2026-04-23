/**
 * three-setup.js — Three.js Scene Init, Model Loading, Render Loop
 *
 * Handles: scene, camera, renderer, lights, controls, model loading
 * (apartment, sputnik, marv), autoScaleModel, onWindowResize,
 * animate render loop, update3DVisibility.
 *
 * Exports to PRES: scene, camera, renderer, controls, threeReady,
 * apartmentModel, sputnikModel, marvModel, canvasVisible,
 * current3DMode, update3DVisibility, apartmentFloorY,
 * collisionRaycaster, initThreeJS
 *
 * Depends on (lazy): PRES.gameActive, PRES.activateGameMode,
 * PRES.deactivateGameMode, PRES.updateGame, PRES.player,
 * PRES.showSpacePlanets, PRES.hideSpacePlanets,
 * PRES.spacePlanets, PRES.planetVelocities, PRES.draggedPlanet,
 * PRES.showEarth, PRES.hideEarth, PRES.earthGroup,
 * PRES.loadMarv, PRES.currentIndex, PRES.slides
 */
(function() {
  'use strict';

  var scene, camera, renderer, controls;
  var apartmentModel = null;
  var sputnikModel = null;
  var marvModel = null;
  var kitchenModel = null;
  var threeReady = false;
  var canvasVisible = false;
  var current3DMode = null;
  var apartmentFloorY = 0;
  var collisionRaycaster = null;

  function autoScaleModel(model, targetSize) {
    var box = new THREE.Box3().setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return;
    var scale = targetSize / maxDim;
    model.scale.multiplyScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
  }

  // Hide game info point meshes (spheres + rings from voxel level)
  function hideInfoPoints() {
    var meshes = PRES.infoPointMeshes || [];
    meshes.forEach(function(ip) {
      if (ip.sphere) ip.sphere.visible = false;
      if (ip.ring) ip.ring.visible = false;
    });
    // Also hide the deadline object
    if (PRES.deadlineObj) PRES.deadlineObj.visible = false;
  }

  function loadApartmentModel() {
    if (typeof THREE.MTLLoader === 'undefined' || typeof THREE.OBJLoader === 'undefined') return;

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('assets/2024-talk/extracted/');
    mtlLoader.load('apt-11.mtl', function(materials) {
      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('assets/2024-talk/extracted/');
      objLoader.load('apt-11.obj', function(object) {
        var textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/2024-talk/extracted/apt-11.png', function(texture) {
          texture.flipY = true;
          object.traverse(function(child) {
            if (child.isMesh) {
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(function(mat) {
                    if (!mat.map) mat.map = texture;
                  });
                } else {
                  if (!child.material.map) child.material.map = texture;
                }
              }
            }
          });
        }, undefined, function() {});

        autoScaleModel(object, 10);
        object.traverse(function(child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        object.visible = false;
        scene.add(object);
        apartmentModel = object;
        PRES.apartmentModel = apartmentModel;

        var aBox = new THREE.Box3().setFromObject(object);
        apartmentFloorY = aBox.min.y;
        PRES.apartmentFloorY = apartmentFloorY;

        camera.position.set(0, 2, 0);
        controls.target.set(2, 1, 2);
        controls.update();

        update3DVisibility(PRES.currentIndex);
      }, undefined, function(err) {
        console.warn('Apartment OBJ load error:', err);
      });
    }, undefined, function(err) {
      console.warn('Apartment MTL load error:', err);
    });
  }

  function loadSputnikModel() {
    if (typeof THREE.MTLLoader === 'undefined' || typeof THREE.OBJLoader === 'undefined') return;

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('assets/2024-talk/extracted/');
    mtlLoader.load('sputnik.mtl', function(materials) {
      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('assets/2024-talk/extracted/');
      objLoader.load('sputnik.obj', function(object) {
        var textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/2024-talk/extracted/sputnik.png', function(texture) {
          texture.flipY = true;
          object.traverse(function(child) {
            if (child.isMesh) {
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(function(mat) {
                    if (!mat.map) mat.map = texture;
                  });
                } else {
                  if (!child.material.map) child.material.map = texture;
                }
              }
            }
          });
        }, undefined, function() {});

        autoScaleModel(object, 1.5);
        object.position.set(3, 2.5, -2);
        object.visible = false;
        scene.add(object);
        sputnikModel = object;
        PRES.sputnikModel = sputnikModel;

        update3DVisibility(PRES.currentIndex);
      }, undefined, function(err) {
        console.warn('Sputnik OBJ load error:', err);
      });
    }, undefined, function(err) {
      console.warn('Sputnik MTL load error:', err);
    });
  }

  function loadMarv() {
    if (typeof THREE === 'undefined') return;
    if (typeof THREE.MTLLoader === 'undefined' || typeof THREE.OBJLoader === 'undefined') return;

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('assets/2024-talk/extracted/');
    mtlLoader.load('marv-0.mtl', function(materials) {
      materials.preload();
      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('assets/2024-talk/extracted/');
      objLoader.load('marv-0.obj', function(obj) {
        var box = new THREE.Box3().setFromObject(obj);
        var size = box.getSize(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z);
        var scale = 2.0 / maxDim;
        obj.scale.multiplyScalar(scale);

        var center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center.multiplyScalar(scale));
        obj.position.y = 0;

        marvModel = obj;
        PRES.marvModel = marvModel;
        marvModel.visible = false;
        scene.add(marvModel);
      }, undefined, function(err) {
        console.warn('Marv OBJ load error:', err);
      });
    }, undefined, function(err) {
      console.warn('Marv MTL load error:', err);
    });
  }

  function loadKitchenModel() {
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') return;
    if (kitchenModel) return; // already loaded

    var loader = new THREE.GLTFLoader();
    loader.load('assets/2024-talk/extracted/rustic_kitchen_with_natural_light_collider.glb', function(gltf) {
      var model = gltf.scene;
      
      // Don't scale axes — just center and size it
      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 6 / maxDim;
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      
      model.visible = false;
      model.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
      kitchenModel = model;
      PRES.kitchenModel = model;

      // Log bounding box so we can find the right camera spot
      var newBox = new THREE.Box3().setFromObject(model);
      console.log('Kitchen bounds:', newBox.min, newBox.max, 'center:', newBox.getCenter(new THREE.Vector3()));

      var currentSlide = PRES.slides[PRES.currentIndex];
      if (currentSlide && currentSlide.getAttribute('data-3d') === 'kitchen') {
        model.visible = true;
      }
    }, undefined, function(err) {
      console.warn('Kitchen GLB load error:', err);
    });
  }

  function update3DVisibility(slideIndex) {
    if (!threeReady) return;

    var slides = PRES.slides;
    var slide = slides[slideIndex];
    var canvas = document.getElementById('three-canvas');
    var mode = slide.getAttribute('data-3d');

    // Deactivate game if leaving game slide
    if (PRES.gameActive && mode !== 'game') {
      if (PRES.deactivateGameMode) PRES.deactivateGameMode();
    }

    PRES._prevMode = current3DMode;
    current3DMode = mode;
    PRES.current3DMode = mode;

    // Reset layout-compose interaction when leaving the space slide
    if (mode !== 'space' && PRES.resetLayoutCompose) {
      PRES.resetLayoutCompose();
    }

    if (mode === 'apartment') {
      canvas.classList.add('visible');
      canvasVisible = true;
      PRES.canvasVisible = true;
      if (controls) {
        controls.enabled = true;
        controls.autoRotate = true;
      }
      if (apartmentModel) apartmentModel.visible = true;
      if (sputnikModel) sputnikModel.visible = false;

      camera.position.set(0, 2, 0);
      controls.target.set(2, 1, 2);
      controls.update();

    } else if (mode === 'float') {
      canvas.classList.add('visible');
      canvas.classList.remove('space-mode');
      canvasVisible = true;
      PRES.canvasVisible = true;
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      if (apartmentModel) apartmentModel.visible = false;
      if (sputnikModel) sputnikModel.visible = true;
      if (kitchenModel) kitchenModel.visible = false;
      if (PRES.hideSpacePlanets) PRES.hideSpacePlanets();
      if (PRES.hideEarth) PRES.hideEarth();
      hideInfoPoints();
      renderer.setClearColor(0x000000, 0);

    } else if (mode === 'game') {
      canvas.classList.add('visible');
      canvas.classList.remove('space-mode');
      canvasVisible = true;
      PRES.canvasVisible = true;
      renderer.setClearColor(0x000000, 0);
      if (camera.fov !== 90) { camera.fov = 90; camera.updateProjectionMatrix(); }
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      if (apartmentModel) apartmentModel.visible = true;
      if (sputnikModel) sputnikModel.visible = false;
      if (kitchenModel) kitchenModel.visible = false;
      if (PRES.hideSpacePlanets) PRES.hideSpacePlanets();
      if (PRES.hideEarth) PRES.hideEarth();

      // Make sure the apartment is loaded
      if (!apartmentModel) loadApartmentModel();
      if (!marvModel) loadMarv();

      if (PRES.activateGameMode) PRES.activateGameMode();

    } else if (mode === 'space') {
      canvasVisible = true;
      PRES.canvasVisible = true;
      var isPrimitives = slide.classList.contains('slide-primitives');
      if (isPrimitives) {
        canvas.classList.remove('space-mode');
        canvas.style.transition = 'none';
        canvas.classList.add('visible');
        requestAnimationFrame(function() { canvas.style.transition = ''; });
        if (!PRES._irisActive) {
          renderer.setClearColor(slide.dataset.bg || '#2a2f38', 1);
        }
      } else {
        canvas.classList.add('visible');
        canvas.classList.add('space-mode');
        renderer.setClearColor(0x000000, 0);
      }
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      if (apartmentModel) apartmentModel.visible = false;
      if (sputnikModel) sputnikModel.visible = false;
      if (kitchenModel) kitchenModel.visible = false;
      if (PRES.showSpacePlanets) PRES.showSpacePlanets();
      if (PRES.hideEarth) PRES.hideEarth();
      hideInfoPoints();
      // Reset planets to orbits
      var pv = PRES.planetVelocities;
      if (pv) {
        pv.forEach(function(v) {
          if (v) { v.free = false; v.falling = false; v.vx = 0; v.vy = 0; v.returnTimer = 0; }
        });
      }
      camera.position.set(0, 0, 15);
      camera.lookAt(0, 0, 0);

    } else if (mode === 'space-fall') {
      canvasVisible = true;
      PRES.canvasVisible = true;
      canvas.classList.remove('space-mode');
      var isFallPrim = slide.classList.contains('slide-primitives');
      if (isFallPrim) {
        canvas.style.transition = 'none';
        canvas.classList.add('visible');
        requestAnimationFrame(function() { canvas.style.transition = ''; });
        if (!PRES._irisActive) {
          renderer.setClearColor(slide.dataset.bg || '#eeeee4', 1);
        }
      } else {
        canvas.classList.add('visible');
        renderer.setClearColor(0x000000, 0);
      }
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      if (apartmentModel) apartmentModel.visible = false;
      if (sputnikModel) sputnikModel.visible = false;
      if (kitchenModel) kitchenModel.visible = false;
      if (PRES.hideEarth) PRES.hideEarth();
      hideInfoPoints();
      // Only trigger gravity if coming from 'space' mode (first time falling)
      // If already in space-fall, planets keep their current state
      var prevMode = PRES._prevMode || null;
      if (prevMode === 'space') {
        var sp = PRES.spacePlanets || [];
        var pvf = PRES.planetVelocities || [];
        sp.forEach(function(p, i) {
          if (pvf[i]) {
            pvf[i].free = true;
            pvf[i].vy = 0;
            pvf[i].vx = (Math.random() - 0.5) * 3;
            pvf[i].falling = true;
            pvf[i].returnTimer = 0;
          }
        });
      }

    } else if (mode === 'earth') {
      canvas.classList.add('visible');
      canvas.classList.remove('space-mode');
      canvasVisible = true;
      PRES.canvasVisible = true;
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      if (apartmentModel) apartmentModel.visible = false;
      if (PRES.hideSpacePlanets) PRES.hideSpacePlanets();
      if (PRES.showEarth) PRES.showEarth();
      hideInfoPoints();
      var eg = PRES.earthGroup;
      if (eg) eg.position.set(18, -8, -5);
      if (sputnikModel) {
        sputnikModel.visible = true;
        sputnikModel.scale.set(0.2, 0.2, 0.2);
      }
      if (camera.fov !== 50) { camera.fov = 50; camera.updateProjectionMatrix(); }
      camera.position.set(-5, 4, 16);
      camera.lookAt(5, 0, 0);

    } else if (mode === 'kitchen') {
      canvas.classList.add('visible');
      canvas.classList.remove('space-mode');
      canvasVisible = true;
      PRES.canvasVisible = true;
      if (!kitchenModel) loadKitchenModel();
      if (kitchenModel) {
        kitchenModel.visible = true;
        var box = new THREE.Box3().setFromObject(kitchenModel);
        var center = box.getCenter(new THREE.Vector3());
        camera.position.copy(center);
        controls.target.set(center.x, center.y, center.z - 0.01);
        controls.minDistance = 0;
        controls.maxDistance = 0.1;
        controls.update();
      }
      if (apartmentModel) apartmentModel.visible = false;
      if (sputnikModel) sputnikModel.visible = false;
      if (PRES.hideSpacePlanets) PRES.hideSpacePlanets();
      if (PRES.hideEarth) PRES.hideEarth();
      hideInfoPoints();
      if (controls) {
        controls.enabled = true;
        controls.autoRotate = false;
        controls.enableKeys = false;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.rotateSpeed = 0.5;
      }
      if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); }

    } else {
      canvas.classList.remove('visible', 'space-mode');
      canvasVisible = false;
      PRES.canvasVisible = false;
      renderer.setClearColor(0x000000, 0);
      if (camera && camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      if (apartmentModel) apartmentModel.visible = false;
      if (sputnikModel) sputnikModel.visible = false;
      if (kitchenModel) kitchenModel.visible = false;
      if (marvModel) marvModel.visible = false;
      if (PRES.hideSpacePlanets) PRES.hideSpacePlanets();
      if (PRES.hideEarth) PRES.hideEarth();
      hideInfoPoints();
    }
  }

  /* Render loop */
  function animate() {
    requestAnimationFrame(animate);

    var canvas = document.getElementById('three-canvas');
    if (!canvas || (!canvasVisible && !canvas.classList.contains('visible'))) return;

    if ((current3DMode === 'apartment' || current3DMode === 'kitchen') && controls) {
      controls.update();
    }

    // Float mode: slowly rotate sputnik
    if (current3DMode === 'float' && sputnikModel && sputnikModel.visible) {
      sputnikModel.rotation.y += 0.003;
      sputnikModel.rotation.x += 0.001;
      sputnikModel.position.y = 2.5 + Math.sin(Date.now() * 0.0006) * 0.1;
      sputnikModel.position.x = 3 + Math.sin(Date.now() * 0.0004) * 0.05;
    }

    // Game mode: update player physics
    if (current3DMode === 'game') {
      if (PRES.updateGame) PRES.updateGame();
    }

    // Space mode
    var spacePlanets = PRES.spacePlanets || [];
    if (current3DMode === 'space' && spacePlanets.length > 0) {
      if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); }
      // Lerp camera right when layout-compose is active (planets visually cluster on right)
      var targetCamX = PRES.layoutComposeActive ? 7 : 0;
      camera.position.x += (targetCamX - camera.position.x) * 0.06;
      camera.position.z = 20;
      camera.position.y = 0;
      camera.lookAt(camera.position.x, 0, 0);
    }

    // Space-fall mode
    if (current3DMode === 'space-fall' && spacePlanets.length > 0) {
      if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); }
      camera.position.x = 0;
      camera.position.z = 20;
      camera.position.y = 0;
      camera.lookAt(0, 0, 0);
    }

    // Planet physics for both space and space-fall
    var planetVelocities = PRES.planetVelocities || [];
    var draggedPlanet = PRES.draggedPlanet;
    if ((current3DMode === 'space' || current3DMode === 'space-fall') && spacePlanets.length > 0) {
      var time = Date.now() * 0.001;
      spacePlanets.forEach(function(p, i) {
        var pv = planetVelocities[i];
        if (!pv) return;
        if (i === draggedPlanet) return;

        // Slow rotation
        p.mesh.rotation.y += 0.0008 * (i + 1);

        if (!pv.free) {
          // Orbital motion — smooth circular paths
          var angle = time * p.orbitSpeed + p.orbitOffset;
          p.mesh.position.x = Math.cos(angle) * p.orbitRadius;
          p.mesh.position.z = Math.sin(angle) * p.orbitRadius * 0.3;
          p.mesh.position.y = p.baseY + Math.sin(angle * 0.7) * 1.5;
          return;
        }

        if (pv.free && pv.toX !== undefined) {
          // Smooth glide toward compose target
          p.mesh.position.x += (pv.toX - p.mesh.position.x) * 0.06;
          p.mesh.position.y += (pv.toY - p.mesh.position.y) * 0.06;
          pv.vx = 0; pv.vy = 0;
          if (Math.abs(p.mesh.position.x - pv.toX) < 0.05 &&
              Math.abs(p.mesh.position.y - pv.toY) < 0.05) {
            delete pv.toX; delete pv.toY;
          }
          return;
        }

        if (pv.falling) {
          pv.vy -= 15 * 0.016;
        }

        p.mesh.position.x += pv.vx * 0.016;
        p.mesh.position.y += pv.vy * 0.016;

        var dist = camera.position.z - p.mesh.position.z;
        if (dist <= 0) dist = 1;
        var vFov = camera.fov * Math.PI / 180;
        var visibleHeight = 2 * Math.tan(vFov / 2) * dist;
        var visibleWidth = visibleHeight * camera.aspect;
        var halfW = visibleWidth / 2;
        var halfH = visibleHeight / 2;
        var r = p.mesh.geometry.parameters ? p.mesh.geometry.parameters.radius || 1 : 1;

        if (p.mesh.position.x + r > halfW) { p.mesh.position.x = halfW - r; pv.vx *= -0.7; }
        if (p.mesh.position.x - r < -halfW) { p.mesh.position.x = -halfW + r; pv.vx *= -0.7; }
        if (p.mesh.position.y + r > halfH) { p.mesh.position.y = halfH - r; pv.vy *= -0.7; }
        if (p.mesh.position.y - r < -halfH) {
          p.mesh.position.y = -halfH + r;
          pv.vy *= -0.5;
          pv.vx *= 0.9;
          if (Math.abs(pv.vy) < 0.5) { pv.vy = 0; pv.falling = false; }
        }

        if (!pv.falling) {
          pv.vx *= 0.995;
          pv.vy *= 0.995;
        } else {
          pv.vx *= 0.998;
        }

        if (!pv.falling && Math.abs(pv.vx) < 0.05 && Math.abs(pv.vy) < 0.05) {
          pv.vx = 0;
          pv.vy = 0;
        }
      });
    }

    // Earth mode
    var earthGroup = PRES.earthGroup;
    if (current3DMode === 'earth' && earthGroup) {
      var t = Date.now() * 0.001;
      if (earthGroup.userData.planet) earthGroup.userData.planet.rotation.y += 0.001;
      if (earthGroup.userData.clouds) earthGroup.userData.clouds.rotation.y += 0.0015;

      if (sputnikModel && sputnikModel.visible) {
        var earthPos = earthGroup.position;
        var orbitR = 15;
        sputnikModel.position.x = earthPos.x + Math.cos(t * 0.25) * orbitR;
        sputnikModel.position.z = earthPos.z + Math.sin(t * 0.25) * orbitR * 0.6;
        sputnikModel.position.y = earthPos.y + Math.sin(t * 0.35) * 3 + 5;
        sputnikModel.rotation.y += 0.008;
      }

      camera.position.x = -5 + Math.sin(t * 0.04) * 0.5;
      camera.position.y = 4 + Math.sin(t * 0.03) * 0.3;
      camera.lookAt(5, 0, 0);
    }

    renderer.render(scene, camera);
  }

  function getContainerSize() {
    var container = document.getElementById('slidesContainer');
    if (container) return { w: container.clientWidth, h: container.clientHeight };
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    var size = getContainerSize();
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
    renderer.setSize(size.w, size.h);
  }

  function initThreeJS() {
    var canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
      var size = getContainerSize();
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        90, size.w / size.h, 0.1, 1000
      );
      camera.position.set(0, 2, 0);

      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
      });
      renderer.setSize(size.w, size.h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Lighting
      var ambient = new THREE.AmbientLight(0x303040, 1.2);
      scene.add(ambient);

      var dirLight = new THREE.DirectionalLight(0xfff4e6, 0.8);
      dirLight.position.set(5, 10, 7);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 30;
      dirLight.shadow.camera.left = -10;
      dirLight.shadow.camera.right = 10;
      dirLight.shadow.camera.top = 10;
      dirLight.shadow.camera.bottom = -10;
      dirLight.shadow.bias = -0.002;
      scene.add(dirLight);

      var fillLight = new THREE.DirectionalLight(0xc4d4ff, 0.4);
      fillLight.position.set(-3, 5, -5);
      scene.add(fillLight);

      var pointLight1 = new THREE.PointLight(0xffd4a0, 1.5, 8);
      pointLight1.position.set(0, 3, 0);
      scene.add(pointLight1);

      var pointLight2 = new THREE.PointLight(0xa0c4ff, 1.0, 8);
      pointLight2.position.set(-3, 3, -2);
      scene.add(pointLight2);

      var pointLight3 = new THREE.PointLight(0xffd4a0, 1.0, 8);
      pointLight3.position.set(2, 0, 2);
      scene.add(pointLight3);

      var hemiLight = new THREE.HemisphereLight(0x6688cc, 0x443322, 0.6);
      scene.add(hemiLight);

      var spotlight = new THREE.SpotLight(0xffeedd, 2.5, 20, Math.PI / 4, 0.5, 1.5);
      spotlight.castShadow = true;
      spotlight.shadow.mapSize.width = 512;
      spotlight.shadow.mapSize.height = 512;
      spotlight.shadow.bias = -0.002;
      spotlight.visible = false;
      scene.add(spotlight);
      scene.add(spotlight.target);
      window._spotlight = spotlight;
      window._flashlightOn = true;

      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.enableKeys = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enabled = false;
      controls.minDistance = 1;
      controls.maxDistance = 20;

      threeReady = true;
      PRES.threeReady = true;

      collisionRaycaster = new THREE.Raycaster();
      PRES.collisionRaycaster = collisionRaycaster;

      // Initialize player vectors now that THREE is available
      if (PRES.player) {
        PRES.player.position = new THREE.Vector3(0, 1.5, 0);
        PRES.player.velocity = new THREE.Vector3(0, 0, 0);
      }

      // Export references
      PRES.scene = scene;
      PRES.camera = camera;
      PRES.renderer = renderer;
      PRES.controls = controls;

      // Load models
      loadApartmentModel();
      loadSputnikModel();
      loadMarv();

      // Start render loop
      animate();

      window.addEventListener('resize', onWindowResize);
    } catch (e) {
      console.warn('Three.js init failed:', e);
    }
  }

  // Export to PRES
  PRES.initThreeJS = initThreeJS;
  PRES.update3DVisibility = update3DVisibility;
  PRES.apartmentFloorY = apartmentFloorY;
  PRES.canvasVisible = canvasVisible;
  PRES.current3DMode = current3DMode;
})();
