// src/assets/interior_bento_display_01 — refrigerated bento display case.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_bento_display_01", "interior", ["display", "case"]);
  const W = 1.2, D = 0.7, H = 1.3;

  partAt(root, box(W, 0.25, D), "mat_metal_painted_white", "body", 0, 0.125, 0);

  for (let i = 0; i < 3; i++) {
    const y = 0.35 + i * 0.3;
    partAt(root, box(W - 0.1, 0.02, D - 0.12), "mat_plastic_white", `tier_${i + 1}`, 0, y, 0);
    for (let k = 0; k < 4; k++) {
      const x = -W / 2 + 0.18 + k * 0.24;
      partAt(root, box(0.2, 0.05, 0.14), "mat_food_bento_box", `bento_${i + 1}_${k + 1}`, x, y + 0.035, 0);
      partAt(root, box(0.16, 0.02, 0.1), "mat_food_rice", `rice_${i + 1}_${k + 1}`, x, y + 0.06, 0.01);
      partAt(root, box(0.06, 0.015, 0.06), "mat_food_vegetable", `garnish_${i + 1}_${k + 1}`, x - 0.04, y + 0.07, -0.02);
    }
  }

  // slanted glass front
  partAt(root, box(W, H - 0.25, 0.02), "mat_glass_clear", "glass_front", 0, 0.25 + (H - 0.25) / 2, -D / 2 + 0.02);
  partAt(root, box(W, 0.04, 0.04), "mat_stainless", "frame_top", 0, H - 0.02, -D / 2 + 0.02);

  return finalizeAsset(root);
}

export default create;
