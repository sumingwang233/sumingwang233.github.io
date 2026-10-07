// src/assets/interior_backdoor_01 — rear staff door.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_backdoor_01", "interior", ["door"]);
  const W = 0.9, H = 2.0;

  partAt(root, box(W, H, 0.04), "mat_metal_painted_white", "leaf", 0, H / 2, 0);
  partAt(root, box(W + 0.1, 0.06, 0.06), "mat_metal_painted_white", "frame_top", 0, H + 0.03, 0);
  partAt(root, box(0.05, H, 0.06), "mat_metal_painted_white", "frame_left", -W / 2 - 0.025, H / 2, 0);
  partAt(root, box(0.05, H, 0.06), "mat_metal_painted_white", "frame_right", W / 2 + 0.025, H / 2, 0);
  partAt(root, box(0.03, 0.14, 0.03), "mat_stainless", "handle", W / 2 - 0.06, 1.05, -0.03);
  partAt(root, box(0.2, 0.14, 0.006), "mat_paper_poster", "notice", -0.15, 1.5, -0.023);

  return finalizeAsset(root);
}

export default create;
