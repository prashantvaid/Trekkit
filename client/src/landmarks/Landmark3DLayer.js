import maplibregl from "maplibre-gl";
import * as THREE from "three";

const ROT_X = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
const BEAM_ORANGE = new THREE.Color("#fc4c02");
const BEAM_CORE = new THREE.Color("#fff0d8");

function beamHeightM(lm, zoom) {
  const base = Math.min(Math.max((lm.heightM || 80) * 0.12, 55), 220);
  if (zoom < 11) return base * 1.8;
  if (zoom < 13) return base * 1.3;
  return base;
}

function createLightBeam(lm) {
  const group = new THREE.Group();
  const tint = lm.color ? new THREE.Color(lm.color) : BEAM_ORANGE;
  const beamH = beamHeightM(lm, 14);
  const baseR = beamH * 0.055;

  const coneGeo = new THREE.CylinderGeometry(beamH * 0.003, baseR * 2.2, beamH, 20, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: tint,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = beamH / 2;
  group.add(cone);

  const coreGeo = new THREE.CylinderGeometry(beamH * 0.0015, baseR * 0.55, beamH * 0.96, 10, 1, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: BEAM_CORE,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = beamH / 2;
  group.add(core);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(baseR * 0.35, baseR * 1.15, 32),
    new THREE.MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.4;
  group.add(ring);

  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(baseR * 0.28, 16),
    new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.85, depthWrite: false })
  );
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = 0.25;
  group.add(dot);

  group.userData = { coneMat, coreMat, ring: ring.material, beamH };
  return group;
}

/**
 * MapLibre custom layer — glowing light beams at landmark coordinates.
 */
export function createLandmark3DLayer() {
  let map = null;
  let renderer = null;
  let camera = null;
  let landmarks = [];
  let visible = true;
  let t0 = 0;

  const layer = {
    id: "landmark-3d-models",
    type: "custom",
    renderingMode: "3d",

    onAdd(m, gl) {
      map = m;
      t0 = performance.now();
      camera = new THREE.Camera();
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
    },

    setLandmarks(items) {
      landmarks.forEach(({ group }) => {
        group.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((x) => x.dispose());
            else obj.material.dispose();
          }
        });
      });
      landmarks = [];

      for (const lm of items) {
        const group = createLightBeam(lm);
        const merc = maplibregl.MercatorCoordinate.fromLngLat([lm.lng, lm.lat], 0);
        landmarks.push({ lm, group, merc });
      }
    },

    setVisible(v) {
      visible = v;
    },

    render(_gl, args) {
      if (!visible || landmarks.length === 0 || !renderer) return;

      const zoom = map.getZoom();
      if (zoom < 9) return;

      const pulse = 0.88 + Math.sin((performance.now() - t0) * 0.0022) * 0.12;
      const base = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
      renderer.resetState();

      for (const { group, merc, lm } of landmarks) {
        const { coneMat, coreMat, ring } = group.userData;
        if (coneMat) coneMat.opacity = 0.28 * pulse;
        if (coreMat) coreMat.opacity = 0.45 * pulse;
        if (ring) ring.opacity = 0.5 * pulse;

        const scale = merc.meterInMercatorCoordinateUnits();
        const hScale = beamHeightM(lm, zoom) / (group.userData.beamH || 80);
        const translate = new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z || 0);
        const scaleMat = new THREE.Matrix4().makeScale(scale, -scale * hScale, scale);
        camera.projectionMatrix = base.clone().multiply(translate).multiply(ROT_X).multiply(scaleMat);
        renderer.render(group, camera);
      }

      map.triggerRepaint();
    },

    onRemove() {
      this.setLandmarks([]);
      renderer = null;
      camera = null;
      map = null;
    },
  };

  return layer;
}
