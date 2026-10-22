# astro-ph-researcher · Codex 版

把 `astro-ph-researcher` 的天文术语、文献方法、写作规范与数据工作流带给 **OpenAI Codex CLI**。

这个目录是 **Codex 插件 + 9 个 Agent Skills + 只读数据 + 研究计划模板 + 离线查询 CLI**。它不依赖 DSH 运行时；DSH 的 `astro_*` 工具在 Codex 中不可用，因此这里用 `scripts/astro-cli.mjs` 和本地 `data/` 代替。

## 包含什么

| 内容 | 路径 |
|---|---|
| Codex 插件清单 | `.codex-plugin/plugin.json` |
| 9 个 skill | 文献/代码/英文期刊/学位论文 + 写作目标/发现/批判/增量方法 + v3 研究流程（含计划树） |
| 数据 | `data/`：29 术语、14 期刊、21 高校/院所格式、34 方法 + 9 统计、30 观测设施、10 写作目标、8 推荐书籍、文件格式/分析工具、研究计划模板 |
| 离线 CLI | `scripts/astro-cli.mjs` |
| 安装脚本 | `install-skills.sh` / `install-skills.ps1` |

## 安装方式 A：作为 Codex 插件（推荐）

前置：Codex CLI **0.149.0-alpha.4.3** 或支持 `.codex-plugin` 的版本；本机实测平台为 Windows + Codex CLI 0.149.0-alpha.4.3。

```bash
git clone https://github.com/wing-tn/astro-ph-researcher.git astro-ph-researcher
cd astro-ph-researcher
codex plugin marketplace add .
codex plugin add astro-ph-researcher@astro-ph-researcher-local
codex plugin list
```

应看到：

```text
astro-ph-researcher@astro-ph-researcher-local  installed, enabled  3.0.0
```

然后在 Codex 中按命名空间调用 skill：

```text
Use $astro-ph-researcher:astro-literature-research to build a verifiable reading list for ...
Use $astro-ph-researcher:astro-code-writing to write a reproducible Python analysis for ...
```

> 插件安装到 Codex 缓存后，修改 `codex/` 下的文件不会自动更新；需要：
> `codex plugin remove astro-ph-researcher@astro-ph-researcher-local`，再 `codex plugin add ...`。

## 安装方式 B：只装 skills

如果不想启用插件，只用 9 个 skill：

### Windows PowerShell

```powershell
.\codex\install-skills.ps1
```

### macOS / Linux

```bash
bash codex/install-skills.sh
```

默认复制到 `${CODEX_HOME:-$HOME/.codex}/skills/`。这会让 Codex 能发现 `SKILL.md`，但不会自动附带数据 CLI；需要数据时把本仓库 `codex/` 放在旁边，或使用方式 A。

## 离线 CLI

```bash
cd codex
node scripts/astro-cli.mjs stats
node scripts/astro-cli.mjs term redshift
node scripts/astro-cli.mjs method --id lomb-scargle
node scripts/astro-cli.mjs statistics --json
node scripts/astro-cli.mjs instrument FAST
node scripts/astro-cli.mjs journal ApJ
node scripts/astro-cli.mjs thesis 北京大学
node scripts/astro-cli.mjs goal refutation
node scripts/astro-cli.mjs recommended 赵永恒
node scripts/astro-cli.mjs plan > research-plan.json
```

输出默认是人类可读文本，加 `--json` 输出结构化数据。

## 八个 skill 怎么用

| 场景 | skill |
|---|---|
| 文献检索、综述、引用链、ADS/SciX/arXiv 检索式 | `astro-literature-research` |
| Python 数据分析、astropy 单位、统计、MCMC、复现 | `astro-code-writing` |
| 英文期刊论文、标题/摘要/引言/图表/返修 | `astro-english-journal-writing` |
| 中文学位论文、学校格式、GB/T 7714、查重/答辩 | `astro-phd-thesis-writing` |
| 选写作目标/叙述风格（发现/反驳/增量/上限等） | `astro-writing-goals` |
| 首次发现、确认、多信使 | `astro-discovery-writing` |
| 批判/反驳、零结果/上限 | `astro-critical-writing` |
| 跟进增量、方法软件、巡天、理论、综述 | `astro-incremental-method-writing` |
| v2 逐节写作/评分/作者确认/格式/工具 | `astro-research-workflow` |

每个 skill 顶部都有一段 **Codex 适配说明**：`astro_*`、`pyenv_*`、`dsh-*` 是 DSH 工具名，在 Codex 中用本地 CLI/系统 Python 代替，禁止伪造工具调用。

## 数据来源与边界

- 方法库只保留通用技术知识与独立 Python 示例，不包含书籍/章节/ISBN 元数据。
- 观测设备：30 个 curated 设施；25 个链接 `verified:true`，5 个（H.E.S.S.、eROSITA DR1、LHAASO、SKA、ELT）标 `verified:false`，以官方页面为准。
- 不抓取付费全文、不绕过数据专有期/登录；不把在建/规划设施当成已运行数据源。
- SCI 收录状态无法精确判定；知网只给人工检索链接。

## 已验证

本机 Codex CLI 0.149.0-alpha.4.3：

```text
codex plugin marketplace add .
# {"marketplaceName":"astro-ph-researcher-local","installedRoot":"...","alreadyAdded":false}

codex plugin add astro-ph-researcher@astro-ph-researcher-local --json
# {"pluginId":"astro-ph-researcher@astro-ph-researcher-local","version":"1.0.0",...}

codex plugin list
# astro-ph-researcher@astro-ph-researcher-local  installed, enabled  3.0.0
```

> 插件清单按 Codex `.codex-plugin/plugin.json` 文档实现；GitHub 上不同 Codex 版本的插件系统可能有差异，安装失败时请附 `codex --version` 和错误信息。

## 许可

MIT。作者：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）。
