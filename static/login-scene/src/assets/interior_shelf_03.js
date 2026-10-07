// src/assets/interior_shelf_03 — double-sided aisle shelf.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_shelf_03", "interior", ["shelf", "aisle"]);
  const W = 1.6, D = 0.7, H = 1.5;

  partAt(root, box(W, 0.1, D), "mat_shelf_metal", "plinth", 0, 0.05, 0);
  partAt(root, box(W, H - 0.1, 0.04), "mat_shelf_metal", "spine", 0, 0.1 + (H - 0.1) / 2, 0);

  for (let side = 0; side < 2; side++) {
    const z = side === 0 ? -D / 2 + 0.02 : D / 2 - 0.02;
    for (let i = 0; i < 4; i++) {
      const y = 0.4 + i * 0.28;
      partAt(root, box(W - 0.06, 0.03, D / 2 - 0.06), "mat_shelf_metal", `shelf_${side + 1}_${i + 1}`, 0, y, z / 2);
      for (let k = 0; k < 5; k++) {
        const x = -W / 2 + 0.16 + k * 0.28;
        partAt(root, box(0.22, 0.13, 0.12), ["mat_plastic_blue", "mat_plastic_red", "mat_cardboard", "mat_plastic_yellow", "mat_plastic_green"][(i + k) % 5], `item_${side + 1}_${i + 1}_${k + 1}`, x, y + 0.08, z / 2);
      }
    }
  }

  return finalizeAsset(root);
}

export default create;
