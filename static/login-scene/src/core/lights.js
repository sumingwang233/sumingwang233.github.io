// src/core/lights.js — sunny warm daytime preview lighting.
// Lights are preview context, not exported assets (documented in effects.json).
import * as THREE from "three";
import { GROUND_Y } from "../config/sceneLayout.js";

export function createLights(scene) {
  const group = new THREE.Group();
  group.name = "PREVIEW_LIGHTS";

  const sky = new THREE.HemisphereLight("#f2f6f2", "#e3d9c6", 1.05);
  sky.name = "light_hemisphere_spring_sky";
  group.add(sky);

  const sun = new THREE.DirectionalLight("#fff0cf", 1.75);
  sun.name = "light_sun_warm_daytime";
  sun.position.set(9, 14, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0006;
  group.add(sun);

  const fill = new THREE.DirectionalLight("#d6e4ea", 0.55);
  fill.name = "light_fill_sky_bounce";
  fill.position.set(-8, 6, 10);
  group.add(fill);

  scene.add(group);
  return { group, sky, sun, fill, groundY: GROUND_Y };
}
