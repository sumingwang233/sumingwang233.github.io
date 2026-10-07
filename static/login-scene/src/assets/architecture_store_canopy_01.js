// src/assets/architecture_store_canopy_01 — entrance awning over the sidewalk.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("architecture_store_canopy_01", "architecture", ["canopy", "awning"]);
  const W = 8.0, D = 1.2, H = 2.7;

  partAt(root, box(W, 0.06, D), "mat_metal_painted_white", "canopy_plate", 0, H, 0);
  partAt(root, box(W, 0.28, 0.02), "mat_sign_band", "fascia", 0, H - 0.14, -D / 2 + 0.01);

  // support arms back to the facade
  for (let i = 0; i < 3; i++) {
    const x = -W / 2 + 1.2 + i * (W - 2.4) / 2;
    partAt(root, box(0.05, 0.05, D - 0.1), "mat_metal_steel_worn", `arm_${i + 1}`, x, H - 0.35, 0.05);
    partAt(root, box(0.05, 0.35, 0.05), "mat_metal_steel_worn", `arm_riser_${i + 1}`, x, H - 0.18, -D / 2 + 0.1);
  }

  // noren-style fabric strip under the fascia
  partAt(root, box(W - 1.0, 0.35, 0.01), "mat_fabric_canopy", "fabric_strip", 0, H - 0.42, -D / 2 + 0.02);

  return finalizeAsset(root);
}

export default create;
