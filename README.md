# 王鑫 · Xin Wang

心理学研究与软件原型的双语个人主页：[sumingwang233.github.io](https://sumingwang233.github.io/)。采用首页概览、独立详情页与文字简历，中文默认，英文入口 `/en/`。

基于 [HugoBlox Academic-CV](https://github.com/HugoBlox/hugo-theme-academic-cv/tree/2b8d5ba3bd74cae07e4046f8cf888906a525aabd)，模板固定于 `2b8d5ba`，模块由 `go.mod` / `go.sum` 锁定。书页纹理、本人摄影、Noto 字体和绿色点缀通过 Hugo 主题覆盖实现。保留原 AcadHomepage 与 HugoBlox 的 MIT 授权；字体附 SIL OFL，照片及个人作品不因代码许可证而转授版权。

## 内容维护

- `data/zh/authors/me.yaml`、`data/en/authors/me.yaml`：HugoBlox 原生作者资料、教育、技能、语言与兴趣照片
- `content/{zh,en}/research/`、`projects/`、`publications/`：研究、软件与 AI、论文的 Markdown；`highlights` 是完整职责与方法，`summary` 是首页摘要
- `content/{zh,en}/experience.md`：校园经历、训练、荣誉和其他经历
- `content/zh/notes/`：首批中文笔记；英文列表标注语言并链接中文正文，不产生空的英文文章
- `content/{zh,en}/photos/_index.md`：摄影集编排，公开路径仅指向清除元数据后的 WebP
- `content/{zh,en}/journal/`：日记栏目；没有真实日记时明确显示未发布
- `i18n/`：界面文字；`config/_default/`：站点原生 YAML 配置

首页摘要、详情页和 CV 使用同一批 Markdown/YAML。旧 `_data/profile.json` 已移除。`scripts/content_data.py` 只读取这些原生文件，为检查生成 gitignored 的 `.local/public-profile.json`，该文件不是维护源，也不进入部署。

核心资料、研究、项目、论文和 CV 必须中英文同步；共享 ID、日期精度、作者顺序、DOI、角色和已确认数量不得因排版变化而修改。笔记和日记允许中文首发，有真实译文后再添加匹配的 `translationKey`。日记正文与新研究结论须由本人提供，不生成虚构记录。

只在本人要求检查或更新时运行维护。`python scripts/inspect_sources.py` 检测同级中英文 general DOCX 的正文变化，私有基线保留于 `.local/`。原照片、Word 简历、审查文件、素材来源、手机号、研究数据和企业内部材料不得进入提交或部署产物。

## 页面与交互

保留 `/`、`/en/`、`/cv/`、`/en/cv/`、三个 PDF 地址和原首页锚点。新增研究、项目、论文、经历、记录、笔记、摄影与日记栏目。GameLibrary 与数字员工 Benchmark 在首页精选，完整功能与架构在详情页。

图片共用原生 dialog 查看器，支持缩放、边界内拖动、键盘、触屏和焦点恢复；无脚本时直接打开图片。兴趣轮播支持触摸、按钮和键盘，不自动播放，视觉计数隐藏但读屏播报保留。滚动与图片动效尊重减少动态效果设置，页面内容默认可见。

校徽来自[武汉大学官方标识](https://www.whu.edu.cn/xxgk/wdbs.htm)，仅在首页教育标题旁展示；应用图标来自[GameLibrary 公开项目](https://github.com/sumingwang233/GameLibrary/blob/main/src/GameLibrary.Tauri/src-tauri/icons/64x64.png)。图片授权与代码许可证分开。

## 构建与验证

使用 Hugo **Extended 0.162.0**、pnpm **10.14.0**、Node.js 24、Go 和 Python 3.12。本机运行工具可放入 `.local/runtime/` 并仅给启动子进程配置路径，不修改系统或用户环境变量。

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
python -m pip install fonttools==4.66.1 brotli==1.2.0 PyMuPDF==1.27.2 PyYAML==6.0.3 Pillow==11.3.0
python scripts/prepare_assets.py
python scripts/validate.py
pnpm run build
pnpm run verify
python scripts/validate.py --site public
```

`pnpm run verify` 从网页生成 `public/files/cv-zh.pdf` 和 `cv-en.pdf`，保留原 28 个视口检查，并检查新增栏目、详情、语言切换、下载、键盘、图片查看、轮播、无脚本和减少动态效果。公开截图仅存 `.local/previews/`。验证器检查完整内容投影、所有本地链接、摄影元数据及两份各两页的学术 CV。

`files/job-resume-public.pdf` 保留已批准的求职简历脱敏副本；更换时必须重新真正删除私人信息并复核可读文本、隐藏文本、元数据、附件、注释、表单和链接。12 个隐私回归样例不使用真实私人信息。照片源文件不改动，公开 WebP 包含缩略图和放大查看图，来源记录仅存本机。

完成验证后可用 `python -m http.server 4000 --directory public` 预览；开发时运行 `pnpm run dev`。预览前应先生成 PDF，保证下载链接存在。

## 发布

GitHub Pages 来源为 GitHub Actions。一个迁移 PR 完成内容、构建与验证切换；PR 只验证，合并到 `main` 且检查成功后才部署 `public`。审阅产物只上传明确列出的公开截图和学术 CV PDF。失败时保留已有部署；回退使用 revert 或修正提交，不强推。

独立 Sites 版本另行维护，此次迁移不更新。本站未启用访问追踪、Scholar 抓取、后台定时任务或付费 AI API。

## 账户与在线博客

访客直接阅读；邮箱账户通过 Supabase 注册、验证、登录与找回密码。站主可在 `/admin/` 保存草稿、配图、预览并发布到 `/blog/`，正文和账户存入数据库。权限由数据库控制，前端不包含私密密钥。

接入、管理员授权、邮件模板、备份与真实收信验收见 [supabase/README.md](supabase/README.md)。已有研究、项目、简历及笔记继续使用原有 Markdown/YAML 内容源。
