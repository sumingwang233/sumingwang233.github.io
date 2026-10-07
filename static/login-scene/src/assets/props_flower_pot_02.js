// src/assets/props_flower_pot_02 — wooden planter box with low greenery.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_flower_pot_02", "props", ["planter"]);
  const W = 0.5, D = 0.35, H = 0.28;

  partAt(root, box(W, H, D), "mat_wood_dark", "box", 0, H / 2, 0);
  partAt(root, box(W - 0.06, 0.03, D - 0.06), "mat_wood_dark", "soil", 0, H - 0.015, 0);

  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 0.08 + i * 0.085;
    partAt(root, cyl(0.01, 0.01, 0.16, 6), "mat_foliage_green", `stem_${i + 1}`, x, H + 0.08, 0);
    partAt(root, box(0.07, 0.012, 0.05), i % 2 ? "mat_sakura_petal" : "mat_foliage_green", `leaf_${i + 1}`, x, H + 0.16, 0);
  }

  return finalizeAsset(root);
}

export default create;
