// src/assets/interior_sushi_display_01 — sushi case with nigiri pieces.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_sushi_display_01", "interior", ["display", "case"]);
  const W = 1.1, D = 0.6, H = 1.05;

  partAt(root, box(W, 0.3, D), "mat_metal_painted_white", "body", 0, 0.15, 0);
  partAt(root, box(W - 0.12, 0.02, D - 0.12), "mat_plastic_white", "tray", 0, 0.36, 0);

  const tops = ["mat_food_salmon", "mat_food_egg", "mat_food_vegetable", "mat_food_nori"];
  for (let i = 0; i < 6; i++) {
    const x = -W / 2 + 0.14 + i * 0.15;
    partAt(root, box(0.11, 0.04, 0.08), "mat_food_rice", `rice_${i + 1}`, x, 0.4, 0);
    partAt(root, box(0.11, 0.02, 0.08), tops[i % tops.length], `topping_${i + 1}`, x, 0.43, 0);
  }

  partAt(root, box(W, H - 0.36, 0.02), "mat_glass_clear", "glass_front", 0, 0.36 + (H - 0.36) / 2, -D / 2 + 0.02);
  partAt(root, box(W, 0.03, 0.03), "mat_stainless", "frame_top", 0, H - 0.015, -D / 2 + 0.02);
  partAt(root, box(0.3, 0.02, 0.02), "mat_paper_poster", "label", -W / 2 + 0.2, 0.5, -D / 2 + 0.03);

  return finalizeAsset(root);
}

export default create;
