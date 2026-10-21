# AGENTS.md · Codex 使用说明

本仓库的 `codex/` 是一个 **Codex CLI 插件**（`astro-ph-researcher`），同时提供 9 个 Agent Skills、只读数据和离线查询 CLI。

## 目录

```
codex/
  .codex-plugin/plugin.json   # Codex 插件清单
  skills/                     # 9 个 SKILL.md（已加 Codex 适配说明）
  data/                       # 术语/期刊/高校/方法/设备/写作目标 JSON
  scripts/astro-cli.mjs       # 离线查询 CLI
  AGENTS.md                   # 本文件
  README.md                   # 安装与使用
```

## 什么时候用哪个 skill

- 文献检索、综述、引用链：`astro-literature-research`
- Python 分析代码、单位/统计/复现：`astro-code-writing`
- 英文期刊论文、标题摘要、修订返修：`astro-english-journal-writing`
- 中文学位论文、学校格式、GB/T 7714：`astro-phd-thesis-writing`
- 选写作目标/叙述风格：`astro-writing-goals`
- 首次发现/确认/多信使：`astro-discovery-writing`
- 批判反驳/零结果：`astro-critical-writing`
- 跟进增量/方法/巡天/理论/综述：`astro-incremental-method-writing`

在 Codex 中可用插件命名空间调用，例如：

```text
Use $astro-ph-researcher:astro-literature-research to build a reading list for ...
```

## 数据查询（不依赖 DSH 工具）

```bash
node scripts/astro-cli.mjs stats
node scripts/astro-cli.mjs term redshift
node scripts/astro-cli.mjs method --id lomb-scargle
node scripts/astro-cli.mjs statistics --json
node scripts/astro-cli.mjs instrument FAST
node scripts/astro-cli.mjs journal ApJ
node scripts/astro-cli.mjs thesis 北京大学
node scripts/astro-cli.mjs goal refutation
```

- 输出默认是人类可读文本；加 `--json` 输出结构化 JSON。
- 数据只读本地 `data/`；不联网、不需要 API key。
- `astro_*`/`pyenv_*`/`dsh-*` 是 DSH 工具名，在 Codex 中不可直接调用；用 CLI + 系统 Python/venv 替代。
- 不要伪造 DOI、NADC id、期刊模板或设施数据政策；不确定就标“未验证”。
- 设备库是 curated 30 个设施；`verified:false` 的链接需用户确认。
- 方法库只保留通用技术知识与独立 Python 示例，不包含书籍/章节元数据。

## 验证

```bash
node scripts/astro-cli.mjs stats
# method 27 / statistics 9 / instruments 30 / journals 14 / thesis 21 / goals 10
```

插件清单遵循 Codex `.codex-plugin/plugin.json` schema；`skills` 指向 `./skills/`。实际安装以本机 Codex CLI 版本为准，详见 `README.md`。
