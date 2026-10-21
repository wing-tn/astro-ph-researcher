---
name: astro-literature-research
description: "为天文研究建立可核验的文献证据链：术语定名、检索式设计、原始文献追溯、精读笔记与引用输出。"
whenToUse: "当用户要检索或综述天文文献、核对某结论的原始出处、为论文引言或组会准备参考文献、区分预印本与正式版、查证中英文术语，或编写 ADS/SciX/arXiv/CNKI 检索式时加载。"
metadata:
  domain: astronomy
  language: zh
---

> **Codex 适配说明（与 DSH 版的差异）**
> 本 skill 原文面向 DeepSeek Harness（DSH）。在 Codex CLI 中，`astro_*`、`pyenv_*`、`dsh-*` 等 DSH 工具名不可直接调用；请用本插件自带的 `node scripts/astro-cli.mjs` 查询本地 `data/`，用系统 Python/venv 代替 `pyenv_*`，用仓库文件代替 DSH 侧栏操作。不要伪造工具调用或数据；数据来源、引用边界和写作门禁与原文一致。


# 天文文献研究执行规范

本规范把“查文献”拆成可复核的步骤。产出的每一项结论都必须落回一个可点击来源；落不回去的，标为“未验证”。

## 一、目标与角色适配

目标是**证据链**，不是一串链接：问题 → 检索式 → 原始文献 → 原文结论 → 引用位置。先确定交付类型（检索报告、单篇精读、领域综述地图、引用建议），再决定检索深度。

角色适配只改变解释深度，不降低核验标准：

| 角色 | 默认深度 | 额外要求 |
|---|---|---|
| 本科生 | 概念、样本、结论 | 给出教科书衔接与术语英文全称 |
| 研究生 | 方法、数据、公式、局限 | 指出可复现缺口与下一步检索 |
| 研究员 | 证据等级、系统误差、争议 | 给出反例文献与引用速度 |
| 教授/审稿 | 领域脉络、未解决问题 | 明确证据缺口，不替作者下结论 |

## 二、六步工作流

1. **问题拆解**：按“源（星系/恒星/活动星系核 AGN/系外行星/太阳物理）、信使（电磁/引力波/中微子/宇宙线）、波段、方法（测光/光谱/干涉/巡天/模拟）、理论”拆成 3–6 个检索维度。
2. **术语定名**：用 `astro_term_lookup` 核验 NADC（国家天文台天文学名词库）审定中文名、词条 id 与链接；同义词、缩写并列记录；中文检索词必须能回译成英文再检。
3. **多源检索**：先综述后原始论文；至少两个来源交叉；每条结果记录来源、排序、过滤条件、检索时间。
4. **去重分级**：按 DOI > arXiv ID > 标题+年份去重；标注预印本/正式版/勘误；给出证据等级。
5. **精读笔记**：按第六节模板填写；引用句必须来自全文并带页码或章节。
6. **入库存证**：用 `astro_reference_save` 保存已核验文献，再用 `astro_reference_cite` 生成引用；中文解释 + 英文原词，不手写条目。

## 三、检索源与分工

| 来源 | 适用 | 限制 |
|---|---|---|
| SciX (scixplorer.org) | 天文/行星科学主检索，字段语法与 ADS 一致 | 网页结果随数据库更新 |
| NASA ADS (ui.adsabs.harvard.edu) | 引用网络、bibcode、正式版核对 | API 需 token；网页无需 |
| arXiv astro-ph | 最新预印本、astro-ph.CO/GA/HE/SR/EP/IM | 无引用数；须查正式版 |
| OpenAlex / Crossref | 元数据、DOI、摘要、引用数 | 引用数口径不同；摘要字段不保证存在 |
| 期刊官网（ApJ/A&A/RAA/MNRAS/AJ/PASP/PRL/PRD/JHEAP/CPC/Universe/Nature/Science） | 确认正式版 DOI、卷期页、作者指南 | 全文可能付费 |
| CNKI 学位论文 | 中文博硕论文题录 | 无公开 API；只给人工链接，不爬取、不绕过登录 |

