---
id: gamelibrary
title: GameLibrary
organization: 本地游戏库管理软件
period: 2026—至今
methods:
- C# / .NET 10
- Tauri / Rust
- React / TypeScript
- SQLite
image_caption: 软件架构图
diagram: gamelibrary
architecture:
  clients:
  - title: Tauri · React · TypeScript
    role: 桌面客户端 / Rust 桥接
  - title: CLI · MCP
    role: 命令行与 Agent 接口
  bridge: HostClient · Named pipe IPC
  host:
    title: Host
    role: 请求分派 · 权限 · 会话与作业
  application:
    title: Application
    role: 游戏库用例 · 候选审核 · 备份与恢复
  domain:
    title: Domain
    role: 领域模型与规则
  infrastructure:
    title: Infrastructure · SQLite
    role: 数据库 · 文件 · 备份
  scope: 当前源码中的功能与实现
  features:
  - title: 目录扫描
    implementation: ScanJobRunner · DirectoryWalker
    detail: 遍历目录，识别候选并记录扫描结果
  - title: 候选审核与入库
    implementation: CandidateReviewService · LibraryCatalogStore
    detail: 人工确认，批量事务与逐项保存点
  - title: 游戏库与分类
    implementation: GameCatalogService · TagStore · GameCoverService
    detail: 游戏记录、标签、收藏与封面管理
  - title: 启动与进程跟踪
    implementation: LaunchRegistry · GameProcessTree
    detail: 启动配置、参数、运行状态与进程退出
  - title: 备份与恢复
    implementation: BackupCreateService · BackupRestoreService
    detail: 创建数据快照并恢复本地游戏库
  - title: 界面状态同步
    implementation: EventStream · HostClient · React hooks
    detail: 独立事件等待通道，合并更新界面状态
weight: 1
translationKey: gamelibrary
authors:
- me
summary: 主导需求与交互设计，使用 AI 辅助开发、调试及验证；实现游戏目录扫描、候选审核、分类管理与快捷启动，迭代本地数据存储及桌面界面
featured: true
highlights:
- 主导需求与交互设计，使用 AI 辅助开发、调试及验证；实现游戏目录扫描、候选审核、分类管理与快捷启动，迭代本地数据存储及桌面界面
source_url: https://github.com/sumingwang233/GameLibrary
icon: /assets/images/gamelibrary-icon.png
---

{{< highlights >}}

{{< illustration >}}
