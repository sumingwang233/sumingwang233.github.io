// src/assets/nature_grass_patch_01 — wildflower grass patch under a sakura (planting strip).
// All parts are meshes: lawn disc, grass tufts, flower stems and flower heads.
// Deterministic (seeded); pivot = bottom center so the instance sits on the surface it covers.
import * as THREE from "three";
import { assetRoot, partAt, finalizeAsset } from "../core/assetKit.js";
import { rng } from "../core/organicKit.js";

const FLOWERS = [
  "mat_wildflower_white",
  "mat_wildflower_yellow",
  "mat_wildflower_pink",
  "mat_wildflower_blue",
];

export function create() {
  const root = assetRoot("nature_grass_patch_01", "nature", ["grass", "wildflower", "ground"]);
  const rand = rng(420077);

  const R = 0.8;
  const thickness = 0.02;

  // Lawn disc with a slightly irregular rim.
  const lawn = new THREE.CylinderGeometry(R, R, thickness, 24);
  const pos = lawn.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const L = Math.hypot(x, z);
    if (L > 0.001) {
      const k = 1 + (rand() - 0.5) * 0.12;
      pos.setXYZ(i, (x / L) * L * k, pos.getY(i), (z / L) * L * k);
    }
  }
  lawn.computeVertexNormals();
  partAt(root, lawn, "mat_grass_lawn", "grass_base", 0, thickness / 2, 0);

  // Grass tufts: small faceted cones, denser toward the centre.
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2;
    const rr = R * 0.92 * Math.sqrt(rand());
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const h = 0.07 + rand() * 0.07;
    const geo = new THREE.ConeGeometry(0.045, h, 5);
    const tilt = (rand() - 0.5) * 0.4;
    partAt(root, geo, "mat_grass_tuft", `grass_tuft_${i + 1}`, x, thickness + h / 2, z, tilt, rand() * Math.PI * 2, (rand() - 0.5) * 0.4);
  }

  // Wildflowers: thin stem + a small faceted head.
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2;
    const rr = R * 0.85 * Math.sqrt(rand());
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const h = 0.09 + rand() * 0.06;
    partAt(root, new THREE.CylinderGeometry(0.008, 0.011, h, 5), "mat_wildflower_stem", `flower_stem_${i + 1}`, x, thickness + h / 2, z);
    partAt(root, new THREE.IcosahedronGeometry(0.03 + rand() * 0.015, 1), FLOWERS[i % FLOWERS.length], `flower_head_${i + 1}`, x, thickness + h + 0.018, z);
  }

  // A few petals lying on the grass.
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2;
    const rr = R * 0.8 * Math.sqrt(rand());
    partAt(root, new THREE.IcosahedronGeometry(0.022, 0), "mat_sakura_petal", `petal_${i + 1}`, Math.cos(a) * rr, thickness + 0.006, Math.sin(a) * rr);
  }

  return finalizeAsset(root);
}

export default create;
