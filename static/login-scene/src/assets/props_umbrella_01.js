// src/assets/props_umbrella_01 — closed umbrella leaning in the stand.
import { assetRoot, partAt, finalizeAsset, cyl, sphere } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_umbrella_01", "props", ["umbrella"]);
  const H = 1.0;

  partAt(root, cyl(0.015, 0.015, H, 8), "mat_metal_steel", "shaft", 0, H / 2, 0);
  partAt(root, cyl(0.03, 0.02, 0.12, 8), "mat_plastic_black", "handle", 0, 0.06, 0);
  partAt(root, cyl(0.05, 0.02, 0.35, 8), "mat_plastic_blue", "canopy_bundle", 0, H - 0.175, 0);
  partAt(root, cyl(0.012, 0.012, 0.08, 6), "mat_metal_steel", "tip", 0, H + 0.04, 0);

  return finalizeAsset(root);
}

export default create;
