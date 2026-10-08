// src/effects/petalFall.js — preview-only sakura petal drift (Points; never exported).
// Petals are seeded from the sakura instances in the layout config, so density concentrates under
// the canopies instead of filling the whole volume evenly.
import * as THREE from "three";
import { INSTANCES } from "../config/sceneLayout.js";

export function create(ctx) {
  const params = {
    count: 240,
    area: { x: [-10, 10], z: [-6.5, 4] },
    height: [0.15, 4.6],
    fallSpeed: 0.32,
    swirl: 0.35,
    flutter: 0.5,
    gustPeriod: 14,
    treeShare: 0.6, // 60% of petals fall from the sakura canopies
    size: 0.06,
  };

  const trees = INSTANCES.filter((i) => i.assetId.startsWith("nature_sakura_somei_yoshino") && i.visible);
  const sources = trees.map((inst) => {
    const root = ctx.sceneManager ? ctx.sceneManager.assets.get(inst.instanceId) : null;
    const box = root ? new THREE.Box3().setFromObject(root) : null;
    return {
      instanceId: inst.instanceId,
      x: inst.position[0],
      z: inst.position[2],
      top: box ? box.max.y : 4.0,
      radius: box ? Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2 : 1.5,
    };
  });

  const geo = new THREE.BufferGeometry();
  geo.name = "fx_petal_fall_geometry";
  const pos = new Float32Array(params.count * 3);
  const seeds = [];

  function spawn(i, source) {
    let x, z, y;
    if (source) {
      const a = Math.random() * Math.PI * 2;
      const r = source.radius * Math.sqrt(Math.random());
      x = source.x + Math.cos(a) * r;
      z = source.z + Math.sin(a) * r;
      y = source.top - Math.random() * 0.8;
    } else {
      x = params.area.x[0] + Math.random() * (params.area.x[1] - params.area.x[0]);
      z = params.area.z[0] + Math.random() * (params.area.z[1] - params.area.z[0]);
      y = params.height[1] - Math.random() * 1.2;
    }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    seeds[i].source = source;
    seeds[i].phase = Math.random() * Math.PI * 2;
    seeds[i].flutterPhase = Math.random() * Math.PI * 2;
  }

  for (let i = 0; i < params.count; i++) {
    seeds.push({ phase: 0, flutterPhase: 0, speed: params.fallSpeed * (0.6 + Math.random() * 0.8), source: null });
    const source = Math.random() < params.treeShare && sources.length
      ? sources[Math.floor(Math.random() * sources.length)]
      : null;
    spawn(i, source);
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({ name: "fx_petal_points", color: "#f9dbe4", size: params.size, sizeAttenuation: true });
  const points = new THREE.Points(geo, mat);
  points.name = "FX_petal_fall_01";
  ctx.group.add(points);

  return {
    id: "fx_petal_fall_01",
    kind: "points_particles",
    params,
    sources,
    update(dt, elapsed) {
      const attr = geo.getAttribute("position");
      // Gusts: calm periods and stronger sweeps, so the drift reads as wind rather than rain.
      const g = Math.max(0, Math.sin((elapsed / params.gustPeriod) * Math.PI * 2));
      const gust = 0.45 + g * g * 1.1;

      for (let i = 0; i < params.count; i++) {
        let y = attr.getY(i) - seeds[i].speed * dt * (0.8 + gust * 0.4);
        if (y < params.height[0]) {
          spawn(i, seeds[i].source);
          continue;
        }
        attr.setY(i, y);
        attr.setX(i, attr.getX(i) + Math.sin(elapsed * 0.8 + seeds[i].phase) * params.swirl * gust * dt);
        attr.setZ(i, attr.getZ(i) + Math.cos(elapsed * 1.3 + seeds[i].flutterPhase) * params.flutter * gust * dt);
      }
      attr.needsUpdate = true;
    },
  };
}

export default create;
