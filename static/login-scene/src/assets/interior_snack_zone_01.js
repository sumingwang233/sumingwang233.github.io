// src/assets/interior_snack_zone_01 — snack bag rack.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_snack_zone_01", "interior", ["snack", "rack"]);
  const W = 1.2, D = 0.5, H = 1.4;

  partAt(root, box(W, 0.1, D), "mat_shelf_metal", "plinth", 0, 0.05, 0);
  partAt(root, box(0.05, H - 0.1, 0.05), "mat_shelf_metal", "upright_left", -W / 2 + 0.025, 0.1 + (H - 0.1) / 2, 0);
  partAt(root, box(0.05, H - 0.1, 0.05), "mat_shelf_metal", "upright_right", W / 2 - 0.025, 0.1 + (H - 0.1) / 2, 0);

  const bagMats = ["mat_plastic_red", "mat_plastic_yellow", "mat_plastic_green", "mat_plastic_blue", "mat_cardboard"];
  for (let i = 0; i < 3; i++) {
    const y = 0.45 + i * 0.32;
    partAt(root, box(W - 0.1, 0.02, D - 0.1), "mat_shelf_metal", `shelf_${i + 1}`, 0, y, 0);
    for (let k = 0; k < 5; k++) {
      const x = -W / 2 + 0.14 + k * 0.2;
      partAt(root, box(0.16, 0.22, 0.08), bagMats[(i + k) % bagMats.length], `bag_${i + 1}_${k + 1}`, x, y + 0.12, 0);
    }
    partAt(root, box(W - 0.1, 0.05, 0.012), "mat_paper_poster", `price_rail_${i + 1}`, 0, y + 0.04, -D / 2 + 0.06);
  }

  return finalizeAsset(root);
}

export default create;
