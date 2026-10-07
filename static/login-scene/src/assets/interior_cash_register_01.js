// src/assets/interior_cash_register_01 — register on the counter top.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_cash_register_01", "interior", ["register"]);
  const W = 0.42, D = 0.32, H = 0.28;

  partAt(root, box(W, H, D), "mat_plastic_black", "body", 0, H / 2, 0);
  partAt(root, box(W - 0.06, 0.02, D - 0.06), "mat_plastic_white", "keypad", 0, H + 0.01, -0.04);
  // customer-facing screen, tilted
  partAt(root, box(0.24, 0.18, 0.02), "mat_plastic_black", "screen_back", 0, H + 0.12, 0.06, -0.25, 0, 0);
  partAt(root, box(0.22, 0.16, 0.006), "mat_lightbox_emissive", "screen_face", 0, H + 0.12, 0.075, -0.25, 0, 0);
  // scanner
  partAt(root, box(0.08, 0.05, 0.06), "mat_plastic_black", "scanner", W / 2 - 0.05, H + 0.025, 0.08);
  // receipt slot
  partAt(root, box(0.12, 0.01, 0.02), "mat_paper_poster", "receipt", -W / 2 + 0.08, H + 0.005, 0.1);

  return finalizeAsset(root);
}

export default create;
