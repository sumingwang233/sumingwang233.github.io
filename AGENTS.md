# AGENTS.md · 个人主页重构指南

王鑫 / Xin Wang 的中英双语个人主页（https://sumingwang233.github.io/），基于 HugoBlox Academic-CV + Hugo 主题覆盖，Supabase 提供账户与在线博客。

2026-10-09 起，网站从“学术主页”转型为“个人主页”：心理学研究、AI 与软件作品、独立游戏、写作和摄影并列。本文件指导整站视觉重构，与旧规则冲突时以本文件为准。旧规则见 `AGENTS_codex.md`（Codex 时期的 AGENTS.md，仅作历史参考，其中内容事实、隐私和发布规则仍然有效，已摘入下文）。

## 1. 已确定的风格方向

站主在 5 个预览中选定三种风格融合。预览文件在本地 `.local/style-previews/`（gitignored，只在本机存在），运行 `.claude/launch.json` 中的 `style-previews` 后访问 `http://localhost:4173/.local/style-previews/`。

| 角色 | 预览 | 用在哪里 |
|---|---|---|
| **主方向：便当格 Bento** | `02-bento.html` | 全站默认：页面框架、导航、首页首屏、研究、论文、写作/博客、关于、经历、账户与后台、所有列表和详情页 |
| **影像区：镜头 Cinematic** | `04-cinematic.html` | 内容主体是照片时：摄影集 `/photos/`、首页“生活/摄影”区块、爱好、图片查看器、文章里的大图 |
| **作品区：玩家档案 Player** | `05-player.html` | 软件与游戏作品：首页作品区、`/projects/` 列表与详情、开源贡献（Unsloth）、播客 |

`01-editorial`（杂志）和 `03-lab`（实验室）未被选用，不要引入它们的元素（宋体超大标题、印章、终端提示符、网格暗底等）。旧版的旧书页纹理、暖纸底色和绿色单一点缀全部退役。

### 融合原则

1. **一套骨架，三种表面。** 三个区共享同一套栅格、间距、字号阶梯、圆角家族和基础无衬线字体；区别只在“表面”：背景、边框、阴影、强调色、点缀字体。
2. **按区块切换，不在卡片内混搭。** 影像区和作品区都是首页里一条完整的全宽区块（band），或者一个完整页面。不要出现“半张卡片是 bento、半张是硬阴影”的情况。
3. **区域靠 CSS 变量切换。** 用 `.zone-photo`、`.zone-works` 包裹区块，在类上重定义 token；组件（tile、tag、button、chip）的 HTML 结构保持同一套，不为每个区单独写一份组件。
4. **从 bento 进入其他区要有呼吸。** 区块之间留大间距（`--space-section`），影像区整条出血到视口两边，作品区保留在内容宽度内。

## 2. 设计 Token（实现时以此为起点，可微调但需保持对比度）

### 基底 Bento（`:root`）

- 背景 `--bg: #f1f1ef`；卡片 `--tile: #fff`；正文 `--ink: #121212`；次要文字 `--muted: #6e6e73`；分隔线 `--line: #e4e4e0`
- 语义色（文字色 / 浅底）：心理学 `--psy #1f8a5b / #e3f3ea`；AI 与软件 `--ai #4f46e5 / #ebeafd`；游戏 `--game #ea7a2c / #fdeedf`。小号标签文字放在浅底上时，要把文字色加深到对比度 ≥ 4.5:1（例如心理学标签用 `#17704a` 左右）
- 圆角：大卡片 `26px`，中等 `14px`，胶囊 `999px`
- 阴影：静止时 `0 1px 0 #0000000a`，悬停时 `0 14px 34px #0000001a`，并上浮 3px
- 栅格：4 列，`gap: 14px`；≤900px 两列，≤560px 单列；内容最大宽度约 `1180px`，两侧 16px 边距
- 导航：顶部居中、sticky 的半透明毛玻璃胶囊（`#ffffffcc` + `backdrop-filter: blur(14px)`），左侧是头像加名字，右侧是黑底的语言切换
- 字体：Inter（拉丁）+ Noto Sans SC（中文）；标题字重 700–800，字距约 `-0.03em`

### 影像区 Cinematic（`.zone-photo`）

