// src/assets/props_umbrella_stand_01 — entrance umbrella stand.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_umbrella_stand_01", "props", ["stand"]);
  const W = 0.5, D = 0.4, H = 0.6;

  partAt(root, box(W, H, D), "mat_metal_painted_black", "body", 0, H / 2, 0);
  partAt(root, box(W + 0.04, 0.03, D + 0.04), "mat_stainless", "rim", 0, H + 0.015, 0);
  partAt(root, box(W - 0.1, 0.02, D - 0.1), "mat_plastic_black", "inner_tray", 0, H - 0.02, 0);
  // top ring
  partAt(root, cyl(0.12, 0.12, 0.02, 12), "mat_stainless", "ring", 0, H + 0.05, 0);

  return finalizeAsset(root);
}

export default create;
