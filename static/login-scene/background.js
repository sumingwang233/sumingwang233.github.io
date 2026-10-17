import * as THREE from 'three';
import { createRenderer } from './src/core/renderer.js';
import { createCamera, fitCamera } from './src/core/camera.js';
import { createLights } from './src/core/lights.js';
import { SceneManager } from './src/core/sceneManager.js';
import { INSTANCES } from './src/config/sceneLayout.js';
import { create as createPetals } from './src/effects/petalFall.js';

const host = document.querySelector('#login-scene');
if (host) start();

async function start() {
  const canvas = document.createElement('canvas');
  let renderer;
  try {
    host.append(canvas);
    renderer = createRenderer(canvas);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8e4dc');
    const camera = createCamera();
    // A lower, nearer viewpoint so the shop front and the counter belong to the same room.
    camera.position.set(12, 4.2, -14);
    camera.userData.lookAt = [0, 2.2, -2];
    camera.userData.viewDirection = camera.position.clone().sub(new THREE.Vector3(0, 2.2, -2)).normalize();
    camera.lookAt(0, 2.2, -2);
    const lights = createLights(scene);
    lights.sky.intensity = 0.8;
    lights.sun.shadow.normalBias = 0.025;
    renderer.toneMappingExposure = 1.05;
    // The models and sun are static; only the non-shadowing petals move.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const manager = new SceneManager(scene);
    // Warm the source modules concurrently instead of waiting on one network trip per asset.
    await Promise.all([...new Set(INSTANCES.filter(item => item.visible).map(item => item.assetId))]
      .map(id => import(`./src/assets/${id}.js`)));
    await manager.build();
    if (manager.missing.length) throw new Error('Incomplete login scene');
    const bounds = new THREE.Box3().setFromObject(manager.getAssetLayer());
    // Soft contact shadow under the diorama so the miniature sits on the page instead of floating.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 256;
    const shadowContext = shadowCanvas.getContext('2d');
    const shadowGradient = shadowContext.createRadialGradient(128, 128, 26, 128, 128, 126);
    shadowGradient.addColorStop(0, 'rgba(74, 64, 46, 0.32)');
    shadowGradient.addColorStop(0.58, 'rgba(74, 64, 46, 0.18)');
    shadowGradient.addColorStop(1, 'rgba(74, 64, 46, 0)');
    shadowContext.fillStyle = shadowGradient;
    shadowContext.fillRect(0, 0, 256, 256);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(42, 42),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.02;
    contactShadow.renderOrder = -1;
    scene.add(contactShadow);
    const petals = createPetals({ group: manager.getEffectLayer(), sceneManager: manager });
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const counter = document.querySelector('.account-counter');
    const header = document.querySelector('.masthead-academic');
    let elapsed = 0, previous = 0, disposed = false, lost = false;
    // The diorama is fitted to the room above the counter; the box is cropped around
    // its centre so the street fills that space instead of shrinking into a model on a table.
    function cropped(source, factor) {
      const box = source.clone();
      if (factor > 0 && factor < 1) {
        const center = box.getCenter(new THREE.Vector3());
        const half = box.getSize(new THREE.Vector3()).multiplyScalar(factor / 2);
        box.min.set(center.x - half.x, box.min.y, center.z - half.z);
        box.max.set(center.x + half.x, box.max.y, center.z + half.z);
      }
      return box;
    }
    function resize() {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height || disposed) return;
      const narrow = width < 900;
      const counterTop = counter ? Math.min(height, counter.getBoundingClientRect().top) : height;
      const frameHeight = Math.max(1, counterTop + (narrow ? 12 : 28));
      // A frame wider than the viewport lets the street bleed past both edges instead of
      // sitting on the page like a model on a table.
      const bleed = narrow ? 0.12 : 0.16;
      fitCamera(camera, cropped(bounds, narrow ? 0.56 : 0.66), { width, height }, {
        left: -width * bleed / 2,
        top: 0,
        width: width * (1 + bleed),
        height: frameHeight,
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 768 ? 1 : 1.5));
      renderer.setSize(width, height, false);
      if (!lost) renderer.render(scene, camera);
    }
    function frame(time) {
      if (previous && time - previous < 1000 / 30) return;
      const dt = previous ? Math.min((time - previous) / 1000, 0.1) : 0;
      previous = time;
      elapsed += dt;
      petals.update(dt, elapsed);
      renderer.render(scene, camera);
    }
    function updateMotion() {
      renderer.setAnimationLoop(null);
      previous = 0;
      if (disposed || lost || document.hidden) return;
      if (motion.matches) renderer.render(scene, camera);
      else renderer.setAnimationLoop(frame);
    }
    const observer = new ResizeObserver(resize);
    for (const element of [host, counter].filter(Boolean)) observer.observe(element);
    motion.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateMotion);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); lost = true;
      host.removeAttribute('data-ready'); updateMotion();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      lost = false; renderer.shadowMap.needsUpdate = true;
      host.setAttribute('data-ready', ''); resize(); updateMotion();
    });
    window.addEventListener('pageshow', updateMotion);
    window.addEventListener('pagehide', event => {
      renderer.setAnimationLoop(null);
      if (event.persisted) return;
      disposed = true;
      observer.disconnect();
      motion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateMotion);
      window.removeEventListener('pageshow', updateMotion);
      scene.traverse(object => {
        object.geometry?.dispose();
        for (const material of [object.material].flat().filter(Boolean)) material.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
    });
    host.setAttribute('data-ready', '');
    resize();
    updateMotion();
  } catch {
    // WebGL or asset failures leave the paper panel and authentication usable.
    host.removeAttribute('data-ready');
    renderer?.setAnimationLoop(null);
    renderer?.dispose();
    renderer?.forceContextLoss();
    canvas.remove();
  }
}
