// src/assets/interior_onigiri_display_01 — onigiri tray display.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_onigiri_display_01", "interior", ["display", "tray"]);
  const W = 1.0, D = 0.6, H = 1.1;

  partAt(root, box(W, 0.3, D), "mat_metal_painted_white", "body", 0, 0.15, 0);
  partAt(root, box(W - 0.1, 0.02, D - 0.1), "mat_plastic_white", "tray", 0, 0.36, 0);

  // triangular onigiri (approximated with tapered boxes) + nori strip
  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 0.14 + i * 0.18;
    partAt(root, box(0.14, 0.12, 0.1), "mat_food_rice", `onigiri_${i + 1}`, x, 0.43, 0);
    partAt(root, box(0.14, 0.05, 0.102), "mat_food_nori", `nori_${i + 1}`, x, 0.38, 0);
    partAt(root, cyl(0.02, 0.02, 0.012, 8), "mat_food_egg", `filling_${i + 1}`, x, 0.5, 0);
  }

  // glass cover
  partAt(root, box(W, H - 0.36, 0.02), "mat_glass_clear", "glass_cover", 0, 0.36 + (H - 0.36) / 2, -D / 2 + 0.02);
  partAt(root, box(W, 0.03, 0.03), "mat_stainless", "frame_top", 0, H - 0.015, -D / 2 + 0.02);

  return finalizeAsset(root);
}

export default create;
