# Changelog

## 2.0.0 — 2026-10-22

### Added
- 保留 1.0.1 全部功能（术语/文献/写作/公式/21 格式/8+1 skill）。
- 逐节写作状态机：10 个章节、内容 hash、作者编辑、评分、作者确认台账。
- 文献 6 维启发式评分、章节 6 维启发式评分（可解释、可覆盖）。
- 作者确认：仅客户端按钮；绑定 contentHash/rubricVersion/检查清单；修改后自动失效。
- 物理/天文书目索引与 `astro_physics_reference`。
- 文件格式百科（FITS/PHA/RMF/ARF/Fermi XML/VOTable/ECSV…）与 `astro_file_format`。
- 3ML/AM³/SED/DS9/Geant4 引导、公开源表目录；`astro_research_guide`。
- 9 个 skill（新增 `astro-research-workflow`）。
- **版权清理**：移除数据处理方法库的书名/作者/出版社/ISBN/章节/原书摘要；只保留通用技术知识、公式、独立 Python 示例。
## 1.0.1 — 2026-10-22

### Added
- 术语公式 `formulaLatex`（15 个常用术语）与 `astro_term_save` 的 LaTeX 字段；术语卡也走 KaTeX 渲染 + 复制。
- `/health` 增加 `assets.katex` 自检；KaTeX 静态资源支持 HEAD；加载失败可重试并明确提示回退源码。
- `test/formula-ui.mjs` 与更完整的资源/公式校验。

### Changed
- 版本号 1.0.0 → 1.0.1；公式渲染范围从方法/统计扩展到术语。

## Unreleased — v2.0 planning

### Planned
- 文献 6 维打分（相关性/证据/方法/可复现/发表可信度/时效），可解释、可被作者覆盖。
- 文章各部分独立打分（主张-证据、新颖性、引用、数字一致、可复现、风格匹配）。
- DSH 内逐段人工微调：diff 接受/拒绝、作者改写、锁定、回退。
- 逐节写作状态机：AI 草稿 → 作者编辑 → 检查 → 作者确认 → 锁定。
- 作者确认台账：确认绑定内容 hash、rubric 版本、检查清单；AI 不能代替确认。
- 可审计导出：scores、confirmations、diffs、rubric 版本。
- 物理/天文权威书籍库：Landau 十卷、相对论/黑洞/中子星/致密天体/观测/AGN/粒子物理/辐射转移/恒星物理，以及 GRB/中微子/引力波权威综述；只存书目/章节映射，不存全文；配物理守则检查。
- 分析工作流：3ML time-energy、AM³ 多信使、SSDC SED、DS9 本地 FITS、公开源表导入；文件格式索引（FITS/PHA/RMF/ARF/Fermi XML/VOTable/ECSV…），Fermi XML 明确为模型文件而非事件表。
- 详见 docs/14-v2-路线图.md、docs/15-v2-物理与天文书籍库.md、docs/17-v2-分析工作流与文件格式.md；v1.0.0 不包含这些功能。

## 1.0.0 — 2026-10-22

### Changed
- **正式更名**：`dsh-astro-words` → `astro-ph-researcher`；包名、DSH bundle、客户端 ID、路由、Codex 命名空间、数据目录与文档统一为新名称。
- 版本号 `0.4.0` → `1.0.0`；正式第一版发布基线。
- 本地数据自动迁移：首次启动时把旧 `$DSH_HOME/astro-words` 复制到 `$DSH_HOME/astro-ph-researcher`，保留术语本、文献库、写作项目与格式 workspace。
- 路由统一为 `/api/astro-ph-researcher/*`；工具名保持 `astro_*` 兼容。

### Added
- `SUPPORT.md`、`.github/FUNDING.yml`：自愿打赏入口与微信/支付宝收款码说明（不打赏付费墙、不卖优先支持）。
- GitHub Release 打包：`dist/astro-ph-researcher-1.0.0.zip`、SHA256、发布说明。
- `test/migration.mjs`：旧目录迁移测试。
- LaTeX 公式渲染：本地 KaTeX 0.16.22，方法/统计公式编译显示；每个公式可复制 LaTeX 源码，加载失败回退源码。
- 8 个 Agent Skills、10 个目标感知写作风格、21 个学位论文格式、27 个数据处理方法、30 个观测设施。
- 12 页介绍 PDF/PPTX/HTML 更新为 v1.0.0 与 8 个 skill。

### Fixed
- 旧数据目录、旧插件名与 Codex 旧缓存不再混用；卸载旧 bundle 后安装新 bundle。

## 0.4.0 — 2026-10-22

