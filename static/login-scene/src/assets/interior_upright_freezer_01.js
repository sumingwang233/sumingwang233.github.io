// src/assets/interior_upright_freezer_01 — frozen-food freezer with glass window.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_upright_freezer_01", "interior", ["freezer"]);
  const W = 1.0, D = 0.6, H = 1.7;

  partAt(root, box(W, H, D), "mat_metal_painted_white", "cabinet", 0, H / 2, 0);
  partAt(root, box(W - 0.12, H - 0.2, 0.02), "mat_vending_interior", "inner_back", 0, H / 2, D / 2 - 0.06);

  for (let i = 0; i < 4; i++) {
    const y = 0.3 + i * 0.32;
    partAt(root, box(W - 0.14, 0.02, D - 0.14), "mat_plastic_white", `shelf_${i + 1}`, 0, y, 0);
    for (let k = 0; k < 4; k++) {
      const x = -W / 2 + 0.16 + k * 0.2;
      partAt(root, box(0.18, 0.12, 0.12), ["mat_plastic_blue", "mat_plastic_green", "mat_cardboard", "mat_plastic_red"][(i + k) % 4], `pack_${i + 1}_${k + 1}`, x, y + 0.07, 0);
    }
  }

  // door with glass window
  partAt(root, box(W - 0.06, H - 0.14, 0.03), "mat_metal_painted_white", "door", 0, H / 2, -D / 2 + 0.015);
  partAt(root, box(W - 0.2, H - 0.4, 0.012), "mat_glass_vending", "door_window", 0, H / 2, -D / 2 - 0.005);
  partAt(root, box(0.05, 0.22, 0.03), "mat_plastic_black", "handle", W / 2 - 0.07, 1.0, -D / 2 - 0.02);

  return finalizeAsset(root);
}

export default create;
