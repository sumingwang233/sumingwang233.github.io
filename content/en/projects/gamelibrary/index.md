---
id: gamelibrary
title: GameLibrary
organization: Local game library
period: 2026–Present
methods:
- C# / .NET 10
- Tauri / Rust
- React / TypeScript
- SQLite
image_caption: Software architecture
diagram: gamelibrary
architecture:
  clients:
  - title: Tauri · React · TypeScript
    role: Desktop client / Rust bridge
  - title: CLI · MCP
    role: Command-line & agent interfaces
  bridge: HostClient · Named pipe IPC
  host:
    title: Host
    role: Dispatch · Permissions · Sessions & jobs
  application:
    title: Application
    role: Catalog use cases · Candidate review · Backup & restore
  domain:
    title: Domain
    role: Domain models & rules
  infrastructure:
    title: Infrastructure · SQLite
    role: Database · Files · Backups
  scope: Functions and implementation in the current source
  features:
  - title: Folder scanning
    implementation: ScanJobRunner · DirectoryWalker
    detail: Traverse directories, identify candidates and record scan results
  - title: Candidate review
    implementation: CandidateReviewService · LibraryCatalogStore
    detail: Human confirmation, batch transactions and per-item savepoints
  - title: Library organization
    implementation: GameCatalogService · TagStore · GameCoverService
    detail: Manage game records, tags, favorites and covers
  - title: Launch & process tracking
    implementation: LaunchRegistry · GameProcessTree
    detail: Launch profiles, arguments, running state and process exit
  - title: Backup & restore
    implementation: BackupCreateService · BackupRestoreService
    detail: Create data snapshots and restore the local library
  - title: UI synchronization
    implementation: EventStream · HostClient · React hooks
    detail: Separate event-wait channel with coalesced UI refresh
weight: 1
translationKey: gamelibrary
authors:
- me
summary: Lead requirements and interaction design with AI-assisted implementation, debugging and validation. Implement folder scanning, candidate review, classification and launching, and iterate local storage and the desktop interface
featured: true
highlights:
- Lead requirements and interaction design with AI-assisted implementation, debugging and validation. Implement folder scanning, candidate review, classification and launching, and iterate local storage and the desktop interface
- Produced downloadable Windows builds and a public source repository; desktop, CLI and MCP clients connect to a shared backend
source_url: https://github.com/sumingwang233/GameLibrary
icon: /assets/images/gamelibrary-icon.png
---

{{< highlights >}}

{{< illustration >}}
