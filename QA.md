# 本次验收记录（2026-10-16）

## 结论

源码修复、Node.js 22 测试、构建与真实 Chromium 浏览器回归已完成；**正式部署尚未完成**。

- PR：https://github.com/dreamlong1/diffusion-course/pull/1 （保留待审核，没有自动合并）。
- 已通过运行：https://github.com/dreamlong1/diffusion-course/actions/runs/38863766754 。测试源提交为 `62cad60dc6943b74fc4ac710097557c93f1ace65`；PR 工作流检出 GitHub 生成的合并预览提交。
- 工作流 build 成功，deploy 按 PR 条件跳过，这是预期行为，不能作为已发布证据。
- 2026-10-16 对正式目标六个路径检查均为 HTTP 404：`/`、`lessons/1/`、`lessons/2/`、`lessons/3/`、`glossary/`、`sources/`（均位于 `/diffusion-course/` 下）。
- 现有 GitHub 连接支持分支、提交、PR 和 Actions 读写，但没有 Pages 设置操作。首次配置需管理员在 **Settings → Pages → Source → GitHub Actions** 完成。此前浏览器登录授权被取消，未重试或索取凭据。

保留附件的三课、三个实验、九题与零运行依赖架构；修复分支 `fix/course-final-qa` 基于真实远端 main 的 `23cd78db64326d94aba9ab212a7d8d846b468399`，没有使用附件的合成历史覆盖远端。

## 本次实测结果

| 检查 | 本次结果 | 实际覆盖 |
|---|---|---|
| GitHub Actions Node.js **22.23.3** `npm test` | **37 项通过，0 失败，0 跳过** | 数学、构建、内链及锚点、脚本语法、发布保护、HTTP 服务、部署内容核验 |
| Node.js 22.23.3 `npm run build` | **成功** | 六页及 404、三项资源、构建清单、完整单文件预览 |
| Chromium **153.0.8010.12** 单文件版 | **39 项通过，0 失败** | 三实验、九题、画布噪声、术语、播放暂停、菜单、键盘、非法 hash、存储恢复替身及真实禁用存储 |
| 同一 Chromium，真实 HTTP 导航 | **33 项通过，0 失败** | 原生 localStorage 跨页与刷新恢复、三个实验、九题、手机导航、存储损坏恢复；六页在 320/360/390/768/1366px 均无整页横向溢出 |
| 截图人工查看 | **完成** | 桌面首页、手机第三课、第三课公式与滑块实验；中文、MathML、画布清晰，无所检查区域的明显遮挡或裁切 |
| 发布核验器 HTTP 回归 | **通过** | 正确构建通过；旧提交、404、200 错误页面、JS 错误 MIME 被拒绝 |
| 正式 GitHub Pages | **未部署** | PR 未合并、deploy 跳过；正式六页仍 404 |

37 项 Node 测试包含两个 HTTP 测试组及合计 10 个子测试，不是 37 个测试文件。本地 Node.js 22.16.0 此前也通过相同 37 项与构建。网站不需 npm 依赖；CI 使用 Playwright Python 1.63.0 与其 Chromium，仅作为测试工具。

完整浏览器报告与截图位于上述 Actions 运行的 **browser-checks** 工件（保留 7 天）：https://github.com/dreamlong1/diffusion-course/actions/runs/38863766754/artifacts/12030705010 。其中 `browser-report.json` 为 39 项，`browser-http-report.json` 为 33 项；后一份测试没有替换 localStorage。测试全程无捕获到的未处理页面错误或失败资源请求。

此前本地 Chromium 启动失败（SIGTRAP），因此没有沿用附件首版“36 项浏览器通过”的旧结论。本次新结论来自 GitHub Ubuntu runner 的真实运行与下载报告。

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

1. 正式 GitHub Pages 部署、HTTPS 六页及该 HTTPS 源上的学习进度。需要完成 Pages 配置和 PR 审核合并后，再看 main 的发布及字节核验结果。
2. Safari、Firefox、真实 iOS/Android 设备、屏幕阅读器完整审计。手机测试是 Chromium 视口模拟，不是真机。
3. 原 PDF 的具体页码及引用对应关系；本次没有取得原 PDF。

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
