// src/config/sceneLayout.js
// Single source of truth for scene layout. Config-driven only — no random placement.
// Browser-safe and Node-safe (pure data + pure functions, no DOM / no THREE import).

export const PROJECT = {
  name: "jp_station_corner_convenience_store_diorama",
  style: "japanese_healing_miniature_spring_daytime",
  units: "meter",
  up: "Y",
  version: "1.0.0",
};

export const GROUND_Y = 0.12; // top face of base plate; asset pivots sit here
export const FLOOR_Y = 0.14; // store interior floor top (base plate + 0.02 store floor slab)
export const CANOPY_Y = 2.2; // awning underside mounting height above ground (asset pivot = bottom center)
export const SIDEWALK_TOP = 0.184; // sidewalk slab top (base plate top + 0.064 slab)

export const BASE_PLATE = {
  assetId: "base_base_plate_01",
  size: 20,
  thickness: 0.12,
  color: "#f2eee6",
  center: [0, 0, 0],
};

export const ZONES = {
  road: { x: [-10, 10], z: [-10, -6] },
  drainage_ditch: { x: [-10, 10], z: [-6.3, -6.0] },
  sidewalk: { x: [-10, 10], z: [-6, -4] },
  crosswalk: { x: [1.5, 3.5], z: [-10, -6] },
  alley: { x: [-10, -2], z: [-4, 1.6] },
  parking: { x: [6, 10], z: [-4, 1.6] },
  store: { x: [-2, 6], z: [-4, 1.6], height: 3.2, facadeZ: -4, facadeFacing: "-Z" },
  platform: { x: [-10, 10], z: [2.0, 4.0], height: 0.35 },
  tram_track: { x: [-10, 10], z: [4.0, 5.2] },
};

