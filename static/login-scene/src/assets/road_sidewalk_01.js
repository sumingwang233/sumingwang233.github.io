// src/assets/road_sidewalk_01 — paved sidewalk with seams and tactile strip.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("road_sidewalk_01", "road", ["paving"]);
  const [x0, x1] = ZONES.sidewalk.x;
  const w = x1 - x0;
  const d = Math.abs(ZONES.sidewalk.z[1] - ZONES.sidewalk.z[0]);

  partAt(root, box(w, 0.05, d), "mat_concrete_paving", "surface", 0, 0.025, 0);

  // paving seams
  for (let i = 0; i < 10; i++) {
    const x = -w / 2 + 2 + i * 2;
    partAt(root, box(0.03, 0.006, d), "mat_concrete", `seam_${i + 1}`, x, 0.054, 0);
  }
  // tactile paving strip near the road edge
  for (let i = 0; i < 24; i++) {
    const x = -w / 2 + 0.4 + i * 0.8;
    partAt(root, box(0.36, 0.012, 0.36), "mat_tactile_paving", `tactile_${i + 1}`, x, 0.058, -d / 2 + 0.25);
  }

  return finalizeAsset(root);
}

export default create;
