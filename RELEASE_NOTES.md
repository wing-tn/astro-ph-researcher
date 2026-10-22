# astro-ph-researcher v3.0.0

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
- 9 个 Agent Skills，DSH 与 Codex 双版本；
- **v3 新增**：6 套主题、自定义底色、本地背景图、高对比模式；
- **v3 新增**：研究计划树（本地保存、导出 Markdown/JSON、记录对话选中信息）；
- **v3 新增**：对话框下方应用/Skill 选择工具条；
- **v3 新增**：交接弹窗（当前/已有/新建对话 + 设置）；
- **v3 新增**：Codex 研究计划模板与 `plan` CLI。

## 安装

### DSH

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
dsh plugin --profile desktop add .
```

完全重启 DSH 后，侧栏出现「天文术语」；设置页显示 `astro-ph-researcher v3.0.0`。

### Codex

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
codex plugin marketplace add .
codex plugin add astro-ph-researcher@astro-ph-researcher-local
```

## v3 变化

- 外观主题与高对比；背景色/本地图片；面板宽度与缩放。
- 「计划」标签页：研究计划树；节点状态/阶段/证据；记录选中；导出。
- 输入框下方工具条：计划、记录选中、外观、应用、Skill。
- 「交给 DSH」不再直接发送：先选当前/已有/新建对话与设置。
- Codex：`research-plan-template.json`、`node codex/scripts/astro-cli.mjs plan`。

## 从旧版升级

- 包名保持 `astro-ph-researcher`。
- 首次启动自动把 `$DSH_HOME/astro-words` 迁移到 `$DSH_HOME/astro-ph-researcher`。
- 旧 DSH bundle `dsh-astro-words` 需要卸载；旧 Codex 插件也需要移除后重装。
- 路由保持 `/api/astro-ph-researcher/*`；工具名 `astro_*` 保持。

## 验证

```text
host-smoke: 26 tools, routes, plan store
client-smoke: sidebar + overlay + composer.input.left + composer.dock
formula-ui: 56 formulas
v2 core: sections/scoring/confirmation/libraries
data-library: 34 methods / 30 instruments
```

完整包说明见 [README.md](README.md)；版权/隐私/安全见 [DISCLAIMER.md](DISCLAIMER.md)、[PRIVACY.md](PRIVACY.md)、[SECURITY.md](SECURITY.md)。
