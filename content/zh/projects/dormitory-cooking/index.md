---
id: dormitory-cooking
title: 大学寝室做饭模拟器
organization: Godot 独立游戏
period: 2026—至今
methods:
- Godot 4.7
- GDScript
image_caption: 游戏架构图
diagram: game
architecture:
  scope: 当前 Godot 原型中的场景、系统与数据
  clients:
  - title: main_voxel.tscn · Player
    role: 3D 寝室场景 · 移动与物品交互
  - title: GameUI · HUD
    role: 烹饪、手机、市场与暂停面板
  bridge: 系统调用 / 信号反馈 ↑
  host:
    title: GDScript · Autoload
    role: 常驻玩法系统 · 状态与规则
  application:
    title: EventBus
    role: 时间、库存、金钱、烹饪结果与风险事件
  features:
  - title: 烹饪与反馈
    implementation: CookingSession · cooking_panel.gd
    detail: 备料判定、火候、调味与结果等级
  - title: 食材与菜谱
    implementation: Inventory · RecipeBook
    detail: 食材消耗、新鲜度、设备耐久与菜谱解锁
  - title: 采购与经济
    implementation: Economy · ShopManager · MarketSystem
    detail: 购买食材和设备，记录资金收支
  - title: 室友与风险
    implementation: SocialManager · RiskManager
    detail: 好感变化、风险积累与检查事件
  - title: 时间与进度
    implementation: GameClock · CourseProgress · TutorialState
    detail: 行动耗时、课程进度与新手引导
  - title: 空间与摆放
    implementation: Player · PlacementManager
    detail: 场景交互、物品摆放与状态反馈
  domain:
    title: DataLoader · .tres / .res
    role: 菜谱、食材、设备与 NPC 资源
  infrastructure:
    title: SaveManager · JSON
    role: 系统快照 · 校验与恢复 · 自动和手动存档
weight: 2
translationKey: dormitory-cooking
authors:
- me
summary: 主导玩法、交互与功能取舍，使用 AI 辅助开发和迭代；围绕采购、烹饪、资源管理与室友互动构建可运行原型
featured: false
highlights:
- 主导玩法、交互与功能取舍，使用 AI 辅助开发和迭代；围绕采购、烹饪、资源管理与室友互动构建可运行原型
- 设计菜品评级、风险与关系反馈，迭代存档、教程和交互流程，并开展逻辑测试与实际运行验证
---

{{< highlights >}}

{{< illustration >}}
