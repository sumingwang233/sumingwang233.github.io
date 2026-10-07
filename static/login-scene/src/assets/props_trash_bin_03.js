// src/assets/props_trash_bin_03 — paper waste bin (green lid).
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_trash_bin_03", "props", ["bin", "paper"]);
  const W = 0.45, D = 0.45, H = 0.7;

  partAt(root, cyl(W / 2, W / 2 + 0.03, H, 12), "mat_plastic_black", "body", 0, H / 2, 0);
  partAt(root, cyl(W / 2 + 0.02, W / 2 + 0.02, 0.04, 12), "mat_plastic_green", "lid", 0, H + 0.02, 0);
  partAt(root, box(0.12, 0.02, 0.06), "mat_paper_poster", "label", 0, 0.4, -D / 2 - 0.005);

  return finalizeAsset(root);
}

export default create;
