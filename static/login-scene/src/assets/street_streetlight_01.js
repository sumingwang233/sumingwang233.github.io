// src/assets/street_streetlight_01 — retro cast-iron street lamp.
import { assetRoot, partAt, finalizeAsset, box, cyl, sphere } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("street_streetlight_01", "street", ["retro", "lamp"]);
  const H = 4.0;

  partAt(root, cyl(0.12, 0.16, 0.25, 12), "mat_metal_painted_black", "base", 0, 0.125, 0);
  partAt(root, cyl(0.07, 0.1, H - 0.6, 12), "mat_metal_painted_black", "post", 0, 0.25 + (H - 0.6) / 2, 0);

  // curved arm
  partAt(root, box(0.06, 0.06, 0.5), "mat_metal_painted_black", "arm", 0, H - 0.4, 0.25, 0, 0, Math.PI / 2);
  partAt(root, box(0.06, 0.45, 0.06), "mat_metal_painted_black", "arm_drop", 0, H - 0.2, 0.5);

  // lantern (cap sits on top of the glass, no penetration)
  partAt(root, sphere(0.18, 12, 8), "mat_streetlight_glass", "lantern_glass", 0, H - 0.35, 0.5);
  partAt(root, cyl(0.14, 0.2, 0.12, 10), "mat_metal_painted_black", "lantern_cap", 0, H - 0.11, 0.5);
  partAt(root, cyl(0.05, 0.08, 0.1, 8), "mat_metal_painted_black", "lantern_finial", 0, H - 0.02, 0.5);

  return finalizeAsset(root);
}

export default create;
