// src/assets/architecture_store_automatic_door_01 — sliding glass auto doors (open position).
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("architecture_store_automatic_door_01", "architecture", ["door", "glass"]);
  const opening = 1.6;
  const panelW = 0.72;
  const H = 2.4;

  // header rail and frame
  partAt(root, box(opening, 0.1, 0.06), "mat_metal_painted_white", "header", 0, H + 0.05, 0);
  for (let s = 0; s < 2; s++) {
    const x = s === 0 ? -opening / 2 : opening / 2;
    partAt(root, box(0.06, H, 0.06), "mat_metal_painted_white", `jamb_${s + 1}`, x, H / 2, 0);
  }
  partAt(root, box(opening, 0.04, 0.06), "mat_metal_painted_black", "sensor", 0, H + 0.14, 0);

  // two glass panels slid to the sides
  for (let s = 0; s < 2; s++) {
    const x = s === 0 ? -(opening / 2 - panelW / 2) : (opening / 2 - panelW / 2);
    partAt(root, box(panelW, H - 0.16, 0.02), "mat_glass_tinted", `panel_${s + 1}`, x, (H - 0.16) / 2 + 0.12, 0);
    partAt(root, box(panelW, 0.12, 0.03), "mat_metal_painted_white", `panel_bottom_${s + 1}`, x, 0.06, 0);
    partAt(root, box(panelW, 0.04, 0.03), "mat_metal_painted_white", `panel_top_${s + 1}`, x, H - 0.14, 0);
  }

  return finalizeAsset(root);
}

export default create;