- 深底 `#0e0e0d`、`#171715`；暖白 `#f0ebe3`；次要文字 `#a39c91`；点缀金色 `#d2ad74`
- 字体：中文 Noto Serif SC 300/500；拉丁斜体题注用 Cormorant Garamond Italic
- 版式：全幅出血照片；横向胶片条（`scroll-snap-type: x mandatory`，图片等高、宽度随原比例）；爱好用 3:4 竖幅瓦片，压暗后叠加标题，悬停时提亮并放大约 1.05；作品大图用 21:9 宽幅并配底部渐变叠字
- 动效：首屏大图在约 18 秒内从 1.06 缓慢缩回到 1；标题上浮淡入；悬停时缓慢放大（1.2 秒左右）。全部受 `prefers-reduced-motion` 约束

### 作品区 Player（`.zone-works`）

- 奶油底 `#fff4dc` 配点阵背景；墨色 `#141414`；高饱和色：番茄 `#ff5a36`、薄荷 `#2ed3a0`、天蓝 `#55c6ff`、明黄 `#ffd23f`、淡紫 `#b69cff`、粉 `#ff9ec7`
- 描边 `2.5px solid #141414`；硬阴影 `5px 5px 0 #141414`，悬停时位移 -3px 并变为 `8px 8px 0`，按下时回弹；圆角 `16px`（与 bento 同一家族）
- 字体：Inter / Noto Sans SC 粗体（900）；Silkscreen 像素字只用于极小的英文标签（`SIDE QUEST`、`ACTIVE`、`LV` 一类），不用于中文和正文
- 语汇：作品 = “支线任务”卡片，带状态胶囊（进行中 / 已合并 / 制作中）；技术栈 = “装备栏”chips；开源贡献、论文等可做成“成就”徽章。只在作品区使用，不要扩散到研究和首屏
- **对比度：** 饱和色块上一律用墨色文字；白字只能放在墨色底上（番茄底配白字对比度只有约 3:1，不合格）

## 3. 信息架构

### 首页顺序（按预览 02 执行）

1. **首屏 bento**：身份卡（原生活照，圆角方形；`王鑫 / Xin Wang`；下方是本地化职务；简介；**只放学术简历和求职简历两个按钮，不放邮件按钮**）、`Be Water, my friend` 座右铭卡、“正在进行”卡、GitHub 卡、一张摄影卡、论文卡、语言卡
2. 研究（bento，心理学绿）
3. 论文（bento）
4. 作品（`.zone-works` 全宽区块）：GameLibrary、大学寝室做饭模拟器、数字员工 Benchmark、飞牛视频查重助手、Unsloth PR、心理学知识播客
5. 写作（bento）：精选笔记、最新博客、栏目入口（心理学及其子主题、开发日记、摄影、随笔）
6. 关于：教育（武大校徽只出现在首页教育标题旁）、技能 ＆ 语言、学术兴趣
7. 生活 / 摄影（`.zone-photo` 全宽出血）：胶片条加四个爱好瓦片
8. 联系：深色 bento 卡，邮箱 `sumingwang@qq.com`，外部链接放在链接文字之外

### 导航

`研究 · 作品 · 写作 · 摄影 · 简历 · EN · 账户`。论文、经历、笔记、日记从对应页面进入。**所有旧路由、旧首页锚点和三个 PDF 地址必须继续可用**：`/`、`/en/`、`/cv/`、`/en/cv/`、research / projects / publications / experience / records / notes / photos / journal / blog / account / admin 及其英文版。

### 页面与所属区域

| 页面 | 区域 | 备注 |
|---|---|---|
| `/`、`/en/` | bento，内含作品区和影像区两条 band | 见上 |
| `research/`、`publications/`、`experience/`、`records/` | bento | 详情页正文用阅读排版（最大约 70ch） |
| `projects/` 列表与详情 | 作品区 | 架构图、流程图放在硬阴影框里，保留现有图示和图片查看器 |
| `photos/` | 影像区（整页深色） | 首屏为一张出血大图，下面是分组胶片条或网格；只用已授权且已去除元数据的 WebP |
| `notes/`、`journal/`、`blog/` 与文章 | bento | 博客筛选、搜索、排序保持现有功能 |
| `account/` | bento 卡片叠在现有 Three.js 登录场景上 | 保留 3D 背景和全部账户流程 |
| `admin/` | bento | 功能优先，不加装饰性动效 |
| `cv/`、`en/cv/` | **不在重构范围** | 打印版学术 CV 必须保持紧凑文本、各两页 A4；不加载区域 CSS、查看器、轮播或 reveal 脚本 |

