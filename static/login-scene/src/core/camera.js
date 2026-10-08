// src/core/camera.js — third-person free viewing camera (preview layer).
import * as THREE from "three";
import { GROUND_Y } from "../config/sceneLayout.js";

export function createCamera(width = 1280, height = 720) {
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
  camera.position.set(12, 9, -14);
  camera.userData.lookAt = [0, 1.2, -1.5];
  camera.lookAt(camera.userData.lookAt[0], camera.userData.lookAt[1] + GROUND_Y, camera.userData.lookAt[2]);
  camera.userData.viewDirection = camera.position.clone().sub(new THREE.Vector3(0, 1.2 + GROUND_Y, -1.5)).normalize();
  return camera;
}

// Fit every corner inside the unobscured area, retaining the source viewing angle.
export function fitCamera(camera, bounds, viewport, frame) {
  const target = bounds.getCenter(new THREE.Vector3());
  camera.position.copy(target).add(camera.userData.viewDirection);
  camera.lookAt(target);
  const inverse = camera.quaternion.clone().invert();
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const horizontal = tangent * frame.width / viewport.height * 0.9;
  const vertical = tangent * frame.height / viewport.height * 0.9;
  let distance = 1;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).sub(target).applyQuaternion(inverse);
        distance = Math.max(distance, point.z + Math.abs(point.x) / horizontal, point.z + Math.abs(point.y) / vertical);
      }
    }
  }
  camera.position.copy(target).addScaledVector(camera.userData.viewDirection, distance);
  camera.far = Math.max(200, distance + bounds.getSize(new THREE.Vector3()).length());
  camera.setViewOffset(viewport.width, viewport.height,
    viewport.width / 2 - frame.left - frame.width / 2,
    viewport.height / 2 - frame.top - frame.height / 2,
    viewport.width, viewport.height);
  camera.updateMatrixWorld();
}
