// src/assets/street_traffic_light_01
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("street_traffic_light_01", "street", ["signal"]);
  const H = 2.6;

  partAt(root, cyl(0.08, 0.1, H, 12), "mat_metal_painted_black", "pole", 0, H / 2, 0);
  partAt(root, cyl(0.18, 0.18, 0.06, 12), "mat_concrete", "base", 0, 0.03, 0);

  // housing
  const hy = H + 0.35;
  partAt(root, box(0.34, 0.9, 0.3), "mat_metal_painted_black", "housing", 0, hy, 0);
  for (let i = 0; i < 3; i++) {
    const y = hy + 0.3 - i * 0.3;
    partAt(root, box(0.28, 0.26, 0.06), "mat_metal_painted_black", `hood_${i + 1}`, 0, y, -0.18);
    const mat = i === 0 ? "mat_signal_red" : i === 1 ? "mat_signal_amber" : "mat_signal_green";
    partAt(root, cyl(0.11, 0.11, 0.03, 12), mat, `lens_${i + 1}`, 0, y, -0.16, Math.PI / 2, 0, 0);
  }

  return finalizeAsset(root);
}

export default create;
