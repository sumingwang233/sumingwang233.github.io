// src/assets/interior_oden_counter_01 — oden stand with pot and divided tray.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_oden_counter_01", "interior", ["oden", "counter"]);
  const W = 1.2, D = 0.6, TOP = 0.9;

  partAt(root, box(W, TOP - 0.05, D), "mat_metal_painted_white", "body", 0, (TOP - 0.05) / 2, 0);
  partAt(root, box(W + 0.06, 0.05, D + 0.06), "mat_stainless", "top", 0, TOP - 0.025, 0);

  // simmering pot
  partAt(root, cyl(0.26, 0.26, 0.28, 16), "mat_stainless", "pot", -0.2, TOP + 0.14, 0);
  partAt(root, cyl(0.24, 0.24, 0.02, 16), "mat_food_bento_box", "pot_contents", -0.2, TOP + 0.29, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    partAt(root, box(0.08, 0.03, 0.08), i % 2 ? "mat_food_egg" : "mat_food_nori", `oden_${i + 1}`, -0.2 + Math.cos(a) * 0.14, TOP + 0.305, Math.sin(a) * 0.14);
  }

  // divided tray of skewers
  partAt(root, box(0.5, 0.02, 0.3), "mat_plastic_white", "tray", 0.35, TOP + 0.035, 0);
  for (let i = 0; i < 3; i++) {
    partAt(root, box(0.12, 0.04, 0.09), "mat_food_vegetable", `skewer_${i + 1}`, 0.2 + i * 0.14, TOP + 0.06, 0);
  }

  // sign board above
  partAt(root, box(0.4, 0.28, 0.012), "mat_paper_poster", "sign", 0, TOP + 0.5, -D / 2 + 0.02);

  return finalizeAsset(root);
}

export default create;
