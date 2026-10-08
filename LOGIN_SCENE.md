# Login scene

The account-page background reuses the owner's test02 Japanese station-corner convenience-store diorama. The asset modules, layout, materials, camera, lighting, renderer and petal effect are copied from the original prototype; editing this website does not change that project.

`background.js` fits the complete diorama into the space beside the desktop login panel, or above it on mobile. Its fixed viewing angle avoids drift and cropping as the form changes size. Opaque meshes cast and receive cached static shadows; transparent glass does not write depth or cast solid shadows. Petal spread uses the canopy's dimensions, independent of its world position. Resolution and frame rate are capped; reduced-motion support and a paper-colored WebGL fallback remain available. Prototype debug tools, export tooling and developer HUD are excluded.

Three.js 0.168.0 is served locally from `static/login-scene/lib/three.module.min.js`, with its MIT license in `static/login-scene/lib/three-LICENSE.txt`. The account-only import map resolves the original modules' `three` imports without a CDN or an additional package installation.