## 4. 与旧版已批准展示规则的差异

以下几条旧规则被本次方向**替换**；其余展示规则继续有效：

- 旧书页纹理、暖纸底色、绿色单一点缀 → 换成 bento token 和三个区域
- 首页左侧圆形头像 → 换成首屏身份卡里的圆角方形原生活照
- 首页以“教育”开头 → 换成研究和作品优先，教育移到“关于”
- “记录”下拉菜单 → 拆成导航里的“写作”和“摄影”

继续有效：主标题是 王鑫 / Xin Wang，职务在下方；保留 Be Water, my friend；首屏不放邮件按钮；武大校徽只出现在首页教育标题旁；GameLibrary 应用图标放在网页标题旁；导师名放在日期后、右对齐并加粗；“联系我：”标签用普通继承色，放在邮件链接之外；爱好计数器视觉隐藏但保留给读屏器。

## 5. 技术约束

- **不新增依赖。** 继续使用 Hugo 模板、原生 CSS 自定义属性和现有的原生 JS（`assets/js/images.js`、`hobbies.js`、`reveal.js`、`accounts.js`）。新组件不要用 Tailwind 工具类堆样式，不引入前端框架。
- **CSS 结构。** 用 `assets/css/` 下按职责拆分的文件替换 `tokens.css`、`academic.css`、`book.css`：tokens、base、components、zones、pages。通过 Hugo Pipes 的 `resources.Concat | minify | fingerprint` 输出（`accounts.css` 已经是这种方式），同时更新 `config/_default/module.yaml` 中的静态挂载白名单。
- **模板。** 优先在现有 partial 里改结构和类名（`layouts/_partials/book/`、`layouts/_partials/hbx/blocks/book-overview/block.html`），不为改名而改名；`content/*/_index.md` 引用的 block 名保持不变。`book-*`、`masthead-academic` 这类旧专用类名可以替换。
- **字体必须自托管**，不用 Google Fonts CDN（会把访客 IP 泄露给第三方）。扩展 `scripts/prepare_assets.py`：按站内实际用字子集化 Inter、Cormorant Garamond Italic、Silkscreen，并附上各自的 OFL 许可文件；继续使用 Noto Sans SC / Noto Serif SC 子集。
- **图标**用内联 SVG（`currentColor`），生产界面不用 emoji（各平台渲染不一致）。
- **图片。** 只用仓库里已授权、已去除元数据的公开衍生图（`assets/images/` 和 `photography/`、`hobbies/`）。新增照片需要站主授权，并重新导出（清除 EXIF/XMP），原片不动。所有图片都要有 `alt`、宽高，首屏以下的图片加 `loading="lazy"`。
- **交互。** 保留原生 dialog 图片查看器（缩放、边界内拖动、键盘与触屏操作、焦点恢复、无脚本时直接打开图片）。爱好轮播可以改成胶片条形式，但要保留按钮和键盘操作、无自动播放、读屏计数。不开 JS 时内容默认可见；所有动效在 `prefers-reduced-motion` 下关闭。
- **文案。** 新增的界面文字（区块副标题、按钮、状态文字）写进 `i18n/zh.yaml` 和 `i18n/en.yaml`，中英同步。预览里的装饰性文案（如“研究情绪与自我，也做软件和游戏”“组队一起做点什么？”“Things I make”）不是站主原话，上线前逐条确认，不确认就不用。
- **“正在进行”卡片**的内容来自 `data/{zh,en}/authors/me.yaml` 中新增的字段（如 `now`），由站主提供或确认，不写死在模板里。
- **深色模式**不在本次范围（`theme_toggle: false`）；影像区的深色是设计本身的一部分，不是主题切换。

## 6. 内容事实与隐私边界（沿用旧规则）

