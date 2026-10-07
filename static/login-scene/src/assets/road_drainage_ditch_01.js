// src/assets/road_drainage_ditch_01 — channel + metal grating along the sidewalk edge.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("road_drainage_ditch_01", "road", ["grating", "drain"]);
  const [x0, x1] = ZONES.drainage_ditch.x;
  const w = x1 - x0;
  const d = Math.abs(ZONES.drainage_ditch.z[1] - ZONES.drainage_ditch.z[0]);

  // recessed channel body
  partAt(root, box(w, 0.02, d), "mat_metal_painted_black", "channel", 0, 0.01, 0);
  // side curbs
  partAt(root, box(w, 0.05, 0.05), "mat_concrete", "curb_far", 0, 0.025, -d / 2 - 0.025);
  partAt(root, box(w, 0.05, 0.05), "mat_concrete", "curb_near", 0, 0.025, d / 2 + 0.025);

  // grating bars
  for (let i = 0; i < 40; i++) {
    const x = -w / 2 + 0.25 + i * 0.5;
    partAt(root, box(0.16, 0.012, d - 0.04), "mat_grating_metal", `bar_${i + 1}`, x, 0.026, 0);
  }

  return finalizeAsset(root);
}

export default create;
