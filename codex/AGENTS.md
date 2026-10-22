# AGENTS.md · Codex 使用说明

## 本地可视化文献窗口（新增）

用户要求打开文献窗口时，从本目录运行 `node ui/server.mjs`（Node.js 22+）；服务只监听 `127.0.0.1`，默认地址 `http://127.0.0.1:4317`，可用 `--port 4318` 换端口。若有浏览器面板工具，用它打开服务实际打印的 URL；否则向用户提供该链接。复用已有服务，先检查 `/api/health`，不要重复占用同一端口。Windows 可双击 `start-ui.cmd`。

3.4.0 窗口还提供写作项目与逐节编辑、作者确认、新手九步路径、研究计划、方法/设备库、跨学科检查和汇报 Markdown。中英文界面可切换；启动英文窗口用 `node scripts/open-ui.mjs --lang en`。

用户要求主界面按钮时，用 `node scripts/install-action.mjs --project <用户项目目录> --lang zh|en` 安装项目操作入口；保留已有配置。该入口显示在支持本地操作的 Codex 桌面版顶栏，不能声称是全局侧栏按钮。不要通过置顶聊天冒充插件入口。源码附带 `.codex/environments/environment.toml`，项目打开时由宿主发现。

文献库为 `ui/local-data/library.json`；写作、计划和进度为同目录 `workbench.json`。它们与 DSH 库分开，`ASTRO_UI_LIBRARY` 可指定文献文件路径，工作台文件随其目录存放。不要自动迁移或覆盖旧库。详情见 `README-3.4.zh.md` / `README.en.md`。网页不自动调用模型，写作和演示文稿为交接流程；评分不验证科学结论，作者确认须本人完成。

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
- v2 逐节写作/评分/作者确认/格式/工具：`astro-research-workflow`

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
