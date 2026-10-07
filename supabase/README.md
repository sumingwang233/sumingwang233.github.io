# 账户与写作后台

GitHub Pages 提供网页；Supabase Auth 保存邮箱账户，PostgreSQL 保存文章，私有 Storage 保存配图。访客无需注册，不会创建匿名账户。网站只使用公开 publishable key；service_role、数据库密码、SMTP 授权码均不进入网站。

## 接入步骤

1. 在 SQL Editor 完整运行 `migrations/202610050001_blog.sql` **一次**，创建本站的新表、函数与策略，不修改已有 Auth 用户。
2. 开启邮箱登录与 **Confirm Email**，将创建/重置密码的最小长度设置为 **12**。
3. URL Configuration 的 Site URL 为 `https://sumingwang233.github.io/`；Redirect URLs 添加 `https://sumingwang233.github.io/account/` 与 `https://sumingwang233.github.io/en/account/`。本地联调可另加实际使用的 `http://127.0.0.1:4000/account/` 和 `http://127.0.0.1:4000/en/account/`，不用任意公网通配地址。
4. 配置自定义 SMTP。QQ 邮箱的 Sender email address 和 Username 都填站主 QQ 邮箱，Host 为 `smtp.qq.com`，Port 为 `465`，Password 填邮箱生成的 **SMTP 授权码**，最低间隔保留 60 秒。凭据只填 Supabase 控制台；默认邮件服务只能发给项目团队成员。
5. 将 `emails/confirm.html`、`emails/recovery.html` 分别复制到 Confirm signup、Reset password 邮件模板。同时提供链接与验证码，跨设备打开邮件时可在网页输入验证码。
6. 站主本人在 `/account/` 用公开邮箱注册并验证，再在 SQL Editor 运行 `admin-bootstrap.sql`。只对**已验证**的 `sumingwang@qq.com` 授权。密码由本人输入，不要关闭邮件确认来绕过此步骤。
7. 使用普通非团队邮箱检查收信、验证、换设备登录和密码恢复；用站主账户检查 `/admin/` 草稿、发布、撤回，用独立访客浏览器确认草稿和配图不可访问。

项目公开配置在 `config/_default/params.yaml`。注册元数据、自填邮箱与隐藏按钮均不能授权管理员，实际权限由数据库维护。

## 写作

`/admin/`（英文 `/en/admin/`）提供标题、栏目、语言、摘要、标签、Markdown 正文、格式工具、配图、实时预览、草稿、发布、撤回、删除及文字备份。可设置整篇正文的字体、字号、行间距和字间距。修改每 30 秒自动保存，也可主动点击保存；离开前会提示未保存修改，连接失败或版本冲突会保留编辑器内容。

已发布文章出现在 `/blog/`、`/en/blog/` 和首页“我的博客”；正文使用 `/blog/post/?id=<UUID>`，语言切换保留文章 ID 并标明正文语言。后台列表同时包含所有在线文章和原有 Hugo 笔记。原有笔记第一次保存时导入数据库，已发布修改使用原有 `/notes/` 链接显示，源文件仍作离线回退；原图表继续由关联项目维护。来源笔记在后台可编辑和发布，移除它需要同步编辑网站源文件，因此不提供删除或撤回按钮。在线发帖无需 Git 提交或重建。

上线此版本前，在原项目 SQL Editor 执行 `migrations/202610070001_editor.sql`。已发布文章的修改保存在独立的 `blog_post_drafts` 表中，只有管理员能读取，点击发布后才替换公开正文；版本冲突会停止自动保存。配图只有被公开正文引用后才能由访客取得签名链接。正文排版限定为四种字体和固定数值范围，由数据库和显示层共同约束。

配图重新导出为最长边 2400 px、不超过 5 MB 的 WebP，清除 EXIF/XMP 与原始文件名。私有配图由 RLS 控制，签名链接有效一小时；撤回后访客不能获取新链接，已有链接可能在到期前继续有效。删除文章不自动删除 Storage 文件，维护时检查孤立文件后再手动清理。

正文用 DOMPurify 清理，禁止执行 HTML 脚本；图片只允许授权签名文件和现有站点素材。新文章额外汉字由系统中文字体补全，不必每次发帖重建字体。

## 持久保存与备份

账户和已保存文章在服务端；换设备、清理浏览器或重新部署不会删除它们。浏览器仅保存登录会话和本次访问方式。

文字导出包含在线文章、已有笔记和私有修改草稿 JSON，**不包含账户和图片**。应另外定期备份数据库与 Storage；账户备份须保持私有，不得提交到网站仓库。免费 Supabase 项目可能闲置暂停，长期可用性依赖所选方案和备份，免费托管不能保证永久存储。本功能不自动购买套餐或创建保活任务。

## 验证

```sh
node scripts/account-db-check.cjs
node scripts/account-browser-check.cjs
```

SQL 检查运行真实迁移，验证管理员授权、RLS、身份约束、草稿/配图隔离与版本冲突。浏览器检查使用实际打包 SDK 和隔离 HTTP 测试服务，测试账户与文章均不发往生产项目。`pnpm run verify` 包括上述检查及原有 96 个视口/PDF 检查；本地通过仍需第 7 步的真实邮件验收。

官方说明：[SMTP](https://supabase.com/docs/guides/auth/auth-smtp)、[密码与恢复](https://supabase.com/docs/guides/auth/passwords)、[邮件模板](https://supabase.com/docs/guides/auth/auth-email-templates)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[备份](https://supabase.com/docs/guides/platform/backups)、[免费项目暂停](https://supabase.com/docs/guides/platform/free-project-pausing)。
