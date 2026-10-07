// src/assets/station_platform_01 — raised platform, tactile strip, edge line, stairs.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("station_platform_01", "station", ["platform", "tactile"]);
  const [x0, x1] = ZONES.platform.x;
  const w = x1 - x0;
  const d = Math.abs(ZONES.platform.z[1] - ZONES.platform.z[0]);
  const h = ZONES.platform.height;

  partAt(root, box(w, h, d), "mat_concrete_paving", "slab", 0, h / 2, 0);
  // track-side edge line
  partAt(root, box(w, 0.012, 0.14), "mat_asphalt_paint_yellow", "edge_line", 0, h + 0.006, d / 2 - 0.07);
  // tactile strip on the street side
  for (let i = 0; i < 22; i++) {
    const x = -w / 2 + 0.4 + i * 0.9;
    partAt(root, box(0.34, 0.012, 0.34), "mat_tactile_paving", `tactile_${i + 1}`, x, h + 0.006, -d / 2 + 0.25);
  }
  // stairs down to street level at the west end
  for (let i = 0; i < 4; i++) {
    const y = h - (i + 1) * (h / 4);
    partAt(root, box(1.2, h / 4, 0.3), "mat_concrete", `step_${i + 1}`, -w / 2 + 0.6, y, -d / 2 - 0.3 - i * 0.3);
  }

  return finalizeAsset(root);
}

export default create;
