# 完整课程验收（2026-10-16）

## 本轮范围与状态

版本 2.0.0：12 课、12 实验、36 题、24 术语；15 个页面和 4 项资源。分支 `feat/complete-course` 基于已合并的真实 main `acfd6b7dc2d95955f67cc4891dfb6a9ddf63a279`。原三课记录沿用 localStorage v1，修复两位课号、锚点与 12 课进度分母。

2.0.0 十二课完整版已正式上线：https://dreamlong1.github.io/diffusion-course/ 。维护者明确授权直接上线，PR #2 已合并。发布提交 `190cce355b3483acdaee7cda7b89c1c77f76649a`，成功工作流 https://github.com/dreamlong1/diffusion-course/actions/runs/38875290758 。部署步骤与随后线上核验均成功，正式 build-info.json 的 revision 匹配该提交；15 页与 4 项资源的 HTTP、SHA-256 和 MIME 全部匹配。本地独立运行 verify:pages 得到相同结果。此处记录完整课程首次发布证据；后续文档更新会产生新的提交和部署，最新 revision 以正式 build-info.json 及对应 Actions 结果为准。

## 当前测试

正式发布工作流 38875290758 再次通过下列全部 47 项 Node 测试和 170 项浏览器检查；以下 PR 工件是保留的开发验收报告。

- PR：https://github.com/dreamlong1/diffusion-course/pull/2 ，已按维护者授权合并。
- 成功运行：https://github.com/dreamlong1/diffusion-course/actions/runs/38870376348 ，测试源提交 `e4a41d55f53fa8fb7d71839bc1c158b43036a9e6`，PR 检出合并预览提交。
- 工件：https://github.com/dreamlong1/diffusion-course/actions/runs/38870376348/artifacts/12033196397 ，包含完整 `course-preview.html`、三份 JSON 报告与截图，保留 7 天。下载 HTML 即可离线审核全部课程。

| 套件 | 通过 / 失败 | 主要范围 |
|---|---|---|
| Node.js 22.23.3 | 47 / 0 | 数学、15 页构建、HTTP、发布核验 |
| browser_checks.py | 39 / 0 | 原三课单文件交互、存储替身与禁用回退 |
| browser_http.py | 33 / 0 | 原三课真实 HTTP 与原生 localStorage |
| browser_full.py | 98 / 0 | 全 36 题、12 实验、v1 记录迁移、两位课号、15 页、单文件后九课 |

完整课程的 15 页在 320/390/768/1366px 视口均无整页横向溢出。新增实验全部控件的最小/最大值未出现 NaN、Infinity 或无效图形；纯噪声反算端点明确提示不可计算。截图人工查看包括完整课程桌面首页、第十课积分实验、第十一课手机整页；正文、图表、题目和前后课导航无所检查区域的明显裁切。未捕获到测试页面的未处理脚本错误或失败资源请求。

首轮失败是新增测试的 `svg` 选择器同时选中 Logo 和实验图，已限定为实验区域；没有跳过这项测试。第二轮整套通过。

本地 Node.js 22.16.0 的 `npm test` 已通过 47 项（含 10 个 HTTP 子测试），0 失败、0 跳过；`npm run build` 成功，生成 15 页和完整单文件。GitHub Actions 的 Node.js 22.23.3 同样通过，Chromium 153.0.8010.12 的三套回归共 170 项全部通过。

- 数值：原三课例子、高斯统计、梯度训练、DDPM 后验方差及末步、CFG、Score 的数值导数核对、Flow 端点与速度、Euler 收敛、滚动规划、偏差放大与除零保护。
- 静态：全部课程和片段链接、唯一 ID、36 题解释、原生 MathML、12 实验、无 PDF/凭据进入工件。
- HTTP：15 页、4 资源 MIME、HEAD/404/405；发布核验拒绝旧提交、错误内容和错误 MIME。
- 浏览器脚本：保留原 `browser_checks.py` 与 `browser_http.py`，新增 `browser_full.py` 独立答案检验全 36 题、12 实验、旧记录迁移、两位课号、跨页和刷新恢复、端点有限值、15 页多视口、单文件后九课、手机长目录和键盘。

## 复现

```sh
node --version
npm test
npm run build
npm start
```

另一个终端，使用 Python Playwright 1.63.0 和其安装的 Chromium：

```sh
python -m pip install playwright==1.63.0
python -m playwright install chromium
python tests/browser_checks.py --chromium /实际路径/chrome
python tests/browser_http.py --chromium /实际路径/chrome
python tests/browser_full.py --chromium /实际路径/chrome
```

报告为 `.preview/browser*-report.json`，截图为 `.preview/screenshots/`。Actions 的 browser-checks 工件保留 7 天；网站运行和构建不需要 Playwright。部署后以同一 GITHUB_SHA 构建，再运行 `npm run verify:pages -- https://dreamlong1.github.io/diffusion-course/`，核对 19 个文件而非只看 HTTP 200。

## 正式站复查与范围限制

- 正式 HTTPS 已通过全部 19 项文件核验，并用云端 Chrome 实测：首页十二课导航；第五课训练一步（w 从 0 到 0.25、损失从 0.625 到 0.15625）；第十二课 t = 1 显示不可反算；数值题 −0.15 正确判分；标记阅读后刷新，保留 1/12 进度及上次正确答案。这是部署后的抽查，全部实验与题目的完整回归在 Actions Chromium 中执行。
- 正式站抽查过程中，辅助工具首次按 checkbox 查找阅读控件未匹配；按 DOM 实际 button 角色操作成功。捕获到的浏览器扩展元数据错误来自 chrome-extension，不属于网站脚本。
- Safari/Firefox、真实 iOS/Android 设备、屏幕阅读器完整审计。
- 原 PDF 页码映射：未取得原 PDF，不声称逐页核对。
- 网站不包含训练好的图像或机器人模型，不做真实模型质量/任务成功率评估。第五课只训练一个线性参数，其他实验边界见 CONTENT-NOTES.md。

Actions 的 configure-pages@v5 和 deploy-pages@v4 有 Node.js 20 目标弃用提示，当前 runner 已用 Node.js 24 执行并部署成功；项目测试和构建仍明确使用 Node.js 22。此提示未阻止发布，后续可随官方 action 版本更新维护。
