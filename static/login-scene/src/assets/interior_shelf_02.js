// src/assets/interior_shelf_02 — pegboard aisle shelf with hanging packs.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_shelf_02", "interior", ["shelf", "pegboard"]);
  const W = 1.4, D = 0.5, H = 1.6;

  partAt(root, box(W, 0.1, D), "mat_shelf_metal", "plinth", 0, 0.05, 0);
  partAt(root, box(W, H - 0.1, 0.02), "mat_shelf_metal", "pegboard", 0, 0.1 + (H - 0.1) / 2, D / 2 - 0.01);

  // two solid shelves
  [0.45, 0.95].forEach((y, i) => {
    partAt(root, box(W - 0.06, 0.03, D - 0.08), "mat_shelf_metal", `shelf_${i + 1}`, 0, y, 0.0);
    for (let k = 0; k < 5; k++) {
      const x = -W / 2 + 0.15 + k * 0.24;
      partAt(root, box(0.18, 0.14, 0.12), k % 2 ? "mat_plastic_yellow" : "mat_cardboard", `box_${i + 1}_${k + 1}`, x, y + 0.085, 0.0);
    }
  });

  // hanging snack packs on hooks
  for (let i = 0; i < 6; i++) {
    const x = -W / 2 + 0.12 + i * 0.22;
    partAt(root, box(0.02, 0.06, 0.02), "mat_metal_steel", `hook_${i + 1}`, x, 1.35, 0.02);
    partAt(root, box(0.16, 0.24, 0.05), i % 3 === 0 ? "mat_plastic_red" : i % 3 === 1 ? "mat_plastic_green" : "mat_plastic_blue", `pack_${i + 1}`, x, 1.19, 0.02);
  }

  return finalizeAsset(root);
}

export default create;
