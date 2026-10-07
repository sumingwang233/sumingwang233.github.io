// src/assets/props_vending_machine_01 — drinks vending machine with glass front.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_vending_machine_01", "props", ["vending", "machine"]);
  const W = 1.1, D = 0.7, H = 1.9;

  partAt(root, box(W + 0.04, 0.08, D + 0.04), "mat_metal_painted_black", "base", 0, 0.04, 0);
  partAt(root, box(W, H - 0.08, D), "mat_metal_painted_red", "body", 0, 0.08 + (H - 0.08) / 2, 0);

  // display interior and glass
  partAt(root, box(W - 0.2, H - 0.3, 0.02), "mat_vending_interior", "inner_back", 0, H / 2, D / 2 - 0.06);
  for (let i = 0; i < 5; i++) {
    const y = 0.45 + i * 0.28;
    partAt(root, box(W - 0.24, 0.02, D - 0.16), "mat_plastic_white", `shelf_${i + 1}`, 0, y, 0);
    for (let k = 0; k < 4; k++) {
      const x = -W / 2 + 0.18 + k * 0.2;
      partAt(root, box(0.14, 0.2, 0.1), ["mat_plastic_red", "mat_plastic_blue", "mat_plastic_green", "mat_plastic_yellow"][(i + k) % 4], `drink_${i + 1}_${k + 1}`, x, y + 0.11, 0);
    }
  }
  partAt(root, box(W - 0.2, H - 0.3, 0.015), "mat_glass_vending", "glass", 0, H / 2, -D / 2 + 0.02);

  // control panel
  partAt(root, box(0.28, 0.5, 0.03), "mat_plastic_black", "panel", W / 2 - 0.18, 1.2, -D / 2 - 0.015);
  partAt(root, box(0.2, 0.12, 0.006), "mat_lightbox_emissive", "panel_light", W / 2 - 0.18, 1.35, -D / 2 - 0.03);
  partAt(root, box(0.18, 0.06, 0.05), "mat_plastic_black", "coin_slot", W / 2 - 0.18, 0.95, -D / 2 - 0.02);

  // brand band
  partAt(root, box(W - 0.1, 0.18, 0.012), "mat_sign_band", "brand_band", 0, H - 0.12, -D / 2 - 0.006);

  return finalizeAsset(root);
}

export default create;
