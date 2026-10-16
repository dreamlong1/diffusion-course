# 完整课程验收（2026-10-16）

## 本轮范围与状态

版本 2.0.0：12 课、12 实验、36 题、24 术语；15 个页面和 4 项资源。分支 `feat/complete-course` 基于已合并的真实 main `acfd6b7dc2d95955f67cc4891dfb6a9ddf63a279`。原三课记录沿用 localStorage v1，修复两位课号、锚点与 12 课进度分母。

本轮开始时三课版 1.0.1 已正式上线：https://dreamlong1.github.io/diffusion-course/ 。运行 https://github.com/dreamlong1/diffusion-course/actions/runs/38866262562 成功，正式 build-info.json 的 revision 匹配上述 main。**新 12 课版待 PR 审核及发布，不把旧站成功视为新版成功。**

## 当前测试

- PR：https://github.com/dreamlong1/diffusion-course/pull/2 ，保留待审核。
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

## 尚未验证和范围限制

- 十二课版正式 HTTPS 部署，待 PR 合并后核验。本轮通过的是 GitHub runner 中的真实 HTTP 浏览器检查，不能据此声称新十二课已在正式域名上线。
- Safari/Firefox、真实 iOS/Android 设备、屏幕阅读器完整审计。
- 原 PDF 页码映射：未取得原 PDF，不声称逐页核对。
- 网站不包含训练好的图像或机器人模型，不做真实模型质量/任务成功率评估。第五课只训练一个线性参数，其他实验边界见 CONTENT-NOTES.md。