### Added
- 数据处理方法库：整理《天文数据处理与虚拟天文台》（赵永恒、崔辰州，中国科学技术出版社 2024）的图像处理、统计基础、误差/置信区间、最小二乘/拟合、周期分析、最大似然、贝叶斯/MCMC、机器学习与虚拟天文台方法；27 个方法 + 9 条统计卡片 + 独立 Python 示例。
- 观测设备/数据工作流库：Chandra、Fermi-LAT/GBM、Swift、XMM-Newton、NuSTAR、JWST、HST、Gaia、TESS、ALMA、VLA、IceCube、LIGO/Virgo/KAGRA、H.E.S.S.、FAST、LHAASO、IXPE、CTAO、SKA、Rubin/LSST、ELT、TMT、ngVLA、Athena、LISA、IceCube-Gen2、eXTP 等；区分运行/在建/规划与开放/受限/闭源，附官方数据、软件、工作流与建议。
- 个人工作流：保存设施分析步骤到本地，支持 `astro_data_workflow` list/save/delete。
- 「数据」侧栏标签页：方法/统计/设备/我的工作流四个子页；设备可「交给 DSH 设计/检查流程」。
- 工具：`astro_data_method`、`astro_data_instrument`、`astro_data_workflow`。
- Codex 版：`codex/` 提供 `.codex-plugin/plugin.json`、4 个 skill、只读数据与 `astro-cli.mjs`；已在本机 Codex CLI 0.149.0-alpha.4.3 安装验证。
- GitHub 介绍材料：`presentation/astro-ph-researcher.pdf`（12 页 16:9）、PPTX、HTML、封面图。
- 学位论文格式库扩展到 **21 个单位**：新增广西大学、西南交通大学、山东大学、内蒙古大学、西华师范大学、武汉大学、中科院紫金山天文台/高能物理研究所/上海天文台；中科院三台/所按 UCAS 2024-10 统一格式；18 条已验证，武汉大学/清华/南大因官方页不可访问标 `verified:false`。
- 学位论文格式材料工作流：选择高校/院所后，宿主侧抓取官方页/模板到 `$DSH_HOME/astro-ph-researcher/formats`，DOCX/TXT/ZIP 自动解析，PDF/DOC 标记需 DSH 阅读；支持作者上传格式/模板并解析；写作提示词自动带上文件路径与解析文本。
- 新增 `astro_thesis_format`（status/fetch/upload）与 `/writing/thesis-formats/:id/fetch|upload|workspace` 路由。
- 目标感知写作风格：新增 `data/writing-goals.seed.json`（10 个目标：discovery/confirmation/refutation/incremental/null-limit/method-software/survey-catalog/theory-model/multimessenger/review-perspective）；项目 `goalId` 注入写作提示词。
- 新增 4 个 skill：`astro-writing-goals`、`astro-discovery-writing`、`astro-critical-writing`、`astro-incremental-method-writing`；总计 8 个。
- 新增 `astro_writing_goal` 工具；`astro_writing_handoff` 增加 `audit` 模式（主张-证据表、风格匹配、引用意图、审稿人红队）。

### Changed
- 版本号 0.3.0 → 0.4.0。

## 0.3.0 — 2026-10-22

### Added
- 参考文献库：本地持久化、领域/关键词/专题标签、可引用总结、关键结果、前三位作者/ORCID、单位、期刊卷期页、DOI/SciX/ADS/arXiv。
- 引用：BibTeX / APA / GB 7714-2015 / MLA；复制与 `.bib` 导出。
- 写作工作台：期刊/学位论文项目、目标期刊与高校格式、多文件上传、可选 DSH 分析、分析/大纲/逐字起草/格式检查交接。
- 格式库：天文期刊官网/作者指南/Overleaf 模板、中国高校学位论文格式（年份版本）、自定义格式上传与 JSON 格式包导出/导入。
- 4 个随包 skill：`astro-literature-research`、`astro-code-writing`、`astro-english-journal-writing`、`astro-phd-thesis-writing`。
- 文献检索结果补充卷期页、单位、作者 ORCID、SciX 链接、ADS DOI 检索链接。

### Changed
- HTTP API 前缀迁移到 `/api/astro-ph-researcher-v2`（避开旧实例已占用的 v1 路由）。
- 版本号 0.2.0 → 0.3.0。

## 0.2.0 — 2026-10-22

### Added
- 官方 NADC 全量离线词表：设置页一键下载官方 zip（r241020，约 696 KB），解析 `ec/ce` TSV 为约 31,758 条本地索引；断网/NADC 超时自动兜底。
- 同名词条消歧：`senses` / `alternatives`，UI「同名词条 / 其他译名」可按 `astrodictId` 切换；保存时记录选中 id。
- Host 工具 `astro_dictionary`（status/download）与 `/api/astro-ph-researcher/dictionary/*` 路由。
- `scripts/install-local.mjs`：CLI 路径解析异常时的本地 junction/复制安装脚本。
- 测试：ZIP/TSV 解析、离线兜底、严格优先级、分析转交。

### Changed
- 查词结果新增 `dictionary` 元信息与离线命中标记。
- `astro_term_lookup` 支持 `astrodictId` 参数。
- 版本号 0.1.0 → 0.2.0。

## 0.1.0 — 2026-10-22

### Added
- NADC 查词、审定定义/备注/范例/标签解析、相关术语。
- 文献检索（OpenAlex/Crossref/ADS/arXiv）+ 相关性/时间/引用数综合排序 + 严格优先级。
- 交给 DSH 分析（术语/文献/对话搜索）。
- 本地术语本（JSON 原子写、Markdown/CSV/Anki 导出）。
- 侧边栏入口 + 浮窗 UI + 静态预览。
- 知网人工检索深链（不抓取）。
