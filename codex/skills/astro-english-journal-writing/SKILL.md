---
name: astro-english-journal-writing
description: "投英文天文期刊或修改投稿稿件时加载：从选刊、一句话贡献与字数预算，到标题、摘要、各节写作、图表规范、修订与返修回复的完整 SOP。"
whenToUse: "用户要投英文天文期刊，或要写/改标题、摘要、关键词、Introduction、Data & Methods、Results、Discussion、Conclusions、图注、致谢与引用；也用于把中文草稿改写成可投稿英文、按审稿意见返修。"
metadata:
  domain: astronomy
  language: zh
---

> **Codex 适配说明（与 DSH 版的差异）**
> 本 skill 原文面向 DeepSeek Harness（DSH）。在 Codex CLI 中，`astro_*`、`pyenv_*`、`dsh-*` 等 DSH 工具名不可直接调用；请用本插件自带的 `node scripts/astro-cli.mjs` 查询本地 `data/`，用系统 Python/venv 代替 `pyenv_*`，用仓库文件代替 DSH 侧栏操作。不要伪造工具调用或数据；数据来源、引用边界和写作门禁与原文一致。


# 英文天文期刊论文写作 SOP

## 0. 角色、交付物与硬规则

加载后以两个身份工作：目标期刊的资深审稿人（负责挑毛病）与母语英文编辑（负责改句子）。产出按四份文件组织，不跳步：

1. `outline.md`：一句话贡献、章节字数预算、图表清单、必引文献清单、目标期刊与模板版本。
2. `draft.tex`（或 `draft.md`）：初稿，允许粗糙，但每节必须回答该节的问题。
3. `figures-checklist.md`：每张图的物理目的、数据来源、坐标轴、色盲安全性。
4. `revision-notes.md`：每轮改了什么、为什么改。

硬规则：没有 `outline.md` 不得写正文；摘要最后写；不确定的期刊要求写"待查官网"，不猜、不编造模板名或 URL。

## 1. 语言标准（先锁定一种）

- **变体**：全文只用 US（color, analyze, modeling, center）或 UK（colour, analyse, modelling, centre）。ApJ 系偏 US，MNRAS 偏 UK；模板已定时跟随模板，混用直接退回。
- **时态**：公认物理事实与背景用现在时；他人具体工作用过去时或现在完成时（Smith et al. (2023) reported / have reported）；本文方法与处理用过去时；图表与本文结果用现在时（Figure 3 shows; the sample contains）；结论用现在时。
- **语态**：方法与流程可用被动，但每段至少一句主动；禁止 "we can see that"、"it can be seen that"。
- **Hedging 只留一个**：写"X indicates Y"并给出数值不确定度，不写 "may possibly suggest that it could perhaps"。
- **句法与节奏**：一句话 ≤35 词，一段 ≤6 句，名词堆叠 ≤3 层；每段句长有变化（8–30 词混排）。
- **AI 腔黑名单**：delve, pivotal, underscore, a testament to, in the realm of, it is worth noting that, plays a crucial role, sheds light on, not only … but also, Moreover/Furthermore 连续开头，以及每段收尾的 "Overall, …"。处理方法：删掉该短语后句子仍成立就删，换成一个具体动词。
- **中式英语速查**（左改右）：`due to the fact that` → `because`；`a large number of` → `many`；`in order to` → `to`；`it is well known that` → 直接给事实；`was found to be` → `is`；`the results show that` → `our results show`；`respectively` 只在两个以上列表一一对应时用；`paper` 指期刊论文，`thesis` 指学位论文，不混用。

## 2. 先框架后写作（禁止边写边想）

- **一句话贡献**：`Using [data], we show that [quantity] is [result], which implies [physics].` 写不出这句就不动笔。
- **章节字数预算**（按期刊 word limit 折算并写进 outline）：Introduction 15–20%，Data & Methods 25–30%，Results 30–35%，Discussion 15–25%，Conclusions 3–5%。写作时每节超出预算 ±10% 就停手删。
- **图表先定**：每张图配一句"它证明什么"。配不出这句的图不进正文。
- **引用先定**：列 20–40 篇必引，其中 3–5 篇是目标期刊近三年同主题论文，标清一手文献与综述。

