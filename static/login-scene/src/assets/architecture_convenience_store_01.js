// src/assets/architecture_convenience_store_01 — building shell (front opening left for the glass facade).
// Walls are built so faces meet without penetrating: back wall full width, side walls between the wall thicknesses.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { ZONES } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("architecture_convenience_store_01", "architecture", ["building", "shell"]);
  const [x0, x1] = ZONES.store.x;
  const [z0, z1] = ZONES.store.z;
  const W = x1 - x0;   // 8.0
  const D = z1 - z0;   // 5.6
  const H = ZONES.store.height; // 3.2
  const t = 0.15;
  const lintelH = 0.6;

  // floor slab (thin)
  partAt(root, box(W, 0.02, D), "mat_floor_tile", "floor", 0, 0.01, 0);

  // walls
  partAt(root, box(W, H, t), "mat_wall_exterior", "wall_back", 0, H / 2, D / 2 - t / 2);
  for (let s = 0; s < 2; s++) {
    const x = s === 0 ? -W / 2 + t / 2 : W / 2 - t / 2;
    partAt(root, box(t, H, D - 2 * t), "mat_wall_exterior", `wall_${s === 0 ? "left" : "right"}`, x, H / 2, 0);
    // front corner column (between floor and lintel)
    partAt(root, box(t, H - lintelH, t), "mat_wall_exterior", `front_column_${s + 1}`, x, (H - lintelH) / 2, -D / 2 + t / 2);
  }

  // front lintel band above the glass
  partAt(root, box(W, lintelH, t), "mat_wall_exterior", "front_lintel", 0, H - lintelH / 2, -D / 2 + t / 2);

  // roof
  partAt(root, box(W + 0.3, 0.12, D + 0.3), "mat_roof_metal", "roof", 0, H + 0.06, 0);

  // shop sign band on the lintel front face
  partAt(root, box(W - 0.4, 0.34, 0.02), "mat_sign_band", "sign_band", 0, H - 0.3, -D / 2 - 0.01);

  // interior ceiling plane (thin) so the inside reads as a room
  partAt(root, box(W - 2 * t, 0.01, D - 2 * t), "mat_wall_interior", "ceiling", 0, H - lintelH - 0.01, 0);

  return finalizeAsset(root);
}

export default create;
