// src/assets/street_utility_pole_02 — concrete pole, crossarms, insulators (mirror variant).
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";
import { POWER_WIRE } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("street_utility_pole_02", "street", ["pole", "concrete"]);
  const H = 6.5;

  partAt(root, cyl(0.26, 0.26, 0.12, 12), "mat_concrete", "base", 0, 0.06, 0);
  partAt(root, cyl(0.14, 0.18, H - 0.12, 12), "mat_metal_pole_concrete", "pole", 0, 0.12 + (H - 0.12) / 2, 0);

  const armY = POWER_WIRE.attachmentY;
  partAt(root, box(0.06, 0.06, 1.1), "mat_metal_steel_worn", "crossarm_top", 0, armY, 0);
  partAt(root, box(0.06, 0.06, 0.9), "mat_metal_steel_worn", "crossarm_mid", 0, armY - 0.8, 0);

  for (let i = 0; i < 3; i++) {
    const z = -0.45 + i * 0.45;
    partAt(root, cyl(0.05, 0.06, 0.14, 8), "mat_plastic_white", `insulator_top_${i + 1}`, 0, armY + 0.1, z);
    if (i < 2) partAt(root, cyl(0.05, 0.06, 0.14, 8), "mat_plastic_white", `insulator_mid_${i + 1}`, 0, armY - 0.7, -0.3 + i * 0.6);
  }

  // guy wire anchor plate on the pole surface
  partAt(root, box(0.2, 0.2, 0.04), "mat_metal_steel", "guy_anchor", 0.2, 1.2, 0.3);

  return finalizeAsset(root);
}

export default create;
