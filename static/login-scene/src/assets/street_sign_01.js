// src/assets/street_sign_01 — street name signpost.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("street_sign_01", "street", ["signpost"]);
  const H = 2.2;

  partAt(root, cyl(0.06, 0.07, H, 10), "mat_metal_steel", "post", 0, H / 2, 0);
  partAt(root, box(0.7, 0.34, 0.03), "mat_paper_poster", "plate_main", 0.18, H - 0.1, 0);
  partAt(root, box(0.5, 0.22, 0.03), "mat_paper_poster_accent", "plate_secondary", 0.08, H - 0.45, 0);
  partAt(root, box(0.7, 0.04, 0.04), "mat_sign_band", "plate_frame", 0.18, H + 0.07, 0);

  return finalizeAsset(root);
}

export default create;
