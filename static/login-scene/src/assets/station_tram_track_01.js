// src/assets/station_tram_track_01 — ballast, sleepers, rails.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("station_tram_track_01", "station", ["rail", "track"]);
  const [x0, x1] = ZONES.tram_track.x;
  const w = x1 - x0;
  const gauge = 1.0;

  partAt(root, box(w, 0.06, gauge + 0.6), "mat_concrete", "ballast", 0, 0.03, 0);

  for (let i = 0; i < 20; i++) {
    const x = -w / 2 + 0.5 + i * 1.0;
    partAt(root, box(0.22, 0.05, gauge + 0.3), "mat_wood_dark", `sleeper_${i + 1}`, x, 0.085, 0);
  }

  for (let s = 0; s < 2; s++) {
    const z = s === 0 ? -gauge / 2 : gauge / 2;
    partAt(root, box(w, 0.12, 0.07), "mat_metal_steel", `rail_${s === 0 ? "far" : "near"}`, 0, 0.16, z);
    partAt(root, box(w, 0.02, 0.12), "mat_metal_steel_worn", `rail_base_${s === 0 ? "far" : "near"}`, 0, 0.10, z);
  }

  return finalizeAsset(root);
}

export default create;
