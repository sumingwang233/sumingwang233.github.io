// src/assets/interior_floor_guide_line_01 — guide line from entrance to checkout.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_floor_guide_line_01", "interior", ["guide", "floor"]);
  const L = 3.0, W = 0.12;

  partAt(root, box(L, 0.006, W), "mat_guide_line", "line", 0, 0.003, 0);
  // arrow head
  partAt(root, box(0.25, 0.006, 0.3), "mat_guide_line", "arrow", L / 2 - 0.12, 0.003, 0);
  // entrance start marker
  partAt(root, box(0.3, 0.006, 0.3), "mat_paper_poster", "start_marker", -L / 2 + 0.15, 0.003, 0);

  return finalizeAsset(root);
}

export default create;
