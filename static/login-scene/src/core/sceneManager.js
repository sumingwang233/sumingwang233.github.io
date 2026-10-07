// src/core/sceneManager.js — assembles the asset layer from config-driven layout.
// Asset layer = exportable. Effect layer = preview-only, kept separate.
import * as THREE from "three";
import { INSTANCES, assetMeta, deg2rad } from "../config/sceneLayout.js";

export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.assetLayer = new THREE.Group();
    this.assetLayer.name = "ASSET_LAYER";
    this.effectLayer = new THREE.Group();
    this.effectLayer.name = "FX_LAYER";
    scene.add(this.assetLayer, this.effectLayer);
    this.assets = new Map();   // instanceId -> asset root
    this.missing = [];
  }

  async loadAsset(assetId) {
    const meta = assetMeta(assetId);
    if (!meta) throw new Error(`Asset not in registry: ${assetId}`);
    let mod;
    try {
      mod = await import(`../assets/${assetId}.js`);
    } catch (err) {
      this.missing.push(assetId);
      return null;
    }
    const create = mod.create || mod.default;
    if (typeof create !== "function") throw new Error(`No create function in ${meta.file}`);
    const root = create();
    if (!root.isGroup) throw new Error(`Asset root must be THREE.Group: ${assetId}`);
    return root;
  }

  async build() {
    for (const inst of INSTANCES) {
      const root = await this.loadAsset(inst.assetId);
      if (!root) continue;
      if (!inst.visible) continue;
      root.position.set(inst.position[0], inst.position[1], inst.position[2]);
      root.rotation.set(deg2rad(inst.rotation[0]), deg2rad(inst.rotation[1]), deg2rad(inst.rotation[2]));
      root.scale.set(inst.scale[0], inst.scale[1], inst.scale[2]);
      root.userData.instanceId = inst.instanceId;
      this.assetLayer.add(root);
      this.assets.set(inst.instanceId, root);
    }
    return this.assets;
  }

  getAssetLayer() { return this.assetLayer; }
  getEffectLayer() { return this.effectLayer; }
}
