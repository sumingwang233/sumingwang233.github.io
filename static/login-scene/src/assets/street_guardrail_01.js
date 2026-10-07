// src/assets/street_guardrail_01 — 6 m section of corrugated metal guardrail.
import { assetRoot, partAt, finalizeAsset, box, cyl } from "../core/assetKit.js";

export function create() {
  const root = assetRoot("street_guardrail_01", "street", ["guardrail", "metal"]);
  const L = 6.0;

  for (let i = 0; i < 7; i++) {
    const x = -L / 2 + i * (L / 6);
    partAt(root, cyl(0.05, 0.06, 0.75, 10), "mat_metal_steel", `post_${i + 1}`, x, 0.375, 0);
  }
  // corrugated beam (approximated with three stacked bands)
  for (let i = 0; i < 3; i++) {
    partAt(root, box(L, 0.12, 0.05), "mat_metal_painted_green", `beam_${i + 1}`, 0, 0.42 + i * 0.13, 0);
  }
  partAt(root, box(L, 0.05, 0.08), "mat_metal_steel_worn", "beam_cap", 0, 0.83, 0);

  return finalizeAsset(root);
}

export default create;
