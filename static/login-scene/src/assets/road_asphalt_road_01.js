// src/assets/road_asphalt_road_01.js
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("road_asphalt_road_01", "road", ["asphalt", "road"]);
  const [x0, x1] = ZONES.road.x;
  const [z0, z1] = ZONES.road.z;
  const w = x1 - x0;
  const d = z1 - z0;

  partAt(root, box(w, 0.03, d), "mat_asphalt", "surface", 0, 0.015, 0);
  // worn white edge line at the sidewalk boundary
  partAt(root, box(w, 0.006, 0.12), "mat_asphalt_paint_white", "edge_line", 0, 0.034, d / 2 - 0.08);
  // patch of darker repair asphalt (weathering)
  partAt(root, box(2.2, 0.006, 1.4), "mat_metal_painted_black", "repair_patch", -4.5, 0.034, -0.6);

  return finalizeAsset(root);
}

export default create;
