// src/assets/architecture_store_hvac_unit_01 — outdoor condenser on the west wall.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("architecture_store_hvac_unit_01", "architecture", ["hvac", "metal"]);
  const W = 0.9, H = 0.7, D = 0.35;

  partAt(root, box(W, H, D), "mat_metal_painted_white", "body", 0, H / 2, 0);
  // fan grille on the side face
  partAt(root, cyl(0.26, 0.26, 0.02, 16), "mat_metal_steel_worn", "fan_grille", 0.2, H / 2, D / 2 + 0.01, Math.PI / 2, 0, 0);
  partAt(root, cyl(0.06, 0.06, 0.03, 10), "mat_metal_painted_black", "fan_hub", 0.2, H / 2, D / 2 + 0.02, Math.PI / 2, 0, 0);
  // louvers on the top
  for (let i = 0; i < 4; i++) {
    partAt(root, box(W - 0.1, 0.02, 0.06), "mat_metal_steel", `louver_${i + 1}`, 0, H + 0.01, -D / 2 + 0.06 + i * 0.07);
  }
  // feet
  for (let s = 0; s < 2; s++) {
    const x = s === 0 ? -W / 2 + 0.08 : W / 2 - 0.08;
    partAt(root, box(0.08, 0.06, D - 0.06), "mat_metal_steel_worn", `foot_${s + 1}`, x, 0.03, 0);
  }
  // refrigerant pipe to the wall
  partAt(root, cyl(0.03, 0.03, 0.5, 8), "mat_plastic_white", "pipe", -W / 2 - 0.25, H - 0.15, 0, 0, 0, Math.PI / 2);

  return finalizeAsset(root);
}

export default create;
