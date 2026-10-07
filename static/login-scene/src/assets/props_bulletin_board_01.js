// src/assets/props_bulletin_board_01 — community notice board.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_bulletin_board_01", "props", ["board"]);
  const H = 1.6, W = 1.1, boardH = 0.7;

  for (let s = 0; s < 2; s++) {
    const x = s === 0 ? -W / 2 + 0.05 : W / 2 - 0.05;
    partAt(root, cyl(0.04, 0.05, H, 8), "mat_wood_dark", `post_${s + 1}`, x, H / 2, 0);
  }

  partAt(root, box(W, boardH, 0.04), "mat_wood_light", "board", 0, H - boardH / 2, 0);
  partAt(root, box(W + 0.1, 0.06, 0.08), "mat_wood_dark", "frame_top", 0, H + 0.03, 0);

  // pinned notices
  const papers = ["mat_paper_poster", "mat_paper_poster_accent"];
  for (let i = 0; i < 4; i++) {
    const x = -W / 2 + 0.16 + i * 0.24;
    const y = H - boardH / 2 + (i % 2 ? 0.12 : -0.12);
    partAt(root, box(0.2, 0.24, 0.006), papers[i % 2], `notice_${i + 1}`, x, y, -0.023);
  }

  return finalizeAsset(root);
}

export default create;
