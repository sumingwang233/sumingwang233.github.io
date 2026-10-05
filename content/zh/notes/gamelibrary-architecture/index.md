---
title: GameLibrary 架构
date: '2026-10-05'
translationKey: gamelibrary-architecture
content_language: zh
summary: GameLibrary 的桌面客户端使用 Tauri、React 和 TypeScript，Rust 负责桥接；CLI 与 MCP 提供命令行和 Agent 接口。客户端经 HostClient 和 Named pipe IPC 连接 Host，由 Host 管理请求分派、权限、会话与作业。
related: projects/gamelibrary
featured: true
---

## 多个入口，统一后端

GameLibrary 的桌面客户端使用 Tauri、React 和 TypeScript，Rust 负责桥接；CLI 与 MCP 提供命令行和 Agent 接口。客户端经 HostClient 和 Named pipe IPC 连接 Host，由 Host 管理请求分派、权限、会话与作业。

## 从用例到存储

Application 承接游戏库、候选审核和备份恢复用例，Domain 保留领域模型与规则，Infrastructure 负责 SQLite 数据库、文件与备份。下图对应已批准的当前源码说明；具体功能的公开稳定版本以项目发行记录为准。

{{< related path="projects/gamelibrary" >}}

{{< illustration path="projects/gamelibrary" >}}
