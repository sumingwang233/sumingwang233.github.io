// src/assets/interior_coffee_machine_01 — self-serve coffee station with its own stand.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_coffee_machine_01", "interior", ["coffee", "station"]);
  const standH = 1.02;

  // stand
  partAt(root, box(0.7, standH, 0.5), "mat_metal_painted_white", "stand", 0, standH / 2, 0);
  partAt(root, box(0.72, 0.04, 0.52), "mat_stainless", "stand_top", 0, standH + 0.02, 0);

  // machine body
  const mh = 0.55;
  partAt(root, box(0.5, mh, 0.36), "mat_plastic_black", "machine", 0, standH + 0.04 + mh / 2, 0.05);
  partAt(root, box(0.36, 0.06, 0.02), "mat_lightbox_emissive", "display", 0, standH + 0.04 + mh - 0.12, -0.13);
  // spout + drip tray
  partAt(root, cyl(0.03, 0.03, 0.06, 8), "mat_stainless", "spout", 0, standH + 0.2, -0.12);
  partAt(root, box(0.3, 0.02, 0.2), "mat_stainless", "drip_tray", 0, standH + 0.06, -0.12);
  // cup stack
  for (let i = 0; i < 4; i++) {
    partAt(root, cyl(0.045, 0.04, 0.07, 10), "mat_plastic_white", `cup_${i + 1}`, 0.22, standH + 0.075 + i * 0.07, -0.12);
  }

  return finalizeAsset(root);
}

export default create;