`outline.md` 最小骨架（英文标题、中文备注）：

```
Contribution: Using ..., we show that ..., which implies ...
Target: <journal>, <article type>, <word limit>, template <name@version>
Section budget: Intro 800 / Data & Methods 1200 / Results 1500 / Discussion 900 / Conclusions 200
Figures: Fig 1 -> claim: ...; Fig 2 -> claim: ...
Tables: Table 1 -> ...
References: [must-cite list, one line each]
Gap sentence: ...
```

## 3. 选刊与模板

先读期刊 Aims & Scope 与最近 3 期目录，确认文章类型（Letter / Article / Review）与篇幅上限，再定刊。

| 期刊 | 定位 | 模板与引用（以官网当期指南为准） |
|---|---|---|
| ApJ / ApJL / ApJS | 天体物理主力刊 | AASTeX；作者-年份制 |
| A&A | 欧洲综合刊，方法与长表格友好 | aa 文档类；作者-年份制 |
| MNRAS | 英国综合刊，理论与观测并重 | mnras 类；作者-年份制 |
| RAA | 国内主办英文刊，出版快 | 官网 LaTeX 模板；按当期指南 |
| PRL / PRD | 物理与高能天体，强调普适结论 | REVTeX；数字编号 |
| JHEAP / CPC | Elsevier 系，综述与方法软件 | elsarticle；数字编号 |
| Universe | MDPI 开放获取 | MDPI 模板；数字编号 |
| Nature / Science | 短正文 + Methods + 补充材料，硬字数限制 | 官网模板；数字编号 |

规则：模板文件从期刊官网 Author Guidelines 或 Overleaf Gallery 下载当期版本，把模板名与版本写进 `outline.md`；不凭记忆写 `\documentclass` 或 bibstyle；本 skill 不给直链，避免链接过期或伪造。

选刊决策只看三条：①近三年是否发过同主题、同方法论文（scope 匹配）；②审稿周期与接收率是否可接受；③开放获取费用与预印本政策。三条都过再定刊，不按影响因子倒推期刊。

## 4. 标题

- 结构：`[对象/源] + [信使/波段/设备] + [方法或关键结果]`。例：`IceCube neutrinos from TXS 0506+056: a hadronic origin constrained by multiwavelength data`。
- ≤15 词；能被检索到；不含未定义缩写；冒号后给结论，不写"Towards …"。
- 禁用宽泛开头：A study of / New insights into / An analysis of / Towards understanding。

## 5. 摘要（正文写完后再写）

固定六句：①领域 + 科学问题；②数据/设备 + 信使/波段 + 方法；③创新点（首次/新约束）；④主结果 + 数字 + 不确定度；⑤次要结果（可省）；⑥结论与物理含义。

模板（填空即用）：

> **[Context], yet [quantity] remains poorly constrained at [regime] because [obstacle].** We use [data/instrument] to [method]. This is the first [novelty]. We find [result] ([significance]σ), corresponding to [value ± uncertainty]. We also [secondary result]. These results imply [physics].

约束：无引用、无缩写、不写 "In this paper, we"；≤250 词或以指南为准；所有数字与正文、图、表逐一对齐。

摘要改三遍：第一遍只砍句（每句删 3 词）；第二遍核对每个数字的统计/系统误差与正文是否一致；第三遍朗读，删掉读着卡顿的从句。摘要里的每一项都必须在正文有对应图表。

## 6. 关键词

- 4–8 个，按重要性排序，取自期刊关键词表或 AAS Unified Astronomy Thesaurus 的标准词。
- 必须覆盖四类：子领域（high-energy astrophysics）、信使（neutrinos / gravitational waves / cosmic rays）、设备（IceCube / Fermi-LAT）、方法与源类（neural networks / blazars）。多信使论文要把信使写全。
- 不写 astronomy、physics 这类宽泛词，也不写期刊名。