- **唯一维护源**：`data/{zh,en}/authors/me.yaml`；`content/{zh,en}/research/`、`projects/`、`publications/`、`experience.md`；界面文字在 `i18n/`，配置在 `config/_default/`。首页摘要、详情页和 CV 都读取这些源文件。`.local/public-profile.json` 只是校验投影，不是维护源。
- 稳定 ID、日期精度、论文作者顺序与 DOI 不变。PROM 数字为 283 名患者、100 位家属、17 位专家；不要导入求职简历里冲突的 316/196。
- 核心资料、研究、作品、论文和 CV 中英完全同步；笔记和日记允许中文首发，英文列表标注语言并链接中文正文。
- **可以公开**：已批准的经历事实、公开邮箱 `sumingwang@qq.com`、已有的公开 GitHub / DOI 链接、已批准的图示、已授权且无元数据的照片。
- **禁止公开**：手机号、原始 Word/PDF、证书、身份证件、私有路径、研究或访谈数据、企业内部材料；也不要添加推断出来的论文、结果、学位类型或未核实的 Scholar / ORCID 链接。
- `files/job-resume-public.pdf` 是已批准的脱敏副本，不得用原件替换。
- `.local/`、`.openai/`、运行时目录、私有审查 PDF、原始照片和源文档不进 Git，也不进部署产物。根目录的 `codex会话.md`（约 75 MB）不提交。
- **账户与博客**：Supabase Auth 负责账户，`public.blog_posts` 负责在线文章，管理员权限只在数据库白名单中。前端只能出现 publishable key；service_role、SMTP、数据库凭据、密码或验证码不得出现在源码、测试、预览或部署产物中。重构不得削弱 RLS、保存失败与冲突处理、访客 / 离线 / 无 JS 访问。

## 7. 重构流程

只在站主要求时工作；不设监听器、定时任务、自动抓取或付费 API。在专用分支上工作（如 `redesign/bento`），提交时显式列出路径，**不使用 `git add -A` 或 `git add .`**。

分阶段推进，每个检查点都给站主看桌面和手机截图，确认后再进入下一阶段：

1. **基线**：用现有工具构建，跑全部检查，记录当前通过 / 失败状态和截图（存到 `.local/redesign/baseline/`）
2. **Token 与外壳**：新的 CSS 结构、自托管字体、胶囊导航、页脚、`baseof.html` 接线 → **检查点 A**
3. **首页 bento**：首屏、研究、论文、写作、关于、联系
4. **作品区**：首页作品 band 加 `projects/` 列表与详情
5. **影像区**：首页生活 band、`photos/`、爱好、深色图片查看器 → **检查点 B**
6. **其余页面**：research / publications / experience / records / notes / journal / blog / account / admin，加上英文版全部页面
7. **收尾**：可访问性（对比度、焦点、键盘、读屏）、减少动态效果、无 JS、清理不再引用的旧 CSS 和图片引用 → **检查点 C**

删除仓库文件（例如退役的纸张纹理图）必须先经站主确认，一次只删一个明确路径。

### 检查

使用 Hugo Extended **0.162.0**、pnpm **10.14.0** 和锁定的模块与 lockfile；本机工具放在 `.local/runtime/`，不修改系统或用户环境变量。

```sh
python scripts/prepare_assets.py
python scripts/validate.py
pnpm run build
pnpm run verify
python scripts/validate.py --site public
```

`scripts/browser-check.cjs` 里写死了旧版视觉，例如断言 `book-paper-rough.png` 纹理，以及 `.masthead-academic`、`.home-banner`、`.banner-link`、`.portrait`、`.hobbies-track`、`.records-menu`、`.intro-subtitle`、`.wordmark` 等选择器。重构时要**同步改写这些断言，而不是删掉覆盖面**：视口溢出与截断、图片加载、查看器、轮播或胶片条的键盘与触屏、语言切换、下载、旧锚点、无 JS、减少动态效果、CV 两页，这些检查都必须保留。`validate.py` 里的内容事实检查不因视觉改动而放宽。

### 发布

PR 只做验证；合并到 `main` 且检查通过后，由 GitHub Actions 部署。**推送、开 PR、合并和部署之前都要先得到站主在当前对话中的确认。** 部署失败时保留现有部署，用 revert 或修正提交恢复，不强推。独立的 Sites 版本不随本次重构更新。

## 8. 待站主确认（首个检查点前问一次）

- 导航文案和首页顺序是否就按第 3 节执行
- 预览中的装饰性文案保留哪些、怎么改
- “正在进行”卡片的具体内容（中英）
- 首页影像区用哪几张照片、首屏摄影卡用哪一张
