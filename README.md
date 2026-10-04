# 王鑫 · Xin Wang

心理学研究、实验设计与软件原型的双语个人主页。中文默认，英文入口为 `/en/`。

目标网址：[sumingwang233.github.io](https://sumingwang233.github.io/)。本站源自 [AcadHomepage](https://github.com/RayeRen/acad-homepage.github.io)，保留上游 MIT 授权；字体另附 SIL Open Font License。

## 内容维护

`_data/profile.json` 同时驱动中英文主页、可打印 CV 与下载 PDF。更新经历时改这份数据，不要在页面或 PDF 中另写一份履历。界面标签位于 `_data/interface.json`。

只在本会话要求“检查”或更新时运行维护；没有后台定时任务。默认来源为同级 `学术CV` 文件夹内的中英文 general DOCX。运行 `python scripts/inspect_sources.py` 可检测正文和链接变化；本地基线保存在 `.local/`，不会提交或部署。详细流程见 [AGENTS.md](AGENTS.md)。

公开范围为经过确认的经历、邮箱、公开链接与脱敏 CV。手机号、原始简历、证书、研究数据、访谈和企业内部材料均不得进入仓库或构建产物。新内容先在本地审阅，再创建公开 PR；你确认合并后上线。

主页提供学术简历与求职简历两个下载入口。`files/job-resume-public.pdf` 是用户提供的求职简历的脱敏副本：手机号与私人邮箱已从 PDF 中实际删除，保留批准公开的邮箱，文档元数据及附件已清理。原文件不进入仓库；更换副本时必须重新执行脱敏与文本、底层对象、元数据检查。兴趣版面使用原生横向滚动与 CSS 滚动吸附，支持触摸、按钮和键盘操作，不自动播放。

主页采用紧凑置顶导航、本人摄影横幅和圆形生活照，保留旧书页纹理。桌面端教育、技能与论文以标题/正文两列呈现，校园经历为双列；窄屏保持文档顺序。滚动淡入仅首次触发，图片缩放仅用于精细指针悬停；无 JavaScript、键盘聚焦、打印和减少动态效果模式保持正文可读，学术 CV 排版独立。

学术兴趣位于技能之后。导航按钮支持平滑锚点跳转，减少动态效果模式直接定位；图片可在页内查看器中缩放、拖动并通过 Esc 关闭，无 JavaScript 时仍可打开原图。教育标题旁的校徽来自[武汉大学官方标识下载](https://www.whu.edu.cn/xxgk/wdbs.htm)，保持原始双色图案与比例；校徽不属于本站代码的 MIT 授权。

## 构建与预览

使用 Ruby 3.3、Python 3.12 和 Node.js 24：

```sh
bundle install
npm ci
npx playwright install chromium
python -m pip install fonttools==4.66.1 brotli==1.2.0 PyMuPDF==1.27.2
python scripts/prepare_assets.py
python scripts/validate.py
bundle exec jekyll build --strict_front_matter
npm run verify
python scripts/validate.py --site _site
```

`npm run verify` 自动生成 `_site/files/cv-zh.pdf`、`cv-en.pdf`，检查手机与桌面宽度、字体、图片、语言切换与键盘导航，并将截图保存到本地 `.local/previews/`。

`scripts/validate.py` 使用 PyMuPDF 检查求职简历的可读文本，拒绝手机号和未批准的邮箱，以及元数据、附件、链接、注释和表单字段；无法提取文本或加密的 PDF 也不能通过。构建前检查源副本，构建后再检查实际部署副本，隐私回归样例不使用真实个人信息。CI 审阅产物仅包含指定的公开页面截图和生成的学术 CV PDF。

预览构建产物：`python -m http.server 4000 --directory _site`，访问 `http://localhost:4000/`。请先生成 PDF 再预览，以免下载链接缺失。

## 发布

GitHub Pages 的发布来源设置为 **GitHub Actions**。PR 只验证并生成审阅产物；合并到 `main` 后，工作流才部署 `_site`。CI 不读取本机 CV，也不会把私密来源上传到 GitHub。

首版未启用访问统计、Google Scholar 抓取、博客或付费 AI API。
