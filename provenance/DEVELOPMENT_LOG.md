# 开发日志与日期

> 作者/所有者：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）
> 记录日期：2026-10-22（Asia/Shanghai）
> 会话：`session-418e083a-2170-4aea-a8a8-22c7bdc22945`
> 说明：本日志只记录**可核对的日期、版本、产物与测试**；不复制内部推理。完整原始会话见 `provenance/raw/`。

## 1. 时间线

| 日期时间（CST） | 事件 | 证据 |
|---|---|---|
| 2026-10-22 00:34:14 | 本次 DSH 会话创建 | 会话 JSONL `session` 行 createdAt |
| 2026-10-22 00:47:09 | 用户提出插件总体目标与第一步要求 | [`transcript.md`](transcript.md) 用户消息 1 |
| 2026-10-22 01:12:52 | 第一版插件（术语/文献/侧栏/分析交接）交付 | 第 1 轮最终回复；`lib/index.js`, `lib/client.js` |
| 2026-10-22 01:15:30 | 用户要求「先做 B 再做 A」 | [`transcript.md`](transcript.md) 用户消息 2 |
| 2026-10-22 01:31:14 | v0.2.0：NADC 离线词表 + 同名词条消歧 + 安装 | 第 2 轮最终回复；`lib/dictionary.js`, `lib/astrodict.js` |
| 2026-10-22 02:37:58 | 用户要求参考文献库与写作工作台 | [`transcript.md`](transcript.md) 用户消息 3 |
| 2026-10-22 03:02:35 | v0.3.0：参考文献库 + 写作工作台 + 4 个 skill | 第 3 轮最终回复；`lib/references.js`, `lib/writing.js`, `skills/` |
| 2026-10-22 03:02:35 | 用户要求书籍方法库 + 观测设备/数据工作流 | [`transcript.md`](transcript.md) 用户消息 4 |
| 2026-10-22 03:26:07 | v1.0.0：书方法/统计 + 30 个观测设施 + 数据页 | 第 4 轮最终回复；`lib/data-library.js`, `data/data-methods.seed.json`, `data/instruments.seed.json` |
| 2026-10-22 03:26:07 | 用户要求复盘 retry/完成度/遗漏 | [`transcript.md`](transcript.md) 用户消息 5 |
| 2026-10-22 03:28:20 | 交付审计与已知缺口 | 第 5 轮最终回复；[`docs/10-交付审计与已知缺口.md`](../docs/10-交付审计与已知缺口.md) |
| 2026-10-22 03:28:20 | 用户要求保存对话日志与日期、署名信息 | [`transcript.md`](transcript.md) 用户消息 6 |
| 2026-10-22 03:39–03:45 | 复跑全部测试、在线 API 复核、生成 provenance | [`PROVENANCE.md`](PROVENANCE.md), `MANIFEST.sha256` |
| 2026-10-22 03:45–04:00 | 制作 GitHub 介绍 PDF/PPTX/HTML；新增 Codex 插件并用 Codex CLI 0.149.0-alpha.4.3 安装验证 | [`presentation/README.md`](../presentation/README.md)、[`codex/README.md`](../codex/README.md) |
| 2026-10-22 04:00–04:10 | 学位论文格式库扩到 21 个单位（18 verified / 3 false）；同步 Codex 数据、PPT 第 6 页与发布指南 | [`data/thesis-formats.seed.json`](../data/thesis-formats.seed.json)、[`docs/11-发布指南.md`](../docs/11-发布指南.md) |
| 2026-10-22 04:10–04:20 | 新增本地格式材料工作流：选择学校后抓取官方页/模板、DOCX/TXT/ZIP 解析、PDF/DOC 交 DSH、作者上传解析 | [`lib/thesis-fetcher.js`](../lib/thesis-fetcher.js)、[`docs/05`](../docs/05-第三步-写作工作台.md)、[`test/thesis-fetcher.mjs`](../test/thesis-fetcher.mjs) |
| 2026-10-22 04:20–04:30 | 新增 10 个目标感知写作风格、4 个风格 skill、goalId 注入、投稿前 audit、8 个 skill 与 Codex 同步 | [`data/writing-goals.seed.json`](../data/writing-goals.seed.json)、[`docs/12`](../docs/12-写作目标与风格.md)、[`skills/astro-writing-goals`](../skills/astro-writing-goals/SKILL.md) |

> 当前这一轮（保存 provenance）还在进行时生成的文本不会出现在 transcript 的“已完成轮次”里；原始 JSONL 会继续追加。

## 2. 版本证据

| 项目 | 值 | 核对方式 |
|---|---|---|
| npm 包名 | `astro-ph-researcher` | `package.json` |
| 版本 | 1.0.0 | `package.json`、在线 `/health` |
| Host 工具数 | 17 个 `astro_*` 工具 | `test/host-smoke.mjs`、在线工具目录 |
| Client slot | `sidebar.footer.action` active | Cordis Inspect |
| 词典 | r241020，31,758 条离线索引 | 在线 `/health`、设置页 |
| 方法库 | 27 方法 + 9 统计 | `/data/meta` |
| 设备库 | 30 设施 | `/data/meta` |
| 期刊/高校格式 | 14 / 12 | `/writing/meta` |
| Skill | 4 个 | 在线 `/skills`、`skills/` |

## 3. 测试记录

2026-10-22 03:39 CST 复跑：

```text
smoke 11/11
dictionary 3/3
references 4/4
writing 4/4
skills 4 bundles
data-library 27 methods / 30 instruments
host-smoke ok
client-smoke ok
```

在线 API：`/api/astro-ph-researcher/health`、`/skills`、`/references`、`/writing/meta`、`/data/meta` 均 200。

端到端：

- 文献库保存 → GB 7714 引用 → 删除；
- 写作项目创建 → 上传 CSV → 删除；
- 数据工作流保存 → 列表 → 删除；
- `astro_data_method(id="lomb-scargle")` 与 `astro_data_instrument(id="fast")` 返回内容。

## 4. 产物清单（本次署名版本）

- 插件代码：`lib/`（host + client + 术语/文献/文献库/写作/数据方法）
- 数据：`data/`（术语、期刊、高校格式、方法、设备）
- Skill：`skills/`（4 个）
- 文档：`docs/01`–`docs/10`
- 对话与证明：`provenance/`

## 5. 声明

我（天外奇航）确认：本项目的目标、优先级与验收由我提出；插件、数据和 4 个 skill 在当前 DSH 会话中生成、整理和测试。AI 助手与子智能体是执行工具，不是版权主体。第三方书籍、期刊、设施页面与软件的知识产权归各自权利人；本项目只做方法摘要、链接与独立代码示例。

> 这份日志能证明“该工作在这个本地会话中、这些日期发生”，不能替代法律公证、版权登记或现实身份认证。若要更强证明，见 [`PROVENANCE.md`](PROVENANCE.md) 的“如何加强”一节。
