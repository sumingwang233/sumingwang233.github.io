// src/core/organicKit.js — shared organic-geometry helpers for nature assets.
// Node-safe and browser-safe (pure geometry, no DOM). Asset-layer safe: Mesh + BufferGeometry +
// MeshStandardMaterial only, deterministic (seeded) so a given asset always produces the same mesh.
import * as THREE from "three";
import { partAt } from "./assetKit.js";

// Deterministic PRNG (mulberry32). Key assets must not be placed or shaped by Math.random().
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Stylised canopy lobe: indexed sphere with per-vertex radial jitter and Y squash.
// Indexed geometry keeps faces intact under jitter, so flat shading reads as clean facets.
export function blobGeometry(r, squash, rand, wSeg = 14, hSeg = 10, jitter = 0.09) {
  const geo = new THREE.SphereGeometry(r, wSeg, hSeg);
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = 1 + (rand() - 0.5) * jitter * 2;
    pos.setXYZ(i, x * k, y * k * squash, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

// Tapered branch between two points, baked into geometry.
export function branchPart(root, from, to, rTop, rBottom, partName) {
  const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const L = Math.hypot(...d);
  const theta = Math.atan2(-d[0], d[1]);
  const phi = Math.atan2(d[2], Math.hypot(d[0], d[1]));
  const geo = new THREE.CylinderGeometry(rTop, rBottom, L, 8);
  partAt(root, geo, "mat_bark", partName,
    (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2, phi, 0, theta);
}

// Sakura crown built from layered lobes: top ring (light), mid ring, underside ring (deep pink),
// each lobe fed by its own branch, plus small blossom clusters on the upper face.
export function buildSakura(root, spec) {
  const rand = rng(spec.seed);
  const H = spec.trunkHeight;

  partAt(root, new THREE.CylinderGeometry(spec.trunkTop, spec.trunkBase, H, 14), "mat_bark", "trunk", 0, H / 2, 0);
  partAt(root, new THREE.CylinderGeometry(spec.trunkBase * 1.2, spec.trunkBase * 1.5, 0.05, 14), "mat_bark", "root_flare", 0, 0.025, 0);

  let branchCount = 0;
  let lobeCount = 0;

  for (const ring of spec.rings) {
    for (let i = 0; i < ring.count; i++) {
      const a = ring.phase + (i / ring.count) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const r = ring.radius * (0.82 + rand() * 0.36);
      const y = ring.height + (rand() - 0.5) * 0.22;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;

      branchPart(root, ring.from, [x, y - r * 0.55, z], ring.branchTop, ring.branchBottom, `branch_${branchCount + 1}`);
      branchCount += 1;

      const rx = (rand() - 0.5) * 0.35;
      const rz = (rand() - 0.5) * 0.35;
      partAt(root, blobGeometry(r, ring.squash, rand), ring.material, `canopy_${lobeCount + 1}`, x, y, z, rx, rand() * Math.PI * 2, rz);
      lobeCount += 1;
    }
  }

  // Crown centre — the dome that ties the rings together.
  const c = spec.center;
  partAt(root, blobGeometry(c.radius, c.squash, rand, 16, 12), c.material, `canopy_${lobeCount + 1}`, 0, c.height, 0);
  lobeCount += 1;

  // Blossom clusters: small faceted tufts sitting on the upper face of the crown.
  for (let i = 0; i < spec.blossoms.count; i++) {
    const a = rand() * Math.PI * 2;
    const rr = spec.blossoms.radius * Math.sqrt(rand());
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const y = spec.blossoms.height + (rand() - 0.5) * 0.35;
    partAt(root, new THREE.IcosahedronGeometry(spec.blossoms.size * (0.7 + rand() * 0.6), 1),
      spec.blossoms.material, `flower_cluster_${i + 1}`, x, y, z);
  }
}
