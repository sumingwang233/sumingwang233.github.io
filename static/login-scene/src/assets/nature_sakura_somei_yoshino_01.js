// src/assets/nature_sakura_somei_yoshino_01 — main sakura (Somei Yoshino), layered faceted canopy.
// Crown built from three lobe rings + a centre dome, each lobe fed by its own branch,
// with small blossom clusters on the upper face. Deterministic (seeded), asset-layer safe.
import { assetRoot, finalizeAsset } from "../core/assetKit.js";
import { buildSakura } from "../core/organicKit.js";

export function create() {
  const root = assetRoot("nature_sakura_somei_yoshino_01", "nature", ["sakura", "tree", "canopy"]);

  buildSakura(root, {
    seed: 104729,
    trunkHeight: 1.9,
    trunkBase: 0.24,
    trunkTop: 0.13,
    rings: [
      {
        count: 5, radius: 0.62, height: 2.86, squash: 0.72, phase: 0.4,
        material: "mat_sakura_canopy_deep", branchTop: 0.035, branchBottom: 0.06,
        from: [0, 1.85, 0],
      },
      {
        count: 5, radius: 0.74, height: 3.32, squash: 0.86, phase: 1.1,
        material: "mat_sakura_canopy", branchTop: 0.03, branchBottom: 0.05,
        from: [0, 1.9, 0],
      },
      {
        count: 4, radius: 0.66, height: 3.72, squash: 0.8, phase: 2.2,
        material: "mat_sakura_canopy_light", branchTop: 0.025, branchBottom: 0.04,
        from: [0, 1.95, 0],
      },
    ],
    center: { radius: 0.82, height: 3.5, squash: 0.85, material: "mat_sakura_canopy_light" },
    blossoms: { count: 16, radius: 1.25, height: 4.05, size: 0.11, material: "mat_sakura_blossom" },
  });

  return finalizeAsset(root);
}

export default create;