## 7. Introduction

- 第一段直接给观测事实或数量级，不写历史开场。
- 每句可查：引原始第一文献；综述只用来概括领域；引用他人结论时带上条件与不确定度；再引 1–2 篇近两年的相关工作，说明本文处在哪个前沿位置。
- 末两段固定：gap（`To date, no measurement of X exists at Y.`）+ 本文（`Here we use … to …`）。
- 3–6 段；不提前给结果；不把 Discussion 的内容塞进来。
- **准确与保守**：开篇事实与量级要能回溯到第一性原理或观测；模型依赖和外推的结论写明条件，措辞宁保守勿夸张。

## 8. Data and Methods

- 数据：望远镜/设备、观测时间、波段、数据版本（release 或 DOI）、样本量。
- 筛选：切割条件逐条列，写明每条删掉多少事件、最终剩多少（`N → M`）。
- 公式：给符号、单位、适用条件；符号首次出现必须定义；不在正文引用未编号公式。
- 假设与系统误差：列 3–5 条主要系统误差及量级；无法复现的步骤明确标注。
- 模板：`We select events with [cuts]. This leaves N events, of which M survive [cut]. The effective area is taken from [release], with a systematic uncertainty of [X]%.`

## 9. Results

- 只报告，不解释；解释留给 Discussion。
- 每个数字给不确定度（统计与系统分开）与显著性（σ），并说明显著性如何算。
- **图**：矢量 PDF/EPS；宽度按模板 `\columnwidth`（常见单栏约 88 mm、双栏约 180 mm）；缩到最终尺寸后字号 ≥8 pt；**不要 gridline**、不要 3D、不要 jet/rainbow，用 Okabe-Ito 或 viridis；线宽 ≥1 pt；坐标轴带物理量与单位；图注自含（不看正文也能读懂，给出样本量、波段、误差含义）。
- **表**：期刊风格（多为三线表），单位放表头，有效数字统一，不用截图。
- **导出**：matplotlib 存 PDF 时设 `pdf.fonttype = 42`、`savefig.bbox = 'tight'`，防止图内文字变曲线；光栅图 ≥300 dpi，线图 600 dpi；导出后放大到 200% 检查刻度标签不被裁切。
- **图注模板**：`Fig. 1. [Quantity] as a function of [variable] for [sample], selected by [criteria]. [Colors/lines] show [meaning]; shaded bands give [1σ / systematic] uncertainties. [One sentence on the key feature].` 表注模板：`Table 1. [Contents] for [sample]. [Units in columns; uncertainties are 1σ.]`
- 图号、表号按正文首次出现顺序；Results 里除一句指路（`We discuss this in §5`）外不写 "This suggests …"。

## 10. Discussion

顺序固定：与文献对比（一致 / 张力）→ 物理机制或模型 → 假设与限制 → 可检验预言与未来观测。

- 限制要写全：模型假设、观测环境、选择效应、样本量与系统误差。
- 冲突必须给数值与条件，不写 "some tension"。
- 给替代解释，并说明什么观测能区分。
- 理论叙述可以主动、有画面感，但每个断言附条件或引用。

## 11. Conclusions

- 3–5 条；每条 = 一句结论 + 一句物理含义；不重复摘要原句；最后一句给局限；确定性够的次要结论可写一句，样本量或系统误差撑不住的只写进局限。
- 模板：`We have shown that X. This implies Y, under the assumption Z.`

## 12. 致谢与引用一致性

- 致谢：基金号、望远镜/数据中心（按官方致谢措辞）、软件（名称 + 版本）、作者贡献由通讯作者定；不编造基金号。作者列表、顺序与通讯作者归属由课题组决定，不自行增删。
- 引用三处对齐：正文引用 ⇄ `.bib` ⇄ 参考文献表；连续两次编译无 undefined citation、无重复条目。
- 每条引用至少读过摘要；BibTeX 从 ADS/Crossref 导出后手改作者与年份；预印本标 `arXiv:XXXX.XXXXX`；"et al." 只在 ≥3 作者时用；不引二手、不引未读文献。
- 常见错误：作者-年份制与数字制混用；同一文献两个 key；正文引了但表里没有（或反之）；引 2023 年综述却写成 2020 年原始结果；页码/卷号缺失；DOI 打不开。逐条核 `.blg` 与 PDF 校样。

