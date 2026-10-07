// src/assets/nature_sakura_somei_yoshino_02 — second sakura, slightly smaller and leaning east.
import { assetRoot, finalizeAsset } from "../core/assetKit.js";
import { buildSakura } from "../core/organicKit.js";

export function create() {
  const root = assetRoot("nature_sakura_somei_yoshino_02", "nature", ["sakura", "tree", "canopy"]);

  buildSakura(root, {
    seed: 209301,
    trunkHeight: 1.65,
    trunkBase: 0.21,
    trunkTop: 0.11,
    rings: [
      {
        count: 4, radius: 0.56, height: 2.5, squash: 0.7, phase: 0.9,
        material: "mat_sakura_canopy_deep", branchTop: 0.03, branchBottom: 0.055,
        from: [0, 1.6, 0],
      },
      {
        count: 5, radius: 0.68, height: 2.95, squash: 0.85, phase: 1.7,
        material: "mat_sakura_canopy", branchTop: 0.028, branchBottom: 0.045,
        from: [0, 1.65, 0],
      },
      {
        count: 4, radius: 0.6, height: 3.35, squash: 0.8, phase: 2.6,
        material: "mat_sakura_canopy_light", branchTop: 0.024, branchBottom: 0.038,
        from: [0, 1.68, 0],
      },
    ],
    center: { radius: 0.74, height: 3.15, squash: 0.85, material: "mat_sakura_canopy_light" },
    blossoms: { count: 14, radius: 1.1, height: 3.6, size: 0.1, material: "mat_sakura_blossom" },
  });

  return finalizeAsset(root);
}

export default create;
