import * as THREE from "three";

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: opts.metalness ?? 0.15,
    roughness: opts.roughness ?? 0.65,
    ...opts,
  });
}

function addMesh(group, geometry, material, y = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function createLandmarkMesh(shape, { heightM = 60, spanM = 200, color = "#a8a098" } = {}) {
  const group = new THREE.Group();
  const h = Math.max(heightM, 8);
  const base = mat(color);
  const accent = mat(color, { roughness: 0.45, metalness: 0.25 });
  const stone = mat("#c8c0b8", { roughness: 0.85 });

  switch (shape) {
    case "eiffel": {
      const legH = h * 0.88;
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(h * 0.04, legH, h * 0.04), accent);
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        leg.position.set(Math.cos(a) * h * 0.12, legH / 2, Math.sin(a) * h * 0.12);
        leg.rotation.y = -a;
        leg.rotation.z = 0.12;
        group.add(leg);
      }
      addMesh(group, new THREE.BoxGeometry(h * 0.22, h * 0.04, h * 0.22), accent, legH * 0.55);
      addMesh(group, new THREE.BoxGeometry(h * 0.12, h * 0.04, h * 0.12), accent, legH * 0.78);
      addMesh(group, new THREE.CylinderGeometry(h * 0.01, h * 0.025, h * 0.2, 8), accent, h * 0.92);
      break;
    }
    case "bridge": {
      const span = spanM || 300;
      const towerH = h * 0.85;
      addMesh(group, new THREE.BoxGeometry(span, h * 0.03, h * 0.08), base, towerH * 0.55);
      for (const x of [-span * 0.38, span * 0.38]) {
        addMesh(group, new THREE.BoxGeometry(h * 0.06, towerH, h * 0.06), accent, towerH / 2);
        group.children.at(-1).position.x = x;
      }
      const cable = new THREE.Mesh(
        new THREE.TorusGeometry(span * 0.42, h * 0.008, 6, 32, Math.PI),
        accent
      );
      cable.rotation.y = Math.PI / 2;
      cable.position.y = towerH * 0.92;
      group.add(cable);
      break;
    }
    case "lattice":
    case "tower": {
      addMesh(group, new THREE.CylinderGeometry(h * 0.06, h * 0.1, h * 0.92, 8), accent, h * 0.46);
      addMesh(group, new THREE.CylinderGeometry(h * 0.02, h * 0.06, h * 0.08, 8), accent, h * 0.96);
      break;
    }
    case "spire":
    case "artdeco": {
      const tiers = shape === "artdeco" ? 4 : 3;
      for (let i = 0; i < tiers; i++) {
        const t = 1 - i / tiers;
        const rh = h * (0.22 / tiers);
        addMesh(
          group,
          new THREE.BoxGeometry(h * 0.14 * t, rh, h * 0.14 * t),
          i === 0 ? accent : base,
          h * (0.15 + (i * 0.7) / tiers)
        );
      }
      addMesh(group, new THREE.ConeGeometry(h * 0.03, h * 0.12, 8), accent, h * 0.98);
      break;
    }
    case "dome": {
      addMesh(group, new THREE.BoxGeometry(h * 0.5, h * 0.35, h * 0.5), stone, h * 0.18);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(h * 0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), stone);
      dome.position.y = h * 0.35;
      group.add(dome);
      addMesh(group, new THREE.CylinderGeometry(h * 0.02, h * 0.02, h * 0.08, 8), accent, h * 0.58);
      break;
    }
    case "pyramid": {
      addMesh(group, new THREE.ConeGeometry(h * 0.38, h * 0.85, 4), stone, h * 0.42);
      group.children[0].rotation.y = Math.PI / 4;
      break;
    }
    case "statue": {
      addMesh(group, new THREE.CylinderGeometry(h * 0.12, h * 0.15, h * 0.25, 12), stone, h * 0.12);
      addMesh(group, new THREE.CylinderGeometry(h * 0.04, h * 0.06, h * 0.55, 8), accent, h * 0.55);
      addMesh(group, new THREE.SphereGeometry(h * 0.05, 12, 12), accent, h * 0.88);
      break;
    }
    case "mountain":
    case "monolith": {
      const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.35, h * 0.9, 6), mat(color, { roughness: 0.9 }));
      m.position.y = h * 0.45;
      group.add(m);
      break;
    }
    case "sails": {
      for (let i = 0; i < 3; i++) {
        const shell = new THREE.Mesh(
          new THREE.SphereGeometry(h * 0.2, 16, 12, 0, Math.PI),
          mat("#f4f4f4", { roughness: 0.35 })
        );
        shell.rotation.y = (i - 1) * 0.55;
        shell.rotation.x = Math.PI / 2;
        shell.position.set((i - 1) * h * 0.14, h * 0.2, 0);
        group.add(shell);
      }
      addMesh(group, new THREE.BoxGeometry(h * 0.55, h * 0.06, h * 0.3), stone, h * 0.03);
      break;
    }
    case "amphitheater": {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(h * 0.35, h * 0.08, 8, 24, Math.PI * 1.2),
        stone
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h * 0.15;
      group.add(ring);
      addMesh(group, new THREE.CylinderGeometry(h * 0.2, h * 0.22, h * 0.12, 24), stone, h * 0.06);
      break;
    }
    case "arch": {
      addMesh(group, new THREE.BoxGeometry(h * 0.08, h * 0.7, h * 0.12), stone, h * 0.35);
      group.children[0].position.x = -h * 0.18;
      addMesh(group, new THREE.BoxGeometry(h * 0.08, h * 0.7, h * 0.12), stone, h * 0.35);
      group.children[1].position.x = h * 0.18;
      const arch = new THREE.Mesh(new THREE.TorusGeometry(h * 0.18, h * 0.04, 8, 16, Math.PI), stone);
      arch.rotation.z = Math.PI;
      arch.position.y = h * 0.55;
      group.add(arch);
      break;
    }
    case "temple":
    case "cathedral":
    case "palace":
    case "castle":
    case "facade":
    case "ruins": {
      addMesh(group, new THREE.BoxGeometry(h * 0.55, h * 0.45, h * 0.25), stone, h * 0.22);
      for (const x of [-h * 0.18, 0, h * 0.18]) {
        addMesh(group, new THREE.BoxGeometry(h * 0.06, h * 0.35, h * 0.06), stone, h * 0.52);
        group.children.at(-1).position.x = x;
      }
      if (shape === "cathedral" || shape === "castle") {
        addMesh(group, new THREE.ConeGeometry(h * 0.05, h * 0.2, 4), accent, h * 0.75);
      }
      break;
    }
    case "falls": {
      const water = mat("#7ab8d8", { roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 });
      addMesh(group, new THREE.BoxGeometry(h * 0.08, h * 0.5, h * 0.04), water, h * 0.25);
      addMesh(group, new THREE.BoxGeometry(h * 0.35, h * 0.04, h * 0.2), stone, h * 0.02);
      break;
    }
    case "disc": {
      addMesh(group, new THREE.CylinderGeometry(h * 0.04, h * 0.06, h * 0.75, 12), accent, h * 0.38);
      addMesh(group, new THREE.CylinderGeometry(h * 0.18, h * 0.18, h * 0.04, 24), accent, h * 0.78);
      break;
    }
    case "sign": {
      addMesh(group, new THREE.BoxGeometry(h * 0.9, h * 0.22, h * 0.04), mat("#3d5c3a", { roughness: 0.9 }), h * 0.12);
      for (let i = 0; i < 9; i++) {
        const letter = new THREE.Mesh(new THREE.BoxGeometry(h * 0.07, h * 0.14, h * 0.02), mat("#f5f5f0"));
        letter.position.set((i - 4) * h * 0.09, h * 0.12, h * 0.03);
        group.add(letter);
      }
      break;
    }
    case "wall": {
      for (let i = 0; i < 8; i++) {
        const seg = new THREE.Mesh(new THREE.BoxGeometry(h * 0.12, h * 0.35, h * 0.08), stone);
        seg.position.set((i - 3.5) * h * 0.14, h * 0.18, (i % 2) * h * 0.04);
        group.add(seg);
      }
      addMesh(group, new THREE.BoxGeometry(h * 1.1, h * 0.06, h * 0.2), stone, h * 0.04);
      break;
    }
    case "stones": {
      for (let i = 0; i < 5; i++) {
        const stoneMesh = new THREE.Mesh(
          new THREE.BoxGeometry(h * 0.15, h * (0.4 + i * 0.08), h * 0.08),
          mat("#9a8a78", { roughness: 0.95 })
        );
        stoneMesh.position.set((i - 2) * h * 0.18, h * (0.2 + i * 0.04), 0);
        stoneMesh.rotation.y = (i - 2) * 0.15;
        group.add(stoneMesh);
      }
      addMesh(group, new THREE.CylinderGeometry(h * 0.5, h * 0.52, h * 0.03, 24), mat("#8a9a6a"), h * 0.015);
      break;
    }
    case "canyon": {
      const left = new THREE.Mesh(new THREE.BoxGeometry(h * 0.15, h * 0.7, h * 0.5), mat("#b86840", { roughness: 0.92 }));
      left.position.set(-h * 0.22, h * 0.35, 0);
      const right = left.clone();
      right.position.x = h * 0.22;
      group.add(left, right);
      addMesh(group, new THREE.BoxGeometry(h * 0.35, h * 0.04, h * 0.4), mat("#5a9ac8", { roughness: 0.3 }), h * 0.08);
      break;
    }
    case "obelisk":
    case "platform":
    default: {
      addMesh(group, new THREE.BoxGeometry(h * 0.12, h * 0.08, h * 0.12), stone, h * 0.04);
      addMesh(group, new THREE.BoxGeometry(h * 0.06, h * 0.75, h * 0.06), accent, h * 0.42);
      if (shape === "platform") {
        addMesh(group, new THREE.BoxGeometry(h * 0.2, h * 0.03, h * 0.2), stone, h * 0.82);
      }
      break;
    }
  }

  return group;
}