// assetId -> module file. One file per asset, one create function.
export const ASSET_REGISTRY = [
  // base
  { assetId: "base_base_plate_01", category: "base", file: "src/assets/base_base_plate_01.js", tags: ["plate", "ground"] },

  // Phase 3 — road / track / platform / tram
  { assetId: "road_asphalt_road_01", category: "road", file: "src/assets/road_asphalt_road_01.js", tags: ["asphalt", "road"] },
  { assetId: "road_crosswalk_01", category: "road", file: "src/assets/road_crosswalk_01.js", tags: ["zebra", "paint"] },
  { assetId: "road_drainage_ditch_01", category: "road", file: "src/assets/road_drainage_ditch_01.js", tags: ["grating", "drain"] },
  { assetId: "road_sidewalk_01", category: "road", file: "src/assets/road_sidewalk_01.js", tags: ["paving"] },
  { assetId: "road_alley_entrance_01", category: "road", file: "src/assets/road_alley_entrance_01.js", tags: ["alley", "paving"] },
  { assetId: "road_parking_area_01", category: "road", file: "src/assets/road_parking_area_01.js", tags: ["parking", "markings"] },
  { assetId: "station_tram_track_01", category: "station", file: "src/assets/station_tram_track_01.js", tags: ["rail", "track"] },
  { assetId: "station_platform_01", category: "station", file: "src/assets/station_platform_01.js", tags: ["platform", "tactile"] },
  { assetId: "station_tram_vehicle_01", category: "station", file: "src/assets/station_tram_vehicle_01.js", tags: ["tram", "vehicle"] },
  { assetId: "station_platform_shelter_01", category: "station", file: "src/assets/station_platform_shelter_01.js", tags: ["shelter", "bench"] },
  { assetId: "street_traffic_light_01", category: "street", file: "src/assets/street_traffic_light_01.js", tags: ["signal"] },
  { assetId: "street_guardrail_01", category: "street", file: "src/assets/street_guardrail_01.js", tags: ["guardrail", "metal"] },
  { assetId: "street_sign_01", category: "street", file: "src/assets/street_sign_01.js", tags: ["signpost"] },
  { assetId: "street_utility_pole_01", category: "street", file: "src/assets/street_utility_pole_01.js", tags: ["pole", "concrete"] },
  { assetId: "street_utility_pole_02", category: "street", file: "src/assets/street_utility_pole_02.js", tags: ["pole", "concrete"] },
  { assetId: "street_power_wire_01", category: "street", file: "src/assets/street_power_wire_01.js", tags: ["wire", "catenary", "generated"] },
  { assetId: "street_streetlight_01", category: "street", file: "src/assets/street_streetlight_01.js", tags: ["retro", "lamp"] },

  // Phase 4 — store shell
  { assetId: "architecture_convenience_store_01", category: "architecture", file: "src/assets/architecture_convenience_store_01.js", tags: ["building", "shell"] },
  { assetId: "architecture_store_glass_facade_01", category: "architecture", file: "src/assets/architecture_store_glass_facade_01.js", tags: ["glass", "facade"] },
  { assetId: "architecture_store_automatic_door_01", category: "architecture", file: "src/assets/architecture_store_automatic_door_01.js", tags: ["door", "glass"] },
  { assetId: "architecture_store_canopy_01", category: "architecture", file: "src/assets/architecture_store_canopy_01.js", tags: ["canopy", "awning"] },
  { assetId: "architecture_store_hvac_unit_01", category: "architecture", file: "src/assets/architecture_store_hvac_unit_01.js", tags: ["hvac", "metal"] },
  { assetId: "props_doormat_01", category: "props", file: "src/assets/props_doormat_01.js", tags: ["mat"] },

  // Phase 5 — interior
  { assetId: "interior_shelf_01", category: "interior", file: "src/assets/interior_shelf_01.js", tags: ["shelf"] },
  { assetId: "interior_shelf_02", category: "interior", file: "src/assets/interior_shelf_02.js", tags: ["shelf"] },
  { assetId: "interior_shelf_03", category: "interior", file: "src/assets/interior_shelf_03.js", tags: ["shelf"] },
  { assetId: "interior_drink_fridge_01", category: "interior", file: "src/assets/interior_drink_fridge_01.js", tags: ["fridge", "glass"] },
  { assetId: "interior_bento_display_01", category: "interior", file: "src/assets/interior_bento_display_01.js", tags: ["bento"] },
  { assetId: "interior_onigiri_display_01", category: "interior", file: "src/assets/interior_onigiri_display_01.js", tags: ["onigiri"] },
  { assetId: "interior_sushi_display_01", category: "interior", file: "src/assets/interior_sushi_display_01.js", tags: ["sushi"] },
  { assetId: "interior_snack_zone_01", category: "interior", file: "src/assets/interior_snack_zone_01.js", tags: ["snacks"] },
  { assetId: "interior_checkout_counter_01", category: "interior", file: "src/assets/interior_checkout_counter_01.js", tags: ["counter"] },
  { assetId: "interior_cash_register_01", category: "interior", file: "src/assets/interior_cash_register_01.js", tags: ["register"] },
  { assetId: "interior_coffee_machine_01", category: "interior", file: "src/assets/interior_coffee_machine_01.js", tags: ["coffee"] },
  { assetId: "interior_magazine_rack_01", category: "interior", file: "src/assets/interior_magazine_rack_01.js", tags: ["magazine"] },
  { assetId: "interior_poster_lightbox_01", category: "interior", file: "src/assets/interior_poster_lightbox_01.js", tags: ["lightbox"] },
  { assetId: "interior_upright_freezer_01", category: "interior", file: "src/assets/interior_upright_freezer_01.js", tags: ["freezer"] },
  { assetId: "interior_oden_counter_01", category: "interior", file: "src/assets/interior_oden_counter_01.js", tags: ["oden"] },
  { assetId: "interior_floor_guide_line_01", category: "interior", file: "src/assets/interior_floor_guide_line_01.js", tags: ["guide line"] },
  { assetId: "interior_storage_locker_01", category: "interior", file: "src/assets/interior_storage_locker_01.js", tags: ["locker"] },
  { assetId: "interior_backdoor_01", category: "interior", file: "src/assets/interior_backdoor_01.js", tags: ["door"] },
  { assetId: "interior_drink_bottle_01", category: "interior", file: "src/assets/interior_drink_bottle_01.js", tags: ["bottle", "glass"] },

  // Phase 6 — street props
  { assetId: "props_vending_machine_01", category: "props", file: "src/assets/props_vending_machine_01.js", tags: ["vending", "glass"] },
  { assetId: "props_umbrella_stand_01", category: "props", file: "src/assets/props_umbrella_stand_01.js", tags: ["stand"] },
  { assetId: "props_umbrella_01", category: "props", file: "src/assets/props_umbrella_01.js", tags: ["umbrella"] },
  { assetId: "props_umbrella_02", category: "props", file: "src/assets/props_umbrella_02.js", tags: ["umbrella"] },
  { assetId: "props_umbrella_03", category: "props", file: "src/assets/props_umbrella_03.js", tags: ["umbrella"] },
  { assetId: "props_trash_bin_01", category: "props", file: "src/assets/props_trash_bin_01.js", tags: ["trash", "sorted"] },
  { assetId: "props_trash_bin_02", category: "props", file: "src/assets/props_trash_bin_02.js", tags: ["trash", "sorted"] },
  { assetId: "props_trash_bin_03", category: "props", file: "src/assets/props_trash_bin_03.js", tags: ["trash", "sorted"] },
  { assetId: "props_flower_pot_01", category: "props", file: "src/assets/props_flower_pot_01.js", tags: ["planter"] },
  { assetId: "props_flower_pot_02", category: "props", file: "src/assets/props_flower_pot_02.js", tags: ["planter"] },
  { assetId: "props_bulletin_board_01", category: "props", file: "src/assets/props_bulletin_board_01.js", tags: ["bulletin", "poster"] },
  { assetId: "props_bicycle_parking_zone_01", category: "props", file: "src/assets/props_bicycle_parking_zone_01.js", tags: ["bike rack"] },
  { assetId: "props_bicycle_01", category: "props", file: "src/assets/props_bicycle_01.js", tags: ["bicycle"] },
  { assetId: "props_bicycle_02", category: "props", file: "src/assets/props_bicycle_02.js", tags: ["bicycle"] },
  { assetId: "props_bicycle_03", category: "props", file: "src/assets/props_bicycle_03.js", tags: ["bicycle"] },

  // Phase 7 — nature
  { assetId: "nature_sakura_somei_yoshino_01", category: "nature", file: "src/assets/nature_sakura_somei_yoshino_01.js", tags: ["sakura", "tree"] },
  { assetId: "nature_sakura_somei_yoshino_02", category: "nature", file: "src/assets/nature_sakura_somei_yoshino_02.js", tags: ["sakura", "tree"] },
  { assetId: "nature_sakura_somei_yoshino_03", category: "nature", file: "src/assets/nature_sakura_somei_yoshino_03.js", tags: ["sakura", "tree"] },
  { assetId: "nature_sakura_petal_pile_01", category: "nature", file: "src/assets/nature_sakura_petal_pile_01.js", tags: ["petals"] },
  { assetId: "nature_sakura_petal_pile_02", category: "nature", file: "src/assets/nature_sakura_petal_pile_02.js", tags: ["petals"] },
  { assetId: "nature_grass_patch_01", category: "nature", file: "src/assets/nature_grass_patch_01.js", tags: ["grass", "wildflower", "ground"] },
];

