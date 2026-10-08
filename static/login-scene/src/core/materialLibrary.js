// src/core/materialLibrary.js
// Unique, named materials only. Asset-layer safe: MeshStandardMaterial + basic PBR MeshPhysicalMaterial.
// No ShaderMaterial / onBeforeCompile / CanvasTexture. Node-safe (no DOM).

import * as THREE from "three";

const DEFS = {
  // ground / road
  mat_base_plate: { color: "#f2eee6", roughness: 0.9 },
  mat_asphalt: { color: "#4b4a47", roughness: 0.95 },
  mat_asphalt_paint_white: { color: "#efe9df", roughness: 0.7, worn: true },
  mat_asphalt_paint_yellow: { color: "#d9c27a", roughness: 0.7, worn: true },
  mat_concrete: { color: "#b9b4a8", roughness: 0.9 },
  mat_concrete_paving: { color: "#c7c2b6", roughness: 0.85 },
  mat_grating_metal: { color: "#6f6a62", roughness: 0.6, metalness: 0.6 },
  mat_tactile_paving: { color: "#c9a44c", roughness: 0.8 },

  // metals
  mat_metal_steel: { color: "#8f8d88", roughness: 0.45, metalness: 0.85 },
  mat_metal_steel_worn: { color: "#7c7a74", roughness: 0.6, metalness: 0.8 },
  mat_metal_painted_green: { color: "#5f7a63", roughness: 0.55, metalness: 0.3 },
  mat_metal_painted_black: { color: "#3a3835", roughness: 0.5, metalness: 0.4 },
  mat_metal_painted_white: { color: "#e6e2d8", roughness: 0.5, metalness: 0.2 },
  mat_metal_painted_red: { color: "#b4553f", roughness: 0.55, metalness: 0.3 },
  mat_metal_pole_concrete: { color: "#a8a49b", roughness: 0.85 },

  // glass (alpha BLEND on export)
  mat_glass_clear: { color: "#dfe8e6", roughness: 0.05, metalness: 0.0, physical: true, transparent: true, opacity: 0.32 },
  mat_glass_tinted: { color: "#b9c8c6", roughness: 0.08, metalness: 0.0, physical: true, transparent: true, opacity: 0.38 },
  mat_glass_vending: { color: "#c9d6d4", roughness: 0.04, metalness: 0.0, physical: true, transparent: true, opacity: 0.28 },

  // plastics
  mat_plastic_white: { color: "#eae6dd", roughness: 0.55 },
  mat_plastic_blue: { color: "#4f7fb0", roughness: 0.5 },
  mat_plastic_red: { color: "#c25548", roughness: 0.5 },
  mat_plastic_green: { color: "#5c8f62", roughness: 0.5 },
  mat_plastic_yellow: { color: "#dfb84a", roughness: 0.5 },
  mat_plastic_black: { color: "#35332f", roughness: 0.45 },
  mat_plastic_clear_bottle: { color: "#cfd8d6", roughness: 0.15, physical: true, transparent: true, opacity: 0.45 },

  // wood / organic
  mat_wood_light: { color: "#c9a878", roughness: 0.7 },
  mat_wood_dark: { color: "#8a6f4e", roughness: 0.75 },
  mat_bark: { color: "#6b5a48", roughness: 0.9 },
  mat_sakura_canopy: { color: "#f3d3dc", roughness: 0.85, flatShading: true },
  mat_sakura_canopy_light: { color: "#f8e2e9", roughness: 0.8, flatShading: true },
  mat_sakura_canopy_deep: { color: "#e6b7c4", roughness: 0.85, flatShading: true },
  mat_sakura_blossom: { color: "#f2c4d4", roughness: 0.75, flatShading: true },
  mat_sakura_petal: { color: "#f7dfe6", roughness: 0.8 },
  mat_foliage_green: { color: "#7a9a6a", roughness: 0.85 },

  // grass / wildflowers (nature asset layer)
  mat_grass_lawn: { color: "#7fb06a", roughness: 0.9, flatShading: true },
  mat_grass_tuft: { color: "#6d9a58", roughness: 0.9, flatShading: true },
  mat_grass_edge: { color: "#5f8a4e", roughness: 0.9, flatShading: true },
  mat_wildflower_white: { color: "#f4f1e6", roughness: 0.8, flatShading: true },
  mat_wildflower_yellow: { color: "#e9c34f", roughness: 0.8, flatShading: true },
  mat_wildflower_pink: { color: "#e9a9c1", roughness: 0.8, flatShading: true },
  mat_wildflower_blue: { color: "#86a8d8", roughness: 0.8, flatShading: true },
  mat_wildflower_stem: { color: "#5c8a52", roughness: 0.85 },

  // fabric / paper
  mat_fabric_canopy: { color: "#4a6f6a", roughness: 0.85 },
  mat_fabric_mat: { color: "#6d6357", roughness: 0.95 },
  mat_paper_poster: { color: "#efe6d4", roughness: 0.9 },
  mat_paper_poster_accent: { color: "#d8b7a2", roughness: 0.9 },

  // store surfaces
  mat_floor_tile: { color: "#d9d4c8", roughness: 0.6 },
  mat_guide_line: { color: "#b9b1a1", roughness: 0.7 },
  mat_wall_exterior: { color: "#e0dcd2", roughness: 0.8 },
  mat_wall_interior: { color: "#e8e4da", roughness: 0.85 },
  mat_roof_metal: { color: "#7d7f7c", roughness: 0.6, metalness: 0.4 },
  mat_sign_band: { color: "#3f7f6b", roughness: 0.5 },

  // tram
  mat_tram_body_cream: { color: "#e8e0cf", roughness: 0.5 },
  mat_tram_body_green: { color: "#4f7a6a", roughness: 0.5 },
  mat_tram_window: { color: "#c3d2d0", roughness: 0.1, physical: true, transparent: true, opacity: 0.35 },
  mat_rubber_tire: { color: "#2f2e2b", roughness: 0.9 },

  // emissive (basic PBR emission, export-safe)
  mat_lightbox_emissive: { color: "#f5efe2", roughness: 0.6, emissive: "#f0d9b0", emissiveIntensity: 0.6 },
  mat_streetlight_glass: { color: "#f2e6c8", roughness: 0.3, emissive: "#e8d3a0", emissiveIntensity: 0.5 },
  mat_signal_red: { color: "#c0413a", roughness: 0.4, emissive: "#8f2f28", emissiveIntensity: 0.4 },
  mat_signal_green: { color: "#41a06a", roughness: 0.4, emissive: "#2f7a4e", emissiveIntensity: 0.4 },
  mat_signal_amber: { color: "#d9a441", roughness: 0.4, emissive: "#a8762c", emissiveIntensity: 0.3 },
  mat_vending_interior: { color: "#2b2b2e", roughness: 0.6, emissive: "#3b3f45", emissiveIntensity: 0.25 },

  // Interior / merchandise
  mat_cardboard: { color: "#c9b79a", roughness: 0.9 },
  mat_plastic_tray: { color: "#e3ded3", roughness: 0.5 },
  mat_stainless: { color: "#a9a7a2", roughness: 0.35, metalness: 0.9 },
  mat_shelf_metal: { color: "#b5b1a8", roughness: 0.5, metalness: 0.5 },
  mat_food_rice: { color: "#efe9dc", roughness: 0.8 },
  mat_food_nori: { color: "#3c4a3a", roughness: 0.7 },
  mat_food_salmon: { color: "#d98a6a", roughness: 0.7 },
  mat_food_egg: { color: "#e8c98f", roughness: 0.7 },
  mat_food_vegetable: { color: "#7fa06a", roughness: 0.8 },
  mat_food_bento_box: { color: "#b8453c", roughness: 0.6 },
  mat_curtain_noren: { color: "#4a6f6a", roughness: 0.9 },
  mat_locker_laminate: { color: "#cfc9bd", roughness: 0.7 },
};