CNKI 只提供人工入口：`https://search.cnki.com.cn/Search/Result?content=<关键词>`。`kns.cnki.net` 会触发滑块验证，禁止程序化抓取。需要 API 时，SciX API 是 ADS API 的分支，鉴权与字段以 ADS API 文档为准。

## 四、检索式设计

- 先英文后中文：英文标准名来自 NADC 或领域惯用名；中文名不直接当英文检索词。
- 布尔与短语：默认 AND；`OR`、`NOT`、`-` 排除；短语加引号；`NEAR5` 做邻近检索。
- ADS/SciX 字段示例：
  - `abs:"gravitational lensing" AND year:2015-2025`
  - `author:"^Smith, J"`（第一作者）、`author:"Smith, J"`
  - `bibstem:ApJ`、`property:refereed`、`property:openaccess`
  - `doctype:article`、`doctype:phdthesis`
  - `arxiv_class:"Astrophysics of Galaxies"`、`arXiv:1108.0669`、`object:M31`、`aff:"Purple Mountain Observatory"`
  - `citation_count:[100 TO 1000]`、`pubdate:[2020-01 TO 2025-12]`
- 可直接构造检索链接：SciX 用 `https://scixplorer.org/search?q=<encoded>&sort=date+desc`；ADS 用 `https://ui.adsabs.harvard.edu/#search/q=<encoded>`。
- arXiv 用 `search_query`：`all:"gravitational lensing"`、`cat:astro-ph.CO AND abs:redshift`；排序 `sortBy=relevance` 或 `submittedDate`；遵守每 3 秒 1 次请求。
- 排序纪律：默认“相关性 → 时间 → 引用数”；综述优先；用“引用数 ÷ 论文年龄”衡量引用速度，但不以总引用数替代相关性；跨库不比较绝对引用数。
- 每次检索保留快照：检索式、来源、排序、过滤、结果数、检索时间。

## 五、去重、版本与证据分级

- 去重键优先级：小写 DOI > arXiv ID > 规范化标题 + 年份。
- 同一工作有预印本与正式版时，引用正式版并记录 DOI；只有预印本时明确写“preprint，未经同行评议”。
- 注意勘误（erratum）、撤稿与版本更新；ADS/SciX 记录中的关联条目要核对。
- 证据等级（本规范约定）：A = 同行评议原始研究/官方数据发布；B = 会议论文、预印本、综述中的转述；C = 科普、二手转述、未核验。最终结论优先用 A；只能依赖 B/C 时，必须标注等级、来源与限制。
- 引用数必须带来源与日期（如“OpenAlex，2026-10-22”），不同数据库不混用。

## 六、精读笔记模板

```text
题录：作者（前三位 + et al.）/ 年份 / 期刊卷页 / DOI
研究问题：
数据、样本、仪器、波段：
方法/公式（符号、单位、适用条件）：
主要结果（数值 + 不确定度 + 置信水平）：
局限与系统误差：
可复现性（数据、代码、软件版本、随机种子）：
与教科书/综述是否一致：
可引用句（页码/章节 + 原文）：
原文陈述 / 作者推断 / 我的推断：
证据等级：
```

“原文陈述”只写论文明确写出的内容；“作者推断”标作者措辞；“我的推断”必须与前两者分开。只有摘要时，所有结论标注“仅摘要”。

## 七、文献库字段

每条文献用 `astro_reference_save` 存入本地库，字段至少包括：

- 前三位作者：`authorsDetailed` 中的姓名、ORCID、affiliations；元数据没有就留空，不推断；
- 单位：`affiliations`（作者级或文献级）；
- 期刊卷期页：`journal` / `volume` / `issue` / `pages`；
- 链接：DOI、SciX、ADS、arXiv（`doi` / `scixUrl` / `adsUrl` / `arxivUrl` 或 `links`）；
- 内容：`abstract`、中文总结 `summary`、关键结果 `keyResults`；
- 标签：领域 `fields`、关键词 `keywords`、专题 `collections`；
- 引用：由 `astro_reference_cite` 生成，不手写条目。

同一 DOI 会自动去重并合并标签；缺失字段留空，不得补造。保存前用 `astro_reference_list` 查重。

## 八、输出格式

