// src/assets/station_tram_vehicle_01 — single-car rural tram, parked on the track.
// Level stack: wheels 0–0.22, bogie 0.16–0.32, floor slab 0.42–0.48, body 0.48–2.38.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("station_tram_vehicle_01", "station", ["tram", "vehicle"]);
  const L = 6.0; // along X
  const W = 2.0; // along Z

  // bogies + wheels
  for (let b = 0; b < 2; b++) {
    const bx = b === 0 ? -L / 2 + 1.1 : L / 2 - 1.1;
    partAt(root, box(1.2, 0.16, W - 0.3), "mat_metal_painted_black", `bogie_${b + 1}`, bx, 0.24, 0);
    for (let s = 0; s < 2; s++) {
      for (let k = 0; k < 2; k++) {
        const x = bx - 0.4 + k * 0.8;
        const z = s === 0 ? -(W - 0.3) / 2 : (W - 0.3) / 2;
        partAt(root, cyl(0.22, 0.22, 0.08, 14), "mat_rubber_tire", `wheel_${b + 1}_${s + 1}_${k + 1}`, x, 0.22, z, Math.PI / 2, 0, 0);
      }
    }
  }

  // floor slab, body, roof
  partAt(root, box(L, 0.06, W), "mat_tram_body_cream", "floor", 0, 0.45, 0);
  partAt(root, box(L, 1.9, W), "mat_tram_body_green", "body", 0, 1.43, 0);
  partAt(root, box(L, 0.12, W + 0.06), "mat_tram_body_cream", "roof", 0, 2.44, 0);

  // window bands (glass skins on the body surface)
  for (let s = 0; s < 2; s++) {
    const z = s === 0 ? -W / 2 - 0.01 : W / 2 + 0.01;
    partAt(root, box(L - 1.2, 1.0, 0.02), "mat_tram_window", `window_band_${s + 1}`, 0, 1.53, z);
  }
  partAt(root, box(0.02, 1.0, W - 0.4), "mat_tram_window", "windshield", L / 2 + 0.01, 1.53, 0);

  // side door
  partAt(root, box(0.9, 1.7, 0.03), "mat_metal_painted_white", "door", -1.6, 1.36, -W / 2 - 0.02);

  // front panel, headlights, coupler
  partAt(root, box(0.03, 1.9, W), "mat_tram_body_green", "front_panel", L / 2 + 0.02, 1.43, 0);
  for (let k = 0; k < 2; k++) {
    partAt(root, cyl(0.11, 0.11, 0.04, 12), "mat_streetlight_glass", `headlight_${k + 1}`, L / 2 + 0.04, 1.18, -0.5 + k * 1.0, 0, 0, Math.PI / 2);
  }
  partAt(root, box(0.35, 0.12, 0.5), "mat_metal_steel_worn", "coupler", L / 2 + 0.2, 0.35, 0);

  // pantograph
  partAt(root, box(0.6, 0.05, 0.5), "mat_metal_steel", "pantograph_base", 0.6, 2.515, 0);
  partAt(root, box(0.05, 0.55, 0.05), "mat_metal_steel", "pantograph_arm", 0.6, 2.815, 0);
  partAt(root, box(0.7, 0.04, 0.06), "mat_metal_steel_worn", "pantograph_contact", 0.6, 3.11, 0);

  return finalizeAsset(root);
}

export default create;
