# 高中生也能懂的扩散模型

第一单元的完整交互式教材：三课、三个实验、九道带解析的题目。正文面向高中知识基础，材料范围与教学补充单独标注。

**维护状态（2026-10-16）：源码基于原始附件修复，并移植到现有仓库的真实 main 提交上。GitHub Actions 的 Node.js 22.23.3：37 项测试通过、构建通过；Chromium 单文件 39 项、真实 HTTP 33 项通过。[PR #1](https://github.com/dreamlong1/diffusion-course/pull/1) 待审核，Pages 尚未部署。证据与边界见 [QA.md](QA.md)。** 正式目标地址为 `https://dreamlong1.github.io/diffusion-course/`；提交代码不等于完成部署。

## 先看成品，不用安装开发工具

打开交付包中的 `预览.html`（或单独提供的 `diffusion-course-preview.html`），即可使用全部课程、实验、题目与术语搜索。它是完整的单文件版，没有外部字体、脚本或图片依赖。浏览器禁止本地存储时会显示提示，交互仍可使用。

`dist/index.html` 是多页面网站的入口。各页采用相对链接，并显式指向 `index.html`；发布到项目路径后仍能正确引用样式与脚本。GitHub Pages 正式部署应使用构建出的 `dist/` 内容。

## 发布到 GitHub

**推荐先审核 PR：** 使用 `fix/course-final-qa` 分支与 PR，操作见 [DEPLOY.md](DEPLOY.md)。下面的 `npm run deploy` 是直接发布 main 的备选方式，不会自动创建 PR，不适用于等待审核的分支。

本机准备 Node.js 22 或更高版本、Git、GitHub CLI。解压后在本项目目录打开终端：

```sh
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
npm run deploy
```

在浏览器中登录 **dreamlong1**。脚本会先检查账号、仓库及本地测试，列出将公开的源文件，再要求输入 `PUBLISH` 确认。**不要把密码、访问令牌或设备登录码发到聊天中。** GitHub CLI 的登录在你的电脑与 GitHub 之间进行。

更多说明、失败恢复与纯网页上传方式见 [DEPLOY.md](DEPLOY.md)。查看计划而不进行 GitHub 读写：

```sh
npm run deploy:plan
```

## 本地维护

没有 npm 依赖，不需要 `npm install`：

```sh
npm test
npm run build
npm start
```

预览地址是 `http://127.0.0.1:4321/diffusion-course/`。服务器只监听本机。停止服务器使用 Ctrl+C。`npm run build` 会重建 `dist/`，同时生成 `.preview/course-preview.html`。

## 目录

```text
content/lessons/01.mjs       第一课正文、目标、题目
content/lessons/02.mjs       第二课正文、目标、题目
content/lessons/03.mjs       第三课正文、目标、题目
content/glossary.mjs         术语定义与材料说明
src/templates.mjs           页面布局、首页、资料页
src/experiments.mjs         三个交互实验的界面
src/math.mjs                原生 MathML 公式
src/core.js                 可单元测试的数学函数
src/app.js                  浏览器交互与本地进度
src/styles.css              桌面、手机、键盘与打印样式
scripts/build.mjs           无网络、零依赖构建
scripts/serve.mjs           本机静态预览服务器
scripts/verify-pages.mjs    线上版本、六个页面和三项资源的字节核验
scripts/deploy.mjs          账号核对、创建、推送与发布
.github/workflows/pages.yml 主分支自动发布，PR 只检查
```

修改课程后运行测试和构建，再通过 PR 合并到 `main`。只有 `dist/` 被作为 Pages 工件发布，原 PDF 和源文件不会进入网站工件；源代码仓库本身则是公开的。

## 首版的实现调整

原方案推荐 Astro / MDX 和 KaTeX。制作环境无法下载依赖，首版改用零依赖的 Node.js 静态生成、原生 JavaScript 和 MathML；**没有声称已构建或测试 Astro 项目**。课程逐课拆分、自动发布、移动布局和所有计划的首版实验仍然保留。后续迁移到框架时可以复用正文、题库、数学核心与交互逻辑。

## 测试与边界

完整记录见 [QA.md](QA.md)。该站不包含真实 DDPM 推理或浏览器神经网络训练。数值实验是公式演示，去噪播放器是流程示意。课程引用来源、简化方式和后续章节范围见 [CONTENT-NOTES.md](CONTENT-NOTES.md)；素材范围见 [RIGHTS.md](RIGHTS.md)。
