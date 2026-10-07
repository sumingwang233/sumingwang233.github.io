// src/assets/props_doormat_01 — entrance mat.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_doormat_01", "props", ["mat"]);
  const W = 1.6, D = 0.9, H = 0.02;

  partAt(root, box(W, H, D), "mat_fabric_mat", "mat_body", 0, H / 2, 0);
  partAt(root, box(W - 0.2, 0.006, D - 0.2), "mat_paper_poster", "logo_patch", 0, H + 0.003, 0);

  return finalizeAsset(root);
}

export default create;
