// src/assets/road_parking_area_01 — marked parking bays east of the store.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("road_parking_area_01", "road", ["parking", "markings"]);
  const [x0, x1] = ZONES.parking.x;
  const w = x1 - x0;
  const d = Math.abs(ZONES.parking.z[1] - ZONES.parking.z[0]);

  partAt(root, box(w, 0.04, d), "mat_asphalt", "surface", 0, 0.02, 0);

  // bay lines (3 bays)
  for (let i = 0; i < 4; i++) {
    const z = -d / 2 + 0.6 + i * (d - 1.2) / 3;
    partAt(root, box(w - 0.4, 0.006, 0.1), "mat_asphalt_paint_white", `bay_line_${i + 1}`, 0, 0.044, z);
  }
  // wheel stops
  for (let i = 0; i < 3; i++) {
    const z = -d / 2 + 0.6 + (i + 0.5) * (d - 1.2) / 3;
    partAt(root, box(0.12, 0.09, 1.2), "mat_metal_painted_black", `wheel_stop_${i + 1}`, -w / 2 + 0.5, 0.045, z);
  }
  // yellow entrance marking
  partAt(root, box(0.6, 0.006, d - 0.4), "mat_asphalt_paint_yellow", "entrance_line", w / 2 - 0.35, 0.044, 0);

  return finalizeAsset(root);
}

export default create;
