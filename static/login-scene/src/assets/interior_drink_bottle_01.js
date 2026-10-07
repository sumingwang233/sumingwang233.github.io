// src/assets/interior_drink_bottle_01 — single PET bottle (shelf merchandise sample).
import { assetRoot, partAt, finalizeAsset, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_drink_bottle_01", "interior", ["bottle", "merchandise"]);

  partAt(root, cyl(0.035, 0.035, 0.18, 12), "mat_plastic_clear_bottle", "body", 0, 0.09, 0);
  partAt(root, cyl(0.035, 0.02, 0.04, 12), "mat_plastic_clear_bottle", "shoulder", 0, 0.2, 0);
  partAt(root, cyl(0.018, 0.018, 0.03, 10), "mat_plastic_clear_bottle", "neck", 0, 0.235, 0);
  partAt(root, cyl(0.021, 0.021, 0.012, 10), "mat_plastic_blue", "cap", 0, 0.256, 0);
  partAt(root, cyl(0.036, 0.036, 0.06, 12), "mat_paper_poster", "label", 0, 0.11, 0);

  return finalizeAsset(root);
}

export default create;
