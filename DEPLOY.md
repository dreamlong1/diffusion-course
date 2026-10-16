# 发布指南

## 当前状态

仓库已创建并可访问。本次修复基于真实 main 初始提交 `23cd78db64326d94aba9ab212a7d8d846b468399`，在 `fix/course-final-qa` 分支提交，通过 PR 审核；没有覆盖或强推 main。测试与部署的最新证据见 [QA.md](QA.md)。

## PR 审核和首次 Pages 配置

1. 打开 https://github.com/dreamlong1/diffusion-course/pulls ，审核修复 PR 的 **Files changed** 与 **Checks**。构建门槛包括 Node.js 22 的 `npm test`、`npm run build`、Chromium 单文件与真实 HTTP 回归。`browser-checks` 工件包含报告和截图。
2. 仓库 **Settings → Pages → Build and deployment → Source → GitHub Actions**。已有 `pages.yml`，无需另建模板。GitHub 连接支持源代码操作不代表支持 Pages 管理；若连接无法配置，需要管理员在这里完成一次设置。
3. 审核通过后点击 **Merge pull request → Confirm merge**。不要把旧交付 bundle 的本地历史推送到已有 main，也不要使用 force。
4. 打开 **Actions → Build and publish diffusion course**，查看 main 提交。`deploy` 中的 **Verify published revision, six pages and three assets** 也必须成功，才算这份提交已发布并核验。需要重试时，在 main 选择 **Run workflow**。
5. 从 **Settings → Pages → Visit site** 获取实际地址。默认目标为 https://dreamlong1.github.io/diffusion-course/ 。还应在正式站点复查实验、题目与刷新后的学习进度；字节核验不能替代浏览器测试。

PR 仅检查，不部署。main push 或手动触发会在全部测试通过后部署。网站没有运行时第三方依赖；CI 的 Python Playwright 和 Chromium 仅用于测试。

## 备选：明确选择直接发布时运行脚本

### 准备工具

安装 Node.js 22 或更高版本、Git、GitHub CLI。官方获取页面：

- Node.js：https://nodejs.org/en/download
- Git：https://git-scm.com/downloads
- GitHub CLI：https://cli.github.com/

无需安装 npm 依赖。下载并解压交付包后，进入包含 `package.json` 的 `diffusion-course` 文件夹；在该目录打开终端。

### 登录并发布

```sh
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
npm run deploy
```

登录账号必须为 `dreamlong1`。`workflow` 权限用于推送工作流文件；不要在聊天中提供任何密码、令牌或设备登录码。若曾用其他账号登录，可先在本机使用 `gh auth switch --hostname github.com --user dreamlong1`，并运行 `gh auth status` 核对。

脚本会列出即将公开的源文件，要求输入 `PUBLISH`。随后会检查或创建公开仓库、推送 main、把 Pages 构建类型设为 workflow、触发 `pages.yml`，等待工作流结果，并读取实际站点地址，核对提交版本、六个页面与三项资源的 SHA-256 和 MIME 类型。第一次推送使用 `[skip ci]`，先完成 Pages 配置，再显式触发工作流，避免初始化竞态。

脚本仅在本仓库按需设置提交身份；Git 身份不存在时使用 GitHub 的 noreply 形式邮箱。GitHub CLI 为本次推送提供凭据，不把令牌写入源文件，不改全局 Git 配置。

### 安全边界

脚本不强制推送，不删除仓库，不改变已有仓库的可见性，不覆盖不相关的 origin，不重命名已有分支。不相关的非空仓库、私有仓库、不同登录账号、远端未合并提交或原有暂存文件都会使它停止。源文件目录中出现 PDF、字体、密钥或其他未允许文件时，自动上传会停止。

`--dry-run` 只输出计划，不调用 git/gh，不读取或修改远端：

```sh
npm run deploy:plan
```

### 发布遇到问题

如果提示找不到 gh/git/node，安装缺失工具后重开终端。若缺少 workflow 授权，可在本机运行 `gh auth refresh --hostname github.com --scopes workflow`，不要创建或粘贴令牌到聊天。

如果仓库已创建、但 Pages 配置或工作流失败，脚本不会回收已经完成的步骤。保留这个带 `.git` 的项目目录，查看仓库 Actions 日志并修复，再重跑脚本。不要重新解压到另一目录直接覆盖仓库，也不要添加 `--force`。

若平台或组织禁止 Actions/Pages，需要仓库管理员核对设置。自动脚本无法绕过仓库权限、审批或平台限制。Pages 设置入口为仓库 **Settings → Pages → Source → GitHub Actions**。此项目已带工作流，不必重复创建模板。

## 不安装命令行工具的备选方式

这是直接发布成品的方式，**不建立本包中的源码自动构建流程**：

1. 在 GitHub 登录 `dreamlong1`，创建名为 `diffusion-course` 的公开空仓库。确认它不是已有项目，不要上传原 PDF。
2. 把交付包 `dist/` 里面的文件和目录上传到仓库根目录，而不是上传外层 `dist` 文件夹。根目录应能看到 `index.html`、`assets/`、`lessons/`、`glossary/` 和 `sources/`。
3. 保留根目录的空文件 `.nojekyll`。若网页上传忽略了它，用 GitHub 的新建文件功能添加该名称。
4. 在 **Settings → Pages** 选择 **Deploy from a branch**，分支 `main`，目录 `/(root)`，保存。
5. 查看 GitHub 显示的实际发布网址，打开首页、三课、术语页和资料页，拖动实验，检查是否有缺失资源。

该备选方式以后需要重新上传构建成品才能更新；不能把“上传完成”直接等同于“部署完成”。

## 后续正常更新

优先通过分支与 PR 更新 main。工作流只在 main 的 push 或手动触发时部署，PR 仅测试、浏览器回归和构建；部署工作使用 `pages: write`、`id-token: write`，源码只读。构建清单包含提交 SHA 与九项文件摘要；部署后逐项核验内容，可发现旧页面、缺失资源和返回 HTTP 200 的错误页。这个核验流程已用本地 HTTP 测试覆盖，实际 Actions 运行结果以 QA.md 链接为准。

首次通过脚本发布后，在项目目录修改正文或交互，运行测试，再用普通 git 流程提交与推送 main。自动工作流会构建，PR 只执行检查，main 合并或推送才部署。网站工件保留期设为一天，避免无谓保留大量构建包。

回退时使用一次正常的撤销提交并推送，不需要强制重写历史。部署时不在源码或 HTML 中放私有访问令牌。

## 官方参考

GitHub Pages 中文发布源说明：https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

GitHub 自定义工作流：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

GitHub Pages API：https://docs.github.com/en/rest/pages/pages

GitHub CLI 创建仓库：https://cli.github.com/manual/gh_repo_create

GitHub CLI 登录：https://cli.github.com/manual/gh_auth_login
