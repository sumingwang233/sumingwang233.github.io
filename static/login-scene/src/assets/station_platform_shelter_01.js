// src/assets/station_platform_shelter_01 — canopy, posts, bench.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("station_platform_shelter_01", "station", ["shelter", "bench"]);
  const W = 3.2, D = 1.6, H = 2.3;

  for (let i = 0; i < 4; i++) {
    const x = -W / 2 + (i % 2) * W;
    const z = -D / 2 + Math.floor(i / 2) * D;
    partAt(root, cyl(0.06, 0.07, H, 10), "mat_metal_painted_green", `post_${i + 1}`, x, H / 2, z);
  }

  partAt(root, box(W + 0.4, 0.08, D + 0.4), "mat_metal_painted_green", "roof", 0, H, 0);
  partAt(root, box(W + 0.4, 0.03, D + 0.4), "mat_fabric_canopy", "roof_underside", 0, H - 0.06, 0);

  // bench
  partAt(root, box(1.8, 0.06, 0.42), "mat_wood_light", "bench_seat", 0.4, 0.45, 0);
  partAt(root, box(1.8, 0.45, 0.05), "mat_wood_light", "bench_back", 0.4, 0.72, D / 2 - 0.03);
  for (let k = 0; k < 2; k++) {
    partAt(root, box(0.06, 0.45, 0.42), "mat_metal_steel_worn", `bench_leg_${k + 1}`, 0.4 - 0.8 + k * 1.6, 0.225, 0);
  }

  // route sign board
  partAt(root, box(0.7, 0.5, 0.03), "mat_paper_poster", "sign_board", -W / 2 + 0.4, 1.6, 0);

  return finalizeAsset(root);
}

export default create;
