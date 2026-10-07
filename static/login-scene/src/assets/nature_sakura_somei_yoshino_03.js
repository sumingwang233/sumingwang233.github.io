// src/assets/nature_sakura_somei_yoshino_03 — young street sakura on the sidewalk island.
import { assetRoot, finalizeAsset } from "../core/assetKit.js";
import { buildSakura } from "../core/organicKit.js";

export function create() {
  const root = assetRoot("nature_sakura_somei_yoshino_03", "nature", ["sakura", "tree", "canopy"]);

  buildSakura(root, {
    seed: 317443,
    trunkHeight: 1.35,
    trunkBase: 0.16,
    trunkTop: 0.085,
    rings: [
      {
        count: 4, radius: 0.44, height: 2.0, squash: 0.7, phase: 0.2,
        material: "mat_sakura_canopy_deep", branchTop: 0.024, branchBottom: 0.042,
        from: [0, 1.3, 0],
      },
      {
        count: 4, radius: 0.54, height: 2.4, squash: 0.85, phase: 1.4,
        material: "mat_sakura_canopy", branchTop: 0.022, branchBottom: 0.036,
        from: [0, 1.35, 0],
      },
      {
        count: 3, radius: 0.48, height: 2.72, squash: 0.8, phase: 2.4,
        material: "mat_sakura_canopy_light", branchTop: 0.02, branchBottom: 0.03,
        from: [0, 1.38, 0],
      },
    ],
    center: { radius: 0.6, height: 2.55, squash: 0.85, material: "mat_sakura_canopy_light" },
    blossoms: { count: 12, radius: 0.9, height: 2.95, size: 0.09, material: "mat_sakura_blossom" },
  });

  return finalizeAsset(root);
}

export default create;
