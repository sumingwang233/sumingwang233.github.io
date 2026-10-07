# Login scene

The account-page background reuses the owner's test02 Japanese station-corner convenience-store diorama. The asset modules, layout, materials, camera, lighting, renderer and petal effect are copied from the original prototype; editing this website does not change that project.

`background.js` adapts the original scene for a decorative login background: a fixed camera with a small, slow movement, capped resolution and frame rate, cached static shadows, reduced-motion support, and a paper-colored fallback when WebGL is unavailable. It does not import the prototype's debug tools, export tooling or developer HUD.

Three.js 0.168.0 is served locally from `static/login-scene/lib/three.module.min.js`, with its MIT license in `static/login-scene/lib/three-LICENSE.txt`. The account-only import map resolves the original modules' `three` imports without a CDN or an additional package installation.
