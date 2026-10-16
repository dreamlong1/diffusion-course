# 高中生也能懂的扩散模型

从高中数学出发的完整入门路线：**12 课、12 个交互实验、36 道带解析练习、24 个术语**。保留原有三课与静态站架构，补齐训练、采样、Score、Flow Matching、Flow Maps、Diffusion Policy 和综合实践。

正式网站：https://dreamlong1.github.io/diffusion-course/ 。2.0.0 完整课程已于 2026-10-16 发布。独立分支 `feat/complete-course` 的 PR #2 已按维护者直接上线授权合并；GitHub Actions 已完成部署及全部页面与资源的内容核验，正式 HTTPS 交互也已复查。发布证据与测试限制见 [QA.md](QA.md)。

## 学习路线

| 单元 | 课程 | 动手实验 |
|---|---|---|
| 核心直觉 | 1 扩散模型是什么 | 数字与图像加噪 |
| | 2 AI 怎样学会去噪 | 预测噪声与平方损失 |
| | 3 为什么要一步步去噪 | 余弦调度与时间 |
| 从数据到生成 | 4 随机噪声也有规律吗 | 高斯样本直方图 |
| | 5 模型究竟怎样学会预测 | 单参数梯度训练 |
| | 6 把一轮去噪算清楚 | DDPM 反向均值与方差 |
| | 7 怎样让生成结果听懂要求 | 条件与无条件预测组合 |
| 生成方法与应用 | 8 Score：哪边更像数据 | 高斯 Score 方向 |
| | 9 Flow Matching：学习怎样移动 | 配对路径与速度损失 |
| | 10 能不能更少几步 | Euler 近似与已知 Flow Map |
| | 11 Diffusion Policy：生成一串动作 | 计划六步、执行一部分 |
| | 12 综合实践 | 噪声误差与重建误差对照 |

每课含目标、正文、可手算例子、实验任务、三道题与解析、总结、来源。进阶推导可折叠，不要求先懂微积分或编程。“完整”指完整入门路线，不是大模型训练或真实机器人部署训练营。第五课确实更新一个线性参数；其他实验的模型边界逐项标注，不冒充训练好的神经网络。详细依据见 [CONTENT-NOTES.md](CONTENT-NOTES.md)。

## 本地运行

Node.js 22，无 npm 依赖，无需 `npm install`：

```sh
npm test
npm run build
npm start
```

打开 http://127.0.0.1:4321/diffusion-course/ 。构建生成 `dist/`（15 页、404、4 项资源、构建清单）和 `.preview/course-preview.html`（完整离线单文件）。正式站有独立课程 URL；单文件用 hash 切换全部 15 个视图。

学习记录只保存在当前浏览器，原三课的记录自动保留；不会上传答案。换设备不自动同步。浏览器禁止存储时仍可操作实验。移动端目录可滚动，所有实验支持键盘，公式使用原生 MathML，不加载外部字体。

## 源码结构

- `content/course.mjs`：课程、单元、路径和题目数量的统一入口。
- `content/lessons/01.mjs` 至 `12.mjs`：正文与题目；`content/glossary.mjs`：术语。
- `src/templates.mjs`、`styles.css`：网站布局；`math.mjs`、`lesson-kit.mjs`：教学标记。
- `src/core.js`：可测试的数值函数；`app.js`：原实验与共享进度；`advanced-app.js`：新实验。
- `src/experiments.mjs`、`advanced-experiments.mjs`：实验界面。
- `scripts/build.mjs`、`serve.mjs`、`verify-pages.mjs`：构建、预览和线上字节核验。
- `tests/`：数学、静态页面、HTTP、发布核验与 Chromium 浏览器回归。

## 发布与测试

优先分支和 PR。GitHub Actions 在 Node.js 22 测试构建，再运行 Python Playwright/Chromium 回归；测试工具不进入网站。PR 只检查，main 合并后发布 Pages，并核对提交版本、全部 15 页和 4 项资源。操作见 [DEPLOY.md](DEPLOY.md)。

本地浏览器复现与尚未验证的环境见 [QA.md](QA.md)。不上传原 PDF，不提供账号系统或付费服务，不为原材料擅自授予开放许可，见 [RIGHTS.md](RIGHTS.md)。
