// src/assets/interior_storage_locker_01 — staff storage locker.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_storage_locker_01", "interior", ["locker"]);
  const W = 1.0, D = 0.5, H = 1.6;

  partAt(root, box(W, H, D), "mat_locker_laminate", "body", 0, H / 2, 0);
  for (let i = 0; i < 2; i++) {
    const x = -W / 2 + 0.02 + i * (W / 2 - 0.02);
    partAt(root, box(W / 2 - 0.04, H - 0.08, 0.015), "mat_locker_laminate", `door_${i + 1}`, x + (W / 2 - 0.04) / 2 - 0.005, H / 2, -D / 2 - 0.007);
    partAt(root, box(0.03, 0.12, 0.02), "mat_plastic_black", `handle_${i + 1}`, x + (W / 2 - 0.04) - 0.03, 0.9, -D / 2 - 0.02);
  }
  // bag on top
  partAt(root, box(0.4, 0.25, 0.3), "mat_cardboard", "bag", 0.1, H + 0.125, 0);

  return finalizeAsset(root);
}

export default create;
