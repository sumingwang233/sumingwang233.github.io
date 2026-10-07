// src/assets/interior_checkout_counter_01 — L-shaped checkout counter (top face at y = 1.12).
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_checkout_counter_01", "interior", ["counter"]);
  const W = 2.0, D = 0.8, TOP = 1.12;

  partAt(root, box(W, TOP - 0.06, D), "mat_wood_light", "body", 0, (TOP - 0.06) / 2, 0);
  partAt(root, box(W, 0.06, D + 0.1), "mat_wood_dark", "top", 0, TOP - 0.03, 0.05);

  // customer-side conveyor
  partAt(root, box(1.0, 0.02, D - 0.1), "mat_plastic_black", "conveyor", 0.45, TOP + 0.01, 0.05);

  // kick panel and foot rest
  partAt(root, box(W, 0.12, 0.02), "mat_shelf_metal", "kick_panel", 0, 0.06, -D / 2 + 0.01);

  // small shelf under the counter (staff side)
  partAt(root, box(W - 0.2, 0.03, 0.25), "mat_shelf_metal", "under_shelf", 0, 0.55, D / 2 - 0.15);
  for (let i = 0; i < 3; i++) {
    partAt(root, box(0.22, 0.14, 0.16), "mat_cardboard", `box_${i + 1}`, -0.6 + i * 0.4, 0.63, D / 2 - 0.15);
  }

  return finalizeAsset(root);
}

export default create;
