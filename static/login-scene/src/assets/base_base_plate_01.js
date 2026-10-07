// src/assets/base_base_plate_01.js — square solid-color base plate.
import * as THREE from "three";
import { assetRoot, partAt, finalizeAsset, box } from "../core/assetKit.js";
import { BASE_PLATE } from "../config/sceneLayout.js";

export function create() {
  const root = assetRoot("base_base_plate_01", "base", ["plate", "ground"]);
  const { size, thickness } = BASE_PLATE;
  partAt(root, box(size, thickness, size), "mat_base_plate", "plate", 0, thickness / 2, 0);
  return finalizeAsset(root);
}

export default create;
