// src/assets/nature_sakura_petal_pile_01 — fallen petal cluster on the pavement.
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("nature_sakura_petal_pile_01", "nature", ["petals", "ground"]);

  const petals = [
    [0, 0, 0, 0.09], [0.18, 0.02, 0.12, 0.08], [-0.15, 0.01, -0.1, 0.08],
    [0.05, 0.03, -0.16, 0.07], [-0.22, 0.02, 0.08, 0.07], [0.25, 0.01, -0.05, 0.06],
    [-0.05, 0.04, 0.18, 0.06], [0.12, 0.05, 0.02, 0.05],
  ];
  petals.forEach(([x, y, z, s], i) => {
    partAt(root, box(s, 0.006, s * 0.7), i % 3 === 0 ? "mat_sakura_petal" : "mat_sakura_canopy", `petal_${i + 1}`, x, y, z, 0, i * 0.4, 0);
  });

  return finalizeAsset(root);
}

export default create;
