# 本次验收记录（2026-10-16）

## 结论

本地源码修复与静态构建完成，**未达到全部线上验收目标**。远端仓库现已可访问，正在基于真实 main 提交修复分支与 PR。GitHub Actions 和正式部署结果待本轮运行后更新；目前没有成功上线证据。

本次以附件 ZIP 为基线，保留三课、三个实验、九题和零运行依赖的静态站，没有从零重写。独立本地分支：`fix/course-final-qa`。

## 本次实测结果

| 检查 | 本次结果 | 实际覆盖 |
|---|---|---|
| Node.js 22.16.0 `npm test` | **37 项通过，0 失败，0 跳过** | 数学、构建、内链及锚点、脚本语法、发布保护、HTTP 服务、部署内容核验 |
| Node.js 22.16.0 `npm run build` | **成功** | 六页及 404、三项资源、构建清单、完整单文件预览 |
| 本地 HTTP 集成测试 | **通过** | 六页 200、资源 MIME、HEAD、未知路径 404、写请求 405 |
| 发布核验器回归 | **通过** | 正确构建通过；旧提交、404、200 错误页面、JS 错误 MIME 被拒绝 |
| Chromium 浏览器 | **启动失败，未验收** | Playwright 的 Chromium 134 与 headless shell 在进入网页前退出；独立诊断返回 SIGTRAP（-5），未取得本次截图或交互报告 |
| GitHub Actions 真实运行 | **未执行** | 已加入 Chromium 单文件与真实 HTTP 回归，待运行 |
| GitHub Pages | **未部署** | 没有成功运行或发布证据；首页仍 404 |

37 项包含两个 HTTP 测试组及其合计 10 个子测试；不是 37 个顶层测试文件。日志保存在交付包 `validation/node22-tests.log`、`validation/node22-build.log`，版本记录为 `validation/node-version.txt`。Node.js 安装包与官方 SHA-256 清单比对通过。

**附件内原 QA 的“29 项 Node / 36 项浏览器通过”属于首版制作记录，不代表本次验证。** 本次未沿用其浏览器通过结论。最新 Chromium 下载也曾返回无效压缩包；备用 Chromium 虽能显示版本，仍不能启动页面。没有把此问题标成网站本身的运行故障，也没有绕过环境访问限制。

## 修改与数学复核

- 手机目录加入首页、术语页、资料页；修正“开始第一课”文案与链接不一致。
- 单文件预览处理非法 URL 编码；跳到正文保留当前课并移交键盘焦点；阻止跨隐藏页面锚点滚动。
- 忽略布尔值、数组、空白等不合法的已存答案；空白重交时说明上次记录仍保留。
- 手机正文 16px、题目与说明 14px、关键按钮目标 44px；数值输入字号 16px，负数题保留可输入负号的键盘；段落行距收紧，不增加装饰动画。
- 算例：`0.8×10+0.6×2=9.2`；预测 `1.5` 时损失 `0.25`、估计 `10.375`；预测 `2` 时损失 `0`、估计 `10`；余弦端点为 `10/-2`，中点为 `4√2≈5.656854`。保留 α=0 防除零及接近零的误差放大提示。
- 解释合成噪声、向量求和/平均、加权目标与完整变分下界的区别；明确 DDPM 最后一步不再额外加噪。
- 补充 α 与 DDPM √ᾱₜ 的记号对应；区分连续无偏移余弦演示与真实 Improved DDPM 的偏移、归一化、离散化及单步噪声上限。t 是阶段，不是秒数。
- 来源页增加可公开核对的论文与作者代码。本次没有原 PDF，原有页码映射未逐页验证。
- Actions 保留 Node.js 22、PR 只检查、main 才发布；checkout 不保留凭据。部署 job 明确只读源码，允许 Pages/OIDC，部署后验证提交 SHA、六页与三项资源的字节摘要，不能用旧站点的 HTTP 200 冒充新部署成功。

## 尚未验证

1. 本次修改后的真实浏览器交互、MathML 渲染、画布、手机/电脑布局、键盘完整流程、九题提交，以及原生 localStorage 跨页面和刷新保存。已补充回归脚本，但当前浏览器启动失败，不能报告通过。
2. Safari、Firefox、真实 iOS/Android 设备、屏幕阅读器完整审计。
3. GitHub Actions 是否能够在真实仓库中取得工件、配置的 Pages 发布源是否有效、正式 HTTPS 六页与资源能否访问、HTTPS 本地进度。
4. 原 PDF 的具体页码及引用对应关系。

## 复现

Node.js 22，项目根目录：

```sh
node --version
npm test
npm run build
npm run deploy:plan
```

浏览器检查需要 Python Playwright 与可启动的 Chromium。它们仅用于测试，不是网站运行依赖。两个终端分别运行：

```sh
# 终端一
npm start
```

```sh
# 终端二：安装或使用自己已有的浏览器测试环境
python -m pip install playwright
python -m playwright install chromium
# 使用安装器实际给出的 Chromium 路径替换下面占位符
python tests/browser_checks.py --chromium /实际路径/chrome
python tests/browser_http.py --chromium /实际路径/chrome --base-url http://127.0.0.1:4321/diffusion-course/
```

`browser_checks.py` 检查单文件版，存储恢复使用测试替身；`browser_http.py` 真实导航本地六页，用原生 localStorage 检查刷新与跨页恢复，并检查 320/360/390/768/1366px 视口。二者只有运行到结束才会输出成功报告，报告和内部检查截图放在 `.preview/`。

发布后，使用同一提交构建的 dist 清单执行：

```sh
npm run verify:pages -- https://dreamlong1.github.io/diffusion-course/
```

该命令使用当前本地 `dist/build-info.json`；与 GitHub 构建比对时需让 `GITHUB_SHA` 对应同一提交，再运行 build。正常 GitHub Actions 已自动带入此值。手动验证不要拿 revision=null 的其他构建与线上版本作比较。

PR 审核和 Pages 手动点击步骤见 DEPLOY.md。交付包没有原始 PDF、凭据、第三方字体或测试浏览器二进制。
