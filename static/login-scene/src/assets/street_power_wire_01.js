// src/assets/street_power_wire_01 — generated from the two utility pole instances.
// Exported as a tube mesh (BufferGeometry), never as LineSegments.
import * as THREE from "three";
import { assetRoot, finalizeAsset } from "../core/assetKit.js";
import { getMaterial } from "../core/materialLibrary.js";
import { POWER_WIRE, wireEndpoints } from "../config/sceneLayout.js";

function catenary(a, b, offset, segments, sag) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t + offset;
    const y = a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

export function create() {
  const root = assetRoot("street_power_wire_01", "street", ["wire", "catenary", "generated"]);
  const poles = wireEndpoints();
  const a = poles[0].attachPoint;
  const b = poles[1].attachPoint;

  const offsets = POWER_WIRE.zOffsets;
  offsets.forEach((offset, i) => {
    const curve = catenary(a, b, offset, POWER_WIRE.segments, POWER_WIRE.sag);
    const geo = new THREE.TubeGeometry(curve, POWER_WIRE.segments, POWER_WIRE.thickness, 6, false);
    const mesh = new THREE.Mesh(geo, getMaterial("mat_metal_steel_worn"));
    mesh.name = `street_power_wire_01_span_${i + 1}`;
    root.add(mesh);
  });

  // Service drop from the centre insulator straight down the pole. Vertical and on the
  // centreline (z = 0) so the generated geometry stays symmetric about the pivot.
  [poles[0], poles[1]].forEach((pole, p) => {
    const drop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pole.attachPoint[0], pole.attachPoint[1] + 0.1, pole.attachPoint[2]),
      new THREE.Vector3(pole.position[0], pole.position[1] + POWER_WIRE.attachmentY - 0.3, pole.position[2]),
    ]);
    const geo = new THREE.TubeGeometry(drop, 8, POWER_WIRE.thickness, 6, false);
    const mesh = new THREE.Mesh(geo, getMaterial("mat_metal_steel_worn"));
    mesh.name = `street_power_wire_01_drop_${p + 1}`;
    root.add(mesh);
  });

  root.userData.generatedFrom = POWER_WIRE.poleInstanceIds;
  return finalizeAsset(root);
}

export default create;
