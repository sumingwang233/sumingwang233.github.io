// src/assets/nature_sakura_petal_pile_02 — petal drift in the alley.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("nature_sakura_petal_pile_02", "nature", ["petals", "ground"]);

  const petals = [
    [0, 0, 0, 0.08], [0.14, 0.02, -0.12, 0.07], [-0.18, 0.01, 0.1, 0.07],
    [0.08, 0.03, 0.16, 0.06], [-0.1, 0.04, -0.05, 0.06], [0.2, 0.02, 0.05, 0.05],
    [-0.24, 0.03, -0.02, 0.05],
  ];
  petals.forEach(([x, y, z, s], i) => {
    partAt(root, box(s, 0.006, s * 0.7), i % 2 ? "mat_sakura_petal" : "mat_sakura_canopy_deep", `petal_${i + 1}`, x, y, z, 0, i * 0.6, 0);
  });

  return finalizeAsset(root);
}

export default create;
