// src/core/assetKit.js
// Shared asset-construction helpers. Node-safe and browser-safe (pure geometry, no DOM).
// Every asset: THREE.Group root, unique assetId, named meshes, named materials,
// pivot = bottom center, root scale exactly 1, transforms baked.

import * as THREE from "three";
import { getMaterial } from "./materialLibrary.js";
import { PROJECT } from "../config/sceneLayout.js";

export function assetRoot(assetId, category, tags = []) {
  const root = new THREE.Group();
  root.name = assetId;
  root.userData = {
    assetId,
    category,
    exportable: true,
    version: PROJECT.version,
    style: PROJECT.style,
    pivot: "bottom_center",
    units: PROJECT.units,
    tags,
  };
  return root;
}

// Add a named mesh part. Mesh name = assetId_partName.
export function part(root, geometry, materialName, partName) {
  const assetId = root.userData.assetId;
  const material = getMaterial(materialName);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${assetId}_${partName}`;
  mesh.castShadow = !material.transparent;
  mesh.receiveShadow = !material.transparent;
  root.add(mesh);
  return mesh;
}

// Bake a mesh's local transform into its geometry (used before export).
export function bakeMesh(mesh) {
  if (!mesh.isMesh) return mesh;
  const m = new THREE.Matrix4();
  m.compose(mesh.position, new THREE.Quaternion().setFromEuler(mesh.rotation), mesh.scale);
  mesh.geometry.applyMatrix4(m);
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
  return mesh;
}

// Bake all descendant transforms into geometry, then normalize pivot to bottom center.
// Returns the local bbox center that was removed (needed for derived assets such as the power wire).
export function finalizeAsset(root) {
  const meshes = [];
  root.traverse((n) => { if (n.isMesh) meshes.push(n); });
  meshes.forEach(bakeMesh);

  const box = new THREE.Box3();
  meshes.forEach((m) => box.expandByObject(m));
  if (box.isEmpty()) return root;

  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const shift = new THREE.Matrix4().makeTranslation(-cx, -box.min.y, -cz);
  meshes.forEach((m) => m.geometry.applyMatrix4(shift));

  root.userData.localBBoxCenter = [cx, box.min.y, cz];
  root.userData.localBBoxSize = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z];
  return root;
}

// Convenience geometry helpers (standard BufferGeometry, standard UV/normals).
export function box(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

export function cyl(rTop, rBottom, h, radialSegments = 16) {
  return new THREE.CylinderGeometry(rTop, rBottom, h, radialSegments);
}

export function sphere(r, wSeg = 12, hSeg = 8) {
  return new THREE.SphereGeometry(r, wSeg, hSeg);
}

export function plane(w, h) {
  return new THREE.PlaneGeometry(w, h);
}

// Place a part with an explicit offset, then bake (keeps exported geometry clean).
export function partAt(root, geometry, materialName, partName, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = part(root, geometry, materialName, partName);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  return bakeMesh(mesh);
}
