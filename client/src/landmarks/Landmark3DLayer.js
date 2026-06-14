import maplibregl from "maplibre-gl";
import * as THREE from "three";
import { createLandmarkMesh } from "./meshes.js";

const ROT_X = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
const BEAM_ORANGE = new THREE.Color("#ff5a1f");

function beamHeightM(lm, zoom, active = false) {
  const base = Math.min(Math.max((lm.heightM || 80) * 0.32, 160), 580);
  let h = base;
  if (zoom < 11) h *= 2.4;
  else if (zoom < 13) h *= 1.85;
  else if (zoom < 15) h *= 1.35;
  if (active) h *= 1.15;
  return h;
}

function createLightBeam(lm, active = false) {
  const group = new THREE.Group();
  const tint = lm.color ? new THREE.Color(lm.color) : BEAM_ORANGE;
  const beamH = beamHeightM(lm, 14, active);
  const baseR = beamH * 0.028 * (active ? 1.1 : 1);

  const coneGeo = new THREE.CylinderGeometry(beamH * 0.002, baseR * 1.8, beamH, 24, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: tint,
    transparent: true,
    opacity: active ? 0.08 : 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = beamH / 2;
  group.add(cone);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(baseR * 0.3, baseR * 0.95, 32),
    new THREE.MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: active ? 0.12 : 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.4;
  group.add(ring);

  group.userData = { coneMat, ring: ring.material, beamH };
  return group;
}

function createLandmarkGroup(lm) {
  const root = new THREE.Group();
  const mesh = createLandmarkMesh(lm.shape, lm);
  const meshScale = lm.catalog ? 0.5 : 0.42;
  mesh.scale.set(meshScale, meshScale, meshScale);
  root.add(mesh);

  const beam = createLightBeam(lm);
  root.add(beam);

  root.userData = {
    mesh,
    beam,
    beamH: beam.userData.beamH,
    coneMat: beam.userData.coneMat,
    ring: beam.userData.ring,
  };
  return root;
}

/**
 * MapLibre custom layer — 3D place silhouettes + light beams at stop coordinates.
 */
export function createLandmark3DLayer() {
  let map = null;
  let renderer = null;
  let camera = null;
  let landmarks = [];
  let visible = true;
  let activeKey = null;
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
        const group = createLandmarkGroup(lm);
        const merc = maplibregl.MercatorCoordinate.fromLngLat([lm.lng, lm.lat], 0);
        landmarks.push({ lm, group, merc, key: String(lm.stopId ?? lm.id) });
      }
    },

    setActiveLandmark(id) {
      activeKey = id == null ? null : String(id);
      map?.triggerRepaint();
    },

    setVisible(v) {
      visible = v;
    },

    render(_gl, args) {
      if (!visible || landmarks.length === 0 || !renderer) return;

      const zoom = map.getZoom();
      if (zoom < 12) return;

      const pulse = 0.88 + Math.sin((performance.now() - t0) * 0.0022) * 0.12;
      const base = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
      renderer.resetState();

      for (const { group, merc, lm, key } of landmarks) {
        const isActive = activeKey != null && key === activeKey;
        const { coneMat, ring, mesh, beam, beamH } = group.userData;
        const targetH = beamHeightM(lm, zoom, isActive);
        if (beam && beamH) {
          beam.scale.set(1, targetH / beamH, 1);
        }
        if (coneMat) coneMat.opacity = (isActive ? 0.09 : 0.055) * pulse;
        if (ring) ring.opacity = (isActive ? 0.14 : 0.09) * pulse;
        if (mesh) {
          const s = (lm.catalog ? 0.5 : 0.42) * (isActive ? 1.15 : 1);
          mesh.scale.set(s, s, s);
        }

        const scale = merc.meterInMercatorCoordinateUnits();
        const translate = new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z || 0);
        const scaleMat = new THREE.Matrix4().makeScale(scale, -scale, scale);
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