- **检索报告**：科学问题、检索式表（含来源与时间）、结果分层（综述/关键原始论文/最新进展/争议）、证据缺口、下一步检索词。
- **单篇精读**：第六节模板 + 3 条可用结论 + 与用户课题的关系 + 可复现性判断。
- **领域综述地图**：按时间线、方法分支或争议点组织；标出代表文献、引用速度和未解决问题。
- **引用建议**：逐句给出“该句 → 文献 DOI → 支撑强度”；一条引用只支撑它真正支持的内容。引用格式用 `astro_reference_cite(id, style="bibtex"|"apa"|"gb7714"|"mla")`；批量交付用 `astro_reference_export(ids)`。
- 中文解释 + 英文原词；缩写首次出现给全称（如 active galactic nucleus, AGN）。

## 九、工具映射

| 工具 | 用途 | 注意 |
|---|---|---|
| `astro_term_lookup` | NADC 审定译名、定义、词条链接 | DSH 释义不是名词委原文 |
| `astro_term_save` / `astro_term_list` | 保存与复用已核验术语 | 保留 NADC id |
| `astro_dictionary` | 官方离线词表状态/下载 | 断网兜底；遵守 NADC 许可 |
| `astro_literature_search` | 多源检索、排序、过滤 | 记录 `sourceUsed` 与检索时间 |
| `astro_literature_analyze` | 按题录+摘要生成结构化分析 | 不读付费全文，缺失就写“摘要未提供” |
| `astro_reference_save` | 保存已核验文献；DOI 自动去重 | 作者/单位/卷页/链接/总结/标签一并入库 |
| `astro_reference_list` | 按领域、关键词、专题查重与复用 | 保存前先查重 |
| `astro_reference_update` | 修正总结、标签、笔记 | 不覆盖原始摘要与作者信息 |
| `astro_reference_cite` | 生成 BibTeX/APA/GB 7714/MLA | 先入库再引用，不手写 |
| `astro_reference_export` | 导出整库或选中条目的 BibTeX | 可直接导入 Overleaf/Zotero |
| `astro_format_library` | 查目标期刊/高校格式与引用风格 | 具体图表要求仍以官网作者指南为准 |
| `session_search` | 找回本会话此前的讨论 | 引用前重新核对来源 |

## 十、禁止事项

1. 编造 DOI、ADS bibcode、arXiv ID、作者、卷页或引用数。
2. 把摘要没写的结论说成论文结论。
3. 把预印本当同行评议，或把会议摘要当完整论文。
4. 把 CNKI 搜索页/摘要当全文，或抓取 CNKI、绕过登录与付费墙。
5. 引用与论点不匹配的文献，或只读综述、不核对原始文献就下结论。
6. 隐去样本量、不确定度、选择效应（如 Malmquist 偏差）。
7. 混用不同数据库的引用数，或不标日期。
8. 用“最新研究认为”这类无来源断言代替证据。

## 十一、质量检查清单

- [ ] 每条结论有可打开的 DOI/ADS/SciX/arXiv 链接
- [ ] 中文术语经 NADC 核验并记录词条 id
- [ ] 检索式、来源、排序、过滤、时间可复现
- [ ] 预印本与正式版已去重并标注版本状态
- [ ] 引用的是原始文献，或已声明转引并给出原始 DOI
- [ ] 数值带单位、不确定度与置信水平
- [ ] 原文/作者推断/我的推断已分开
- [ ] 摘要级与全文级证据已标注
- [ ] 引用格式符合目标期刊或学校要求
- [ ] 没有无法核验或编造的条目

## 十二、模板句式

- 检索报告开头：“本报告检索于 {日期}，来源 {来源}，检索式 `{query}`，排序 {相关性/时间/引用}；初检 {N} 条，去重后 {M} 条，纳入 {K} 条。”
- 证据不足：“目前仅获得摘要/预印本，未核对同行评议全文；以下结论仅基于摘要，不能作为最终依据。”
- 引用建议：“该句建议引用 {Author et al. year, journal, DOI}；原始结论见第 {x} 节 / 第 {p} 页。”
- 转引声明：“该结论转引自 {综述}，原始文献为 {DOI}，原始文献全文尚未核对。”
