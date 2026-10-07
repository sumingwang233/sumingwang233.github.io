// src/assets/interior_poster_lightbox_01 — wall-mounted illuminated poster box.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("interior_poster_lightbox_01", "interior", ["lightbox", "poster"]);
  const W = 0.9, H = 0.6, T = 0.05;

  partAt(root, box(W, H, T), "mat_metal_painted_white", "frame", 0, H / 2, 0);
  partAt(root, box(W - 0.08, H - 0.08, 0.012), "mat_lightbox_emissive", "poster_face", 0, H / 2, -T / 2 - 0.006);
  partAt(root, box(0.24, 0.16, 0.006), "mat_paper_poster_accent", "poster_accent", -0.18, H / 2 + 0.12, -T / 2 - 0.014);
  partAt(root, box(0.5, 0.06, 0.006), "mat_paper_poster", "poster_text", 0.1, H / 2 - 0.16, -T / 2 - 0.014);

  return finalizeAsset(root);
}

export default create;
