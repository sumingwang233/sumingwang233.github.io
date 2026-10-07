// src/assets/architecture_store_glass_facade_01 — glass front with mullions; entrance gap in the middle.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("architecture_store_glass_facade_01", "architecture", ["glass", "facade"]);
  const [x0, x1] = ZONES.store.x;
  const W = x1 - x0; // 8.0
  const H = ZONES.store.height;
  const lintelH = 0.6;
  const glassH = H - lintelH;
  const gap = 1.6; // automatic door opening

  // kick plate
  partAt(root, box(W, 0.12, 0.04), "mat_metal_painted_white", "kick_plate", 0, 0.06, 0);

  // glass panels left and right of the entrance
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? -1 : 1;
    const panelW = (W - gap) / 2 - 0.15;
    const cx = side * (gap / 2 + 0.075 + panelW / 2);
    partAt(root, box(panelW, glassH - 0.14, 0.02), "mat_glass_clear", `glass_${s + 1}`, cx, 0.12 + (glassH - 0.14) / 2, 0);
    // mullions
    partAt(root, box(0.06, glassH, 0.05), "mat_metal_painted_white", `mullion_outer_${s + 1}`, side * (W / 2 - 0.03), glassH / 2, 0);
    partAt(root, box(0.06, glassH, 0.05), "mat_metal_painted_white", `mullion_inner_${s + 1}`, side * (gap / 2 + 0.03), glassH / 2, 0);
    partAt(root, box(panelW + 0.06, 0.05, 0.05), "mat_metal_painted_white", `rail_top_${s + 1}`, cx, glassH - 0.025, 0);
    partAt(root, box(panelW + 0.06, 0.05, 0.05), "mat_metal_painted_white", `rail_bottom_${s + 1}`, cx, 0.145, 0);
    // mid rail for scale
    partAt(root, box(panelW, 0.04, 0.04), "mat_metal_painted_white", `mid_rail_${s + 1}`, cx, 1.2, 0);
  }

  return finalizeAsset(root);
}

export default create;
