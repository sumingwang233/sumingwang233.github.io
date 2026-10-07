// src/assets/interior_magazine_rack_01 — magazine rack near the checkout.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_magazine_rack_01", "interior", ["magazine", "rack"]);
  const W = 0.9, D = 0.45, H = 1.0;

  partAt(root, box(W, 0.08, D), "mat_shelf_metal", "base", 0, 0.04, 0);
  for (let i = 0; i < 3; i++) {
    const y = 0.2 + i * 0.26;
    partAt(root, box(W - 0.06, 0.02, D - 0.08), "mat_shelf_metal", `tier_${i + 1}`, 0, y, 0);
    for (let k = 0; k < 4; k++) {
      const x = -W / 2 + 0.12 + k * 0.2;
      partAt(root, box(0.16, 0.22, 0.012), k % 2 ? "mat_paper_poster" : "mat_paper_poster_accent", `magazine_${i + 1}_${k + 1}`, x, y + 0.12, -0.02, -0.2, 0, 0);
    }
  }

  return finalizeAsset(root);
}

export default create;
