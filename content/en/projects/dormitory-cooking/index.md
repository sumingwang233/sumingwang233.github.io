---
id: dormitory-cooking
title: Dormitory Cooking Simulator
organization: Independent game development
period: 2026–Present
methods:
- Godot 4.7
- GDScript
image_caption: Game architecture
diagram: game
architecture:
  scope: Scenes, systems and data in the current Godot prototype
  clients:
  - title: main_voxel.tscn · Player
    role: 3D dorm scene · Movement and object interaction
  - title: GameUI · HUD
    role: Cooking, phone, market and pause panels
  bridge: System calls / Signal feedback ↑
  host:
    title: GDScript · Autoload
    role: Persistent gameplay systems · State and rules
  application:
    title: EventBus
    role: Time, inventory, money, cooking-result and risk events
  features:
  - title: Cooking & feedback
    implementation: CookingSession · cooking_panel.gd
    detail: Preparation timing, heat, seasoning and result grades
  - title: Ingredients & recipes
    implementation: Inventory · RecipeBook
    detail: Ingredient use, freshness, equipment durability and recipe unlocks
  - title: Shopping & economy
    implementation: Economy · ShopManager · MarketSystem
    detail: Purchase ingredients and equipment; record income and spending
  - title: Social interaction & risk
    implementation: SocialManager · RiskManager
    detail: Affection changes, risk accumulation and inspection events
  - title: Time & progression
    implementation: GameClock · CourseProgress · TutorialState
    detail: Action time, course progress and tutorial guidance
  - title: World & placement
    implementation: Player · PlacementManager
    detail: Scene interaction, item placement and state feedback
  domain:
    title: DataLoader · .tres / .res
    role: Recipe, ingredient, equipment and NPC resources
  infrastructure:
    title: SaveManager · JSON
    role: System snapshots · Validation and restore · Auto/manual saves
weight: 2
translationKey: dormitory-cooking
authors:
- me
summary: Lead gameplay, interaction design and feature selection with AI-assisted development; build a runnable prototype around shopping, cooking, resource management and roommate interactions
featured: false
highlights:
- Lead gameplay, interaction design and feature selection with AI-assisted development; build a runnable prototype around shopping, cooking, resource management and roommate interactions
- Design dish ratings, risk and relationship feedback; iterate saves, tutorials and interactions with logic tests and runtime validation
---

{{< highlights >}}

{{< illustration >}}
