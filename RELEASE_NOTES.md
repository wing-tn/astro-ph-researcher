# astro-ph-researcher v3.1.0

**发布日期**：2026-10-22  
**许可**：MIT  
**作者**：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）

## 这是什么

面向天文学生与研究者的 DSH / Codex 工作台：

- NADC 审定术语核验 + 本地术语本；
- 文献检索、参考文献库与 BibTeX/APA/GB 7714 引用；
- 14 个天文期刊 + 21 个中国高校/中科院院所学位论文格式；
- 10 种目标感知写作风格；
- 34 个数据处理/统计方法 + 9 条统计原理；
- 30 个观测设施、8 本推荐书籍、文件格式/分析工具；
- 9 个 Agent Skills，DSH 与 Codex 双版本。

## v3.1 新增：深度与交叉学科

- 新增「深度」页：8 个交叉/前沿领域：
  - 天体化学、机器学习/神经网络、核天体物理/粒子、
  - 多信使/时域、宇宙学/大尺度、行星/天体生物、
  - 仪器/实验室天体物理、统计/因果与可复现、开放科学。
- 15 条广度/深度提示词：假设审计、选择函数、系统误差、单位/零点、简并、零模型、试验因子、ML 泄漏/域移、多波段一致性、模拟-现实差距、可复现性、结论强度、AI/伦理声明等。
- 新增 `astro_deep_scan` 工具与 `/deep` API；输出“检查问题/可检验诊断”，不把问题当结论。
- 输入框下方新增「🔎 盲点」入口；扫描结果可复制或加入研究计划树。
- Codex 新增 `deep` CLI 与 `deep-prompts.seed.json`。

## v3.0 保留

- 6 套主题、自定义底色、本地背景图、高对比模式；
- 研究计划树（本地保存、导出 Markdown/JSON、记录对话选中信息）；
- 对话框下方应用/Skill 选择工具条；
- 交接弹窗（当前/已有/新建对话 + 设置）；
- Codex 研究计划模板与 `plan` CLI。

## 安装

### DSH

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
dsh plugin --profile desktop add .
```

完全重启 DSH 后，设置页显示 `astro-ph-researcher v3.1.0`。

### Codex

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
codex plugin marketplace add .
codex plugin add astro-ph-researcher@astro-ph-researcher-local
```

## 验证

```text
host-smoke: 27 tools, routes, deep scan, plan store
client-smoke: sidebar + overlay + composer.input.left + composer.dock
formula-ui: 56 formulas
data-library: 34 methods / 30 instruments
deep: 8 domains / 15 prompts
```

完整说明见 [README.md](README.md)；版权/隐私/安全见 [DISCLAIMER.md](DISCLAIMER.md)、[PRIVACY.md](PRIVACY.md)、[SECURITY.md](SECURITY.md)。