## 13. 风格学习（不抄袭）

从目标期刊近两年找 3 篇同主题论文，做一张句式表：怎么开篇、怎么引出 gap、怎么报 σ、怎么转入 Discussion。抄结构不抄句子；与原文连续 8 词相同即改写。

## 14. 修订流程（初稿后至少三轮）

- **冷却**：≥24 h 后再读。
- **R1 结构**：把每段第一句连起来读，应成一条逻辑链；删掉不服务 contribution 的段落；核对每节是否回答了自己的问题。
- **R2 删冗**：一段只讲一件事；删重复形容词、very/really/quite、重复两次的结论；连接词多样化（Because / Given / Since / Although / While / As a result），不让每段都以 However/Moreover 开头。
- **R3 语言**：冠词（a/the/零冠词）、介词搭配、单复数、时态、主谓一致；数字与单位（10¹² eV、5σ、3.2 ± 0.1）、百分号与空格、希腊字母斜体；缩写首次定义后统一。
- **AI 味检测**：出现 "plays a vital role / underscores / highlights the importance / in the realm of / it is important to note" 即删或换成具体动词。
- 每轮把改动与理由写进 `revision-notes.md`。

## 15. 返修回复（Response to Referees）

- 开头一段总述：感谢、说明主要改动、给出"改了什么/没改什么"的清单。
- 逐条回复格式：`Referee 1, Comment 3.` → 原意见（可缩写）→ `Response.` → `Change.`（给页码、行号、图号）。每条都必须有明确处置：接受并改、部分接受并解释、不同意并给理由与证据。
- 不做无原则让步：不同意时引数据、引文献或补做分析；补的数据要写进正文或附录，不能只出现在回复信里。
- 同时交 `revised.tex`（改动高亮）与 `clean.tex`；两次编译无 warning；回复信单独一页，编号与审稿意见一一对应。

## 16. 质量门禁（12 条）

1. 一句话贡献成立，全文围绕它。
2. 标题含对象 + 信使/方法 + 结果，≤15 词。
3. 摘要 ≤6 句、含数字与不确定度、无引用。
4. 关键词 4–8 个标准词，多信使写全。
5. 每节字数在预算 ±10% 内。
6. 每句引用可查，引一手文献。
7. Intro 末尾 gap 与贡献明确。
8. 方法可复现：数据版本、切割、系统误差齐全。
9. 每个结果有不确定度与显著性。
10. 图 PDF、色盲友好、无 grid、字号 ≥8 pt、图注自含。
11. 正文、图、表、引用四处数字一致。
12. 通读无 AI 套话、无时态与冠词错误。

## 17. 工具映射与执行顺序

- **现有工具**：`astro_literature_search` 找目标期刊同主题范文与必引文献；`astro_literature_analyze` 拆解范文结构；`astro_term_lookup` 把中文概念核成英文术语与 NADC 译名；`astro_term_save` 存定稿术语；`astro_dictionary` 断网兜底。
- **参考文献工具**：`astro_reference_save/list/update/cite/export`（BibTeX/APA/GB 7714/MLA + `.bib`）；先存后引，不手写条目。
- **写作工作台**：`astro_writing_project`（建项目/上传研究结果/绑定期刊或学校格式）、`astro_writing_handoff`（analyze/outline/draft/format）、`astro_format_library`（期刊官网、作者指南、Overleaf 模板）。工具不可用时按 §14 手动执行，并说明降级。
- **顺序**：定范围与目标刊 → `outline.md` → 正文 → 图表 → 三轮修订 → 门禁 → 投稿信（3 段：问题、结果、为何适合该刊）。
