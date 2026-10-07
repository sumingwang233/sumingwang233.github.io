// src/assets/props_bicycle_03 — parked bicycle (red frame, child size).
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_bicycle_03", "props", ["bicycle"]);
  const R = 0.28;

  const tube = (x1, y1, x2, y2, name) => {
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    const theta = Math.atan2(-dx, dy);
    partAt(root, cyl(0.016, 0.016, L, 8), "mat_plastic_red", name, (x1 + x2) / 2, (y1 + y2) / 2, 0, 0, 0, theta);
  };

  for (let s = 0; s < 2; s++) {
    const x = s === 0 ? -0.46 : 0.46;
    partAt(root, cyl(R, R, 0.028, 16), "mat_rubber_tire", `tire_${s + 1}`, x, R, 0, Math.PI / 2, 0, 0);
    partAt(root, cyl(0.02, 0.02, 0.07, 8), "mat_metal_steel", `hub_${s + 1}`, x, R, 0, Math.PI / 2, 0, 0);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      partAt(root, cyl(0.006, 0.006, R * 2, 6), "mat_metal_steel", `spoke_${s + 1}_${k + 1}`, x, R, 0, Math.PI / 2, 0, a);
    }
  }

  tube(-0.26, 0.28, -0.26, 0.62, "seat_tube");
  tube(0.00, 0.28, 0.30, 0.66, "down_tube");
  tube(-0.26, 0.62, 0.30, 0.66, "top_tube");
  tube(-0.46, 0.28, 0.00, 0.28, "chain_stay");
  tube(0.30, 0.66, 0.46, 0.28, "fork");
  tube(-0.26, 0.62, -0.46, 0.28, "seat_stay");

  partAt(root, box(0.16, 0.04, 0.11), "mat_plastic_black", "saddle", -0.28, 0.64, 0);
  partAt(root, cyl(0.015, 0.015, 0.36, 8), "mat_metal_steel", "handlebar", 0.31, 0.72, 0, Math.PI / 2, 0, 0);
  partAt(root, box(0.12, 0.02, 0.05), "mat_metal_steel", "pedal", 0.0, 0.24, 0.07);

  return finalizeAsset(root);
}

export default create;