// Instances: instanceId, assetId, position, rotation (degrees), scale, visible.
// Every asset root pivot = bottom center, so y = GROUND_Y unless mounted on a surface.
export const INSTANCES = [
  { instanceId: "inst_base_base_plate_01", assetId: "base_base_plate_01", position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },

  // Road / street
  { instanceId: "inst_road_asphalt_road_01", assetId: "road_asphalt_road_01", position: [0, GROUND_Y, -8], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_road_crosswalk_01", assetId: "road_crosswalk_01", position: [2.5, GROUND_Y, -8], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_road_drainage_ditch_01", assetId: "road_drainage_ditch_01", position: [0, GROUND_Y, -6.15], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_road_sidewalk_01", assetId: "road_sidewalk_01", position: [0, GROUND_Y, -5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_road_alley_entrance_01", assetId: "road_alley_entrance_01", position: [-6, GROUND_Y, -1.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_road_parking_area_01", assetId: "road_parking_area_01", position: [8, GROUND_Y, -1.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },

  // Station
  { instanceId: "inst_station_tram_track_01", assetId: "station_tram_track_01", position: [0, GROUND_Y, 4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_station_platform_01", assetId: "station_platform_01", position: [0, GROUND_Y, 3.0], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_station_tram_vehicle_01", assetId: "station_tram_vehicle_01", position: [0, 0.30, 4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_station_platform_shelter_01", assetId: "station_platform_shelter_01", position: [-6.5, GROUND_Y, 3.0], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },

  // Street furniture
  { instanceId: "inst_street_utility_pole_01", assetId: "street_utility_pole_01", position: [-8, GROUND_Y, -5.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_street_utility_pole_02", assetId: "street_utility_pole_02", position: [9.5, GROUND_Y, -5.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_street_power_wire_01", assetId: "street_power_wire_01", position: null, derived: true, rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, derivedFrom: ["inst_street_utility_pole_01", "inst_street_utility_pole_02"] },
  { instanceId: "inst_street_traffic_light_01", assetId: "street_traffic_light_01", position: [4.5, GROUND_Y, -5.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_street_streetlight_01", assetId: "street_streetlight_01", position: [-7.2, GROUND_Y, -5.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_street_sign_01", assetId: "street_sign_01", position: [-3.2, GROUND_Y, -5.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_street_guardrail_01", assetId: "street_guardrail_01", position: [-6.5, GROUND_Y, -6.05], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },

  // Store shell
  { instanceId: "inst_architecture_convenience_store_01", assetId: "architecture_convenience_store_01", position: [2, GROUND_Y, -1.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_architecture_store_glass_facade_01", assetId: "architecture_store_glass_facade_01", position: [2, GROUND_Y, -4], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_architecture_store_automatic_door_01", assetId: "architecture_store_automatic_door_01", position: [2, GROUND_Y, -4.08], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_architecture_store_canopy_01", assetId: "architecture_store_canopy_01", position: [2, 2.32, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_architecture_store_hvac_unit_01", assetId: "architecture_store_hvac_unit_01", position: [-2.6, GROUND_Y, -1.0], rotation: [0, 90, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_doormat_01", assetId: "props_doormat_01", position: [2, GROUND_Y, -4.45], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },

  // Interior (floor-standing items sit on the store floor top = FLOOR_Y)
  { instanceId: "inst_interior_checkout_counter_01", assetId: "interior_checkout_counter_01", position: [4.0, FLOOR_Y, -2.5], rotation: [0, 180, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_cash_register_01", assetId: "interior_cash_register_01", position: [4.0, 1.28, -2.5], rotation: [0, 180, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_coffee_machine_01", assetId: "interior_coffee_machine_01", position: [5.4, FLOOR_Y, -2.2], rotation: [0, 270, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_drink_fridge_01", assetId: "interior_drink_fridge_01", position: [5.6, FLOOR_Y, -0.6], rotation: [0, 270, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_upright_freezer_01", assetId: "interior_upright_freezer_01", position: [5.6, FLOOR_Y, 0.9], rotation: [0, 270, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_bento_display_01", assetId: "interior_bento_display_01", position: [1.1, FLOOR_Y, -3.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_onigiri_display_01", assetId: "interior_onigiri_display_01", position: [0.0, FLOOR_Y, -3.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_sushi_display_01", assetId: "interior_sushi_display_01", position: [-1.1, FLOOR_Y, -3.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_snack_zone_01", assetId: "interior_snack_zone_01", position: [1.5, FLOOR_Y, -1.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_shelf_01", assetId: "interior_shelf_01", position: [1.5, FLOOR_Y, -0.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_shelf_02", assetId: "interior_shelf_02", position: [-1.1, FLOOR_Y, -1.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_shelf_03", assetId: "interior_shelf_03", position: [-1.5, FLOOR_Y, 0.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_magazine_rack_01", assetId: "interior_magazine_rack_01", position: [-0.5, FLOOR_Y, -2.4], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_poster_lightbox_01", assetId: "interior_poster_lightbox_01", position: [-1.80, 1.95, -1.0], rotation: [0, 90, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_oden_counter_01", assetId: "interior_oden_counter_01", position: [3.0, FLOOR_Y, 0.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_floor_guide_line_01", assetId: "interior_floor_guide_line_01", position: [2.0, FLOOR_Y, -3.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_storage_locker_01", assetId: "interior_storage_locker_01", position: [0.5, FLOOR_Y, 1.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_backdoor_01", assetId: "interior_backdoor_01", position: [-0.5, FLOOR_Y, 1.55], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_interior_drink_bottle_01", assetId: "interior_drink_bottle_01", position: [1.5, 1.355, -0.48], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },

  // Street props
  { instanceId: "inst_props_vending_machine_01", assetId: "props_vending_machine_01", position: [5.6, GROUND_Y, -5.2], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_umbrella_stand_01", assetId: "props_umbrella_stand_01", position: [0.5, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_umbrella_01", assetId: "props_umbrella_01", position: [0.35, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_umbrella_02", assetId: "props_umbrella_02", position: [0.65, GROUND_Y, -4.6], rotation: [0, 15, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_umbrella_03", assetId: "props_umbrella_03", position: [0.5, GROUND_Y, -4.75], rotation: [0, -15, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_trash_bin_01", assetId: "props_trash_bin_01", position: [-1.2, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_trash_bin_02", assetId: "props_trash_bin_02", position: [-1.7, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_trash_bin_03", assetId: "props_trash_bin_03", position: [-2.2, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_flower_pot_01", assetId: "props_flower_pot_01", position: [3.2, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_flower_pot_02", assetId: "props_flower_pot_02", position: [3.8, GROUND_Y, -4.6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_bulletin_board_01", assetId: "props_bulletin_board_01", position: [-3.6, GROUND_Y, -4.5], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_bicycle_parking_zone_01", assetId: "props_bicycle_parking_zone_01", position: [-5.4, GROUND_Y, -4.7], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  // Bikes park nose-in on the rack: length runs along Z, so they are spaced across X.
  { instanceId: "inst_props_bicycle_01", assetId: "props_bicycle_01", position: [-6.5, GROUND_Y, -4.7], rotation: [0, 90, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_bicycle_02", assetId: "props_bicycle_02", position: [-5.6, GROUND_Y, -4.7], rotation: [0, 98, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_props_bicycle_03", assetId: "props_bicycle_03", position: [-4.7, GROUND_Y, -4.7], rotation: [0, 82, 0], scale: [1, 1, 1], visible: true },

  // Nature
  // Trees sit on open ground / sidewalk planting strips, never inside paved zones.
  { instanceId: "inst_nature_sakura_somei_yoshino_01", assetId: "nature_sakura_somei_yoshino_01", position: [-8.0, GROUND_Y, -2.5], rotation: [0, 20, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_nature_sakura_somei_yoshino_02", assetId: "nature_sakura_somei_yoshino_02", position: [7.5, SIDEWALK_TOP, -5.2], rotation: [0, -35, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_nature_sakura_somei_yoshino_03", assetId: "nature_sakura_somei_yoshino_03", position: [-1.5, SIDEWALK_TOP, -5.2], rotation: [0, 60, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_nature_sakura_petal_pile_01", assetId: "nature_sakura_petal_pile_01", position: [0.0, SIDEWALK_TOP, -5.4], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_nature_sakura_petal_pile_02", assetId: "nature_sakura_petal_pile_02", position: [-7.0, GROUND_Y, -4.4], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true },
  // Grass under each sakura: planting strips on the sidewalk, wider patch in the alley.
  { instanceId: "inst_nature_grass_patch_01", assetId: "nature_grass_patch_01", position: [-8.0, GROUND_Y, -2.5], rotation: [0, 15, 0], scale: [1.4, 1, 1.4], visible: true },
  { instanceId: "inst_nature_grass_patch_02", assetId: "nature_grass_patch_01", position: [7.5, SIDEWALK_TOP, -5.2], rotation: [0, 120, 0], scale: [1, 1, 1], visible: true },
  { instanceId: "inst_nature_grass_patch_03", assetId: "nature_grass_patch_01", position: [-1.5, SIDEWALK_TOP, -5.2], rotation: [0, 210, 0], scale: [1, 1, 1], visible: true },
];

// Power wire is DERIVED from the two pole instances — never hardcoded independently.
export const POWER_WIRE = {
  assetId: "street_power_wire_01",
  poleInstanceIds: ["inst_street_utility_pole_01", "inst_street_utility_pole_02"],
  attachmentY: 5.6, // height of crossarm attachment, measured from asset pivot (bottom center)
  sag: 0.6,
  segments: 24,
  thickness: 0.02,
  // Three conductors, aligned with the top crossarm insulator row of street_utility_pole_01/02.
  // Kept symmetric about the pole centreline so the asset pivot (bbox bottom center) equals the
  // wire instance position computed by wireInstancePosition().
  zOffsets: [-0.45, 0, 0.45],
};

export function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

export function findInstance(instanceId) {
  return INSTANCES.find((i) => i.instanceId === instanceId) || null;
}

export function instancesFor(assetId) {
  return INSTANCES.filter((i) => i.assetId === assetId);
}

export function assetMeta(assetId) {
  return ASSET_REGISTRY.find((a) => a.assetId === assetId) || null;
}

// Wire endpoints resolved from pole instance positions (rule: wires generated from pole positions).
// The wire asset's pivot is its bbox bottom center. Its geometry is symmetric in x/z about the
// pole midpoint, and the lowest point of the parabola is y(t=0.5) = attachY - sag, so the instance
// position is (midX, poleBaseY + attachY - sag, midZ) — i.e. the wire hangs from the crossarms.
export function wireInstancePosition() {
  const poles = wireEndpoints();
  const [ax, ay, az] = poles[0].position;
  const [bx, by, bz] = poles[1].position;
  const r4 = (v) => Math.round(v * 10000) / 10000;
  return [
    r4((ax + bx) / 2),
    r4((ay + by) / 2 + POWER_WIRE.attachmentY - POWER_WIRE.sag),
    r4((az + bz) / 2),
  ];
}

export function wireEndpoints() {
  const poles = POWER_WIRE.poleInstanceIds.map((id) => {
    const inst = findInstance(id);
    if (!inst) throw new Error(`POWER_WIRE pole instance not found: ${id}`);
    return {
      instanceId: inst.instanceId,
      assetId: inst.assetId,
      position: inst.position,
      attachPoint: [inst.position[0], inst.position[1] + POWER_WIRE.attachmentY, inst.position[2]],
    };
  });
  if (poles.length !== 2) throw new Error("POWER_WIRE requires exactly 2 pole instances");
  return poles;
}

// Resolve derived positions after POWER_WIRE is initialized (power wire from pole positions).
for (const inst of INSTANCES) {
  if (inst.derived) inst.position = wireInstancePosition();
}
