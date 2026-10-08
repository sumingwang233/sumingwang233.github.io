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
    const petals = createPetals({ group: manager.getEffectLayer(), sceneManager: manager });
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const panel = document.querySelector('.account-page');
    const header = document.querySelector('.masthead-academic');
    const footer = document.querySelector('.footer-academic');
    let elapsed = 0, previous = 0, disposed = false, lost = false;
    function resize() {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height || disposed) return;
      const top = (header?.getBoundingClientRect().bottom || 0) + 24;
      const panelRect = panel.getBoundingClientRect();
      const desktop = width > 768;
      const bottom = desktop ? height - (footer?.offsetHeight || 0) - 24 : Math.min(height - 24, panelRect.top + scrollY - 24);
      fitCamera(camera, bounds, { width, height }, {
        left: 24, top,
        width: Math.max(1, (desktop ? panelRect.left : width) - 48),
        height: Math.max(1, bottom - top),
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
    for (const element of [host, panel, header, footer].filter(Boolean)) observer.observe(element);
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
