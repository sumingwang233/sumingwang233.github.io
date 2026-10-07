// src/assets/interior_shelf_01 — gondola shelf unit with merchandise blocks.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_shelf_01", "interior", ["shelf", "gondola"]);
  const W = 1.6, D = 0.6, H = 1.8;

  partAt(root, box(W, 0.12, D), "mat_shelf_metal", "plinth", 0, 0.06, 0);
  partAt(root, box(W, H - 0.12, 0.03), "mat_shelf_metal", "back_panel", 0, 0.12 + (H - 0.12) / 2, D / 2 - 0.015);

  const shelfY = [0.5, 0.85, 1.2, 1.55];
  const productMats = ["mat_plastic_red", "mat_plastic_blue", "mat_plastic_yellow", "mat_plastic_green", "mat_cardboard"];

  shelfY.forEach((y, si) => {
    partAt(root, box(W - 0.04, 0.03, D - 0.06), "mat_shelf_metal", `shelf_${si + 1}`, 0, y, 0.02);
    for (let i = 0; i < 6; i++) {
      const x = -W / 2 + 0.14 + i * 0.24;
      const mat = productMats[(si + i) % productMats.length];
      partAt(root, box(0.2, 0.16, 0.14), mat, `product_${si + 1}_${i + 1}`, x, y + 0.095, 0.02);
    }
  });

  // price rail on the front edge of each shelf
  shelfY.forEach((y, si) => {
    partAt(root, box(W - 0.04, 0.05, 0.012), "mat_paper_poster", `price_rail_${si + 1}`, 0, y + 0.04, -D / 2 + 0.07);
  });

  return finalizeAsset(root);
}

export default create;
