// src/assets/props_bicycle_parking_zone_01 — paved patch with bike rack.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_bicycle_parking_zone_01", "props", ["parking", "rack"]);
  const W = 2.4, D = 1.2;

  partAt(root, box(W, 0.03, D), "mat_concrete_paving", "paving", 0, 0.015, 0);
  partAt(root, box(W, 0.006, 0.1), "mat_asphalt_paint_white", "edge_mark", 0, 0.034, -D / 2 + 0.05);

  // rack: three U hoops
  for (let i = 0; i < 3; i++) {
    const x = -W / 2 + 0.4 + i * 0.8;
    partAt(root, cyl(0.03, 0.03, 0.5, 8), "mat_metal_steel", `hoop_post_${i + 1}_a`, x, 0.25, -D / 2 + 0.2);
    partAt(root, cyl(0.03, 0.03, 0.5, 8), "mat_metal_steel", `hoop_post_${i + 1}_b`, x, 0.25, -D / 2 + 0.5);
    partAt(root, box(0.06, 0.06, 0.3), "mat_metal_steel", `hoop_top_${i + 1}`, x, 0.53, -D / 2 + 0.35);
  }

  return finalizeAsset(root);
}

export default create;