const cache = new Map();

// Sunny-spring look pass: saturation + value lift, applied consistently in getMaterial() and
// materialDefinitions() so materials.json / Blender get exactly the colors the renderer uses.
export const LOOK = { saturation: 1.18, value: 1.08 };

function lookColor(hex) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s * LOOK.saturation), Math.min(1, hsl.l * LOOK.value));
  return c;
}

export function getMaterial(name) {
  if (cache.has(name)) return cache.get(name);
  const def = DEFS[name];
  if (!def) throw new Error(`Unknown material: ${name}`);

  const base = {
    name,
    color: lookColor(def.color),
    roughness: def.roughness ?? 0.7,
    metalness: def.metalness ?? 0.0,
    flatShading: !!def.flatShading,
  };
  if (def.emissive) {
    base.emissive = lookColor(def.emissive);
    base.emissiveIntensity = def.emissiveIntensity ?? 1;
  }
  const mat = def.physical
    ? new THREE.MeshPhysicalMaterial({ ...base, transparent: !!def.transparent, opacity: def.opacity ?? 1, depthWrite: !def.transparent })
    : new THREE.MeshStandardMaterial(base);
  mat.name = name;
  cache.set(name, mat);
  return mat;
}

export function materialNames() {
  return Object.keys(DEFS);
}

export function materialDefinitions() {
  return Object.entries(DEFS).map(([name, def]) => ({
    name,
    type: def.physical ? "MeshPhysicalMaterial" : "MeshStandardMaterial",
    color: lookColor(def.color).getStyle(),
    roughness: def.roughness ?? 0.7,
    metalness: def.metalness ?? 0.0,
    emissive: def.emissive ? lookColor(def.emissive).getStyle() : null,
    emissiveIntensity: def.emissiveIntensity ?? null,
    transparent: !!def.transparent,
    opacity: def.opacity ?? 1,
    worn: !!def.worn,
    flatShading: !!def.flatShading,
    textures: [],
    blender_rebuild: "Principled BSDF; map color/roughness/metalness; alpha blend for transparent entries; emission via Emission node; flat shading via the Flat node or Shade Flat on the mesh.",
  }));
}
