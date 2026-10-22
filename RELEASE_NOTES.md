# astro-ph-researcher v3.3.0

**发布日期**：2026-10-22  
**许可**：MIT  
**作者**：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）

## v3.3 新增：PPT 桥

- 新增「PPT」页：选择内容来源：
  - 收藏文章 / 参考文献库；
  - 研究计划树；
  - 深度/交叉学科盲点；
  - 新手路径。
- 生成可检查的 PPT Markdown 预览，可复制/下载 `.md`。
- 「交给 DSH 生成 PPT」会走统一交接弹窗（当前/已有/新建对话），并让 DSH 使用已安装的 **dsh-ppt** 或 **dsh-ppt-maker** 生成 HTML/可编辑 PPTX。
- 页面提供两个 PPT 插件的 GitHub 链接，不复制第三方代码。
- 新增 `astro_ppt_outline` 工具与 `/ppt/*` API。
- 提示词强制：不编造数据/DOI/引用，数字与结论必须可追溯，草稿不能当最终稿。

## v3.2 保留

- 新手 9 步路径：学习 → 文献 → 问题 → 计划 → 项目框架 → 理论/代码 → 结果评判 → 英文论文 → 投稿。
- 首次打开「新手/有经验」选择；本地进度；输入框下方「🎓 新手」。
- Codex `beginner` CLI 与 novice-path 数据。

## v3.0/v3.1 保留

- 6 套主题、自定义底色、本地背景图、高对比；
- 研究计划树、输入框应用/Skill 工具条、交接弹窗；
- 9 个深度/交叉学科领域、15 条盲点提示；
- 34 个方法、8 本推荐书籍、9 个 Agent Skills。

## 安装

### DSH

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
dsh plugin --profile desktop add .
```

完全重启 DSH 后，设置页显示 `astro-ph-researcher v3.3.0`。

### Codex

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git
cd astro-ph-researcher
codex plugin marketplace add .
codex plugin add astro-ph-researcher@astro-ph-researcher-local
```

## 验证

```text
host-smoke: 29 tools, routes, PPT outline, novice path, deep scan, plan store
client-smoke: sidebar + overlay + composer.input.left + composer.dock
formula-ui: 56 formulas
data-library: 34 methods / 30 instruments
novice: 9 steps
deep: 9 domains / 15 prompts
ppt: 4 sources / Markdown + handoff prompt
```

完整说明见 [README.md](README.md)；版权/隐私/安全见 [DISCLAIMER.md](DISCLAIMER.md)、[PRIVACY.md](PRIVACY.md)、[SECURITY.md](SECURITY.md)。
