// src/assets/props_flower_pot_01 — ceramic pot with spring plant.
import { assetRoot, partAt, finalizeAsset, cyl, sphere, box } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("props_flower_pot_01", "props", ["plant", "pot"]);

  partAt(root, cyl(0.16, 0.13, 0.22, 12), "mat_locker_laminate", "pot", 0, 0.11, 0);
  partAt(root, cyl(0.16, 0.16, 0.02, 12), "mat_locker_laminate", "pot_rim", 0, 0.22, 0);
  partAt(root, cyl(0.14, 0.14, 0.02, 12), "mat_wood_dark", "soil", 0, 0.21, 0);

  partAt(root, cyl(0.012, 0.012, 0.3, 6), "mat_foliage_green", "stem", 0, 0.37, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    partAt(root, box(0.1, 0.012, 0.07), "mat_foliage_green", `leaf_${i + 1}`, Math.cos(a) * 0.07, 0.42 + i * 0.05, Math.sin(a) * 0.07);
  }
  partAt(root, sphere(0.05, 10, 8), "mat_sakura_petal", "flower", 0.03, 0.52, -0.02);

  return finalizeAsset(root);
}

export default create;
