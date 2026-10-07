// src/assets/road_crosswalk_01.js — zebra stripes across the road.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("road_crosswalk_01", "road", ["zebra", "paint"]);
  const [, z1] = ZONES.crosswalk.z;
  const d = Math.abs(z1 - ZONES.crosswalk.z[0]) - 0.5;

  for (let i = 0; i < 5; i++) {
    const x = -1.6 + i * 0.8;
    partAt(root, box(0.42, 0.006, d), "mat_asphalt_paint_white", `stripe_${i + 1}`, x, 0.038, 0);
  }
  // stop line on the road side
  partAt(root, box(2.0, 0.006, 0.25), "mat_asphalt_paint_white", "stop_line", 0, 0.038, -d / 2 - 0.2);

  return finalizeAsset(root);
}

export default create;
