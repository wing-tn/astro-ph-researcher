# astro-ph-researcher v3.2.0

**发布日期**：2026-10-22  
**许可**：MIT  
**作者**：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）

## v3.2 新增：新手循序渐进教程

- 首次打开可选择「我是新手，开启教程 / 有经验，跳过」；设置页可随时切换。
- 9 步路径：
  1. 学习地图：天文研究在做什么；
  2. 文献调研：可核验证据链；
  3. 可证伪研究问题；
  4. 研究计划树；
  5. 项目框架：数据/代码/图可追溯；
  6. 基于理论写正确代码：量纲、测试、基准；
  7. 结果评判：误差预算、零模型、注入-恢复；
  8. 英文期刊论文：一句话贡献与 IMRaD；
  9. 选刊、投稿与返修。
- 每步有目标、动作、交付物、检查清单、常见坑、可复制提示词。
- 进度保存到本地；每步可「加入计划」；输入框下方新增「🎓 新手」。
- 新增 `astro_novice_path` 工具、`/novice` API。
- Codex 新增 `beginner` CLI 与 `novice-path.seed.json`。

## v3.0/v3.1 保留

- 6 套主题、自定义底色、本地背景图、高对比模式；
- 研究计划树、输入框下方应用/Skill 工具条、交接弹窗；
- 9 个深度/交叉学科领域与 15 条盲点提示词；
- 34 个数据处理/统计方法、8 本推荐书籍、9 个 Agent Skills。

## 安装

### DSH

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
dsh plugin --profile desktop add .
```

完全重启 DSH 后，设置页显示 `astro-ph-researcher v3.2.0`。

### Codex

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
codex plugin marketplace add .
codex plugin add astro-ph-researcher@astro-ph-researcher-local
```

## 验证

```text
host-smoke: 28 tools, routes, novice path, deep scan, plan store
client-smoke: sidebar + overlay + composer.input.left + composer.dock
formula-ui: 56 formulas
data-library: 34 methods / 30 instruments
novice: 9 steps
deep: 9 domains / 15 prompts
```

完整说明见 [README.md](README.md)；版权/隐私/安全见 [DISCLAIMER.md](DISCLAIMER.md)、[PRIVACY.md](PRIVACY.md)、[SECURITY.md](SECURITY.md)。
