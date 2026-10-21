# 演示文稿：astro-ph-researcher

面向 GitHub README / 项目介绍的 12 页 16:9 幻灯片。

| 文件 | 用途 |
|---|---|
| [`astro-ph-researcher.pdf`](astro-ph-researcher.pdf) | **静态 PDF**，用于 GitHub、邮件、打印 |
| [`astro-ph-researcher.pptx`](astro-ph-researcher.pptx) | 可编辑 PowerPoint |
| [`astro-ph-researcher.html`](astro-ph-researcher.html) | 浏览器放映版（方向键/翻页） |
| [`astro-ph-researcher.json`](astro-ph-researcher.json) | dsh-ppt 工程源文件 |
| [`astro-ph-researcher-cover.png`](astro-ph-researcher-cover.png) | README 封面图 |

## 页目录

1. 封面
2. 为什么需要它
3. 一条工作流
4. 术语：NADC 审定
5. 文献与参考文献库
6. 写作工作台
7. 数据方法库
8. 观测设备/数据
9. 八个 Agent Skills
10. DSH / Codex 两种安装
11. 质量与边界（含未完成项）
12. 可核验、可复现

## 重新生成

```text
ppt_edit / ppt_create 生成 HTML + PPTX + JSON
→ 逐页打印为 960×540 PDF
→ pypdf 合并为 12 页
```

本目录的 PDF 由 HTML 逐页打印后合并，尺寸为 **13.333 × 7.5 in（960 × 540 pt）**，与 16:9 幻灯片一致。PPTX 可直接在 PowerPoint/WPS 修改。

## 说明

- 作者：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）。
- 第 11 页保留“UI 未逐页点击验收 / 书籍未逐页精读 / 30 个设施是 curated 子集 / 云端未实现”等边界，不粉饰。
- PDF 里的链接是文本；要点击跳转请用 HTML 版。
- 许可：MIT。
