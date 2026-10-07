// src/assets/road_alley_entrance_01 — west alley behind the store.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("road_alley_entrance_01", "road", ["alley", "paving"]);
  const [x0, x1] = ZONES.alley.x;
  const w = x1 - x0;
  const d = Math.abs(ZONES.alley.z[1] - ZONES.alley.z[0]);

  partAt(root, box(w, 0.04, d), "mat_concrete", "paving", 0, 0.02, 0);

  // rear boundary wall
  partAt(root, box(w, 1.6, 0.18), "mat_wall_exterior", "rear_wall", 0, 0.8, d / 2 - 0.09);
  // west boundary fence (stops short of the rear wall — no penetration)
  partAt(root, box(0.14, 1.2, d - 0.18), "mat_wood_dark", "west_fence", -w / 2 + 0.07, 0.6, -0.09);

  // entrance bollards
  for (let i = 0; i < 3; i++) {
    const x = -w / 2 + 1.2 + i * 1.6;
    partAt(root, cyl(0.09, 0.11, 0.7, 10), "mat_concrete", `bollard_${i + 1}`, x, 0.35, -d / 2 + 0.35);
  }

  // drain pipe along the rear wall
  partAt(root, cyl(0.1, 0.1, w - 1.0, 12), "mat_metal_steel_worn", "drain_pipe", 0, 0.12, d / 2 - 0.3, Math.PI / 2, 0, 0);

  return finalizeAsset(root);
}

export default create;
