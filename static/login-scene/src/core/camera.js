// src/core/camera.js — third-person free viewing camera (preview layer).
import * as THREE from "three";
import { GROUND_Y } from "../config/sceneLayout.js";

export function createCamera(width = 1280, height = 720) {
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
  camera.position.set(12, 9, -14);
  camera.userData.lookAt = [0, 1.2, -1.5];
  camera.lookAt(camera.userData.lookAt[0], camera.userData.lookAt[1] + GROUND_Y, camera.userData.lookAt[2]);
  return camera;
}
