// src/assets/interior_drink_fridge_01 — upright glass-door drink cooler.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_drink_fridge_01", "interior", ["cooler", "glass"]);
  const W = 1.2, D = 0.6, H = 1.9;

  partAt(root, box(W, H, D), "mat_metal_painted_white", "cabinet", 0, H / 2, 0);
  partAt(root, box(W - 0.1, 0.06, D - 0.1), "mat_stainless", "base_skirt", 0, 0.03, 0);

  // interior back wall (visible through the glass)
  partAt(root, box(W - 0.12, H - 0.12, 0.02), "mat_vending_interior", "inner_back", 0, H / 2, D / 2 - 0.06);

  // shelves with drink rows
  for (let i = 0; i < 4; i++) {
    const y = 0.35 + i * 0.35;
    partAt(root, box(W - 0.14, 0.02, D - 0.14), "mat_plastic_white", `shelf_${i + 1}`, 0, y, 0);
    for (let k = 0; k < 5; k++) {
      const x = -W / 2 + 0.16 + k * 0.2;
      const mat = ["mat_plastic_red", "mat_plastic_blue", "mat_plastic_green", "mat_plastic_yellow", "mat_plastic_clear_bottle"][(i + k) % 5];
      partAt(root, box(0.12, 0.22, 0.1), mat, `drink_${i + 1}_${k + 1}`, x, y + 0.12, 0);
    }
  }

  // glass door on the front face
  partAt(root, box(W - 0.1, H - 0.14, 0.02), "mat_glass_vending", "door_glass", 0, H / 2, -D / 2 + 0.03);
  partAt(root, box(W, 0.06, 0.04), "mat_metal_painted_white", "door_frame_top", 0, H - 0.03, -D / 2 + 0.02);
  partAt(root, box(0.05, H, 0.04), "mat_metal_painted_white", "door_frame_side", -W / 2 + 0.025, H / 2, -D / 2 + 0.02);
  partAt(root, box(0.04, 0.2, 0.03), "mat_plastic_black", "handle", W / 2 - 0.06, 1.1, -D / 2 + 0.04);

  return finalizeAsset(root);
}

export default create;
