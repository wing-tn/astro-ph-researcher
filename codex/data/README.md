# 天文术语种子数据（NADC 审定译名 + DSH 释义）

> 注：官方全量词表（r241020，约 3 万条）**不放在本目录**。插件在设置页由用户主动从 NADC 官方 zip 下载并解析到 `%USERPROFILE%\.dsh\astro-ph-researcher\astrodict-dictionary.json`；本目录只保留 29 条精选种子，避免违反“不得修改内容或与其他词库整合后二次发布”的许可。

本目录包含术语种子、期刊格式库、高校学位论文格式库和这份说明：

| 文件 | 说明 |
| --- | --- |
| `terms.seed.json` | 29 条天文术语的种子词表，UTF-8，结构为 `{ version, generatedAt, source, terms }`（`lib/seed.js` 同时接受数组与 `{ terms }` 两种结构） |
| `journals.seed.json` | 14 个天文/物理期刊的官网、作者指南、Overleaf 模板、引用风格；`verified` 标注是否实测通过 |
| `thesis-formats.seed.json` | 21 个高校/中科院院所学位论文格式（年份版本/规范链接/GB 7714；18 条已验证） |
| `data-methods.seed.json`（含 `formulaLatex`） | 通用方法/统计/Python 示例（34+9 条）；版权安全版，无书籍/章节元数据 |
| `writing-goals.seed.json` | 10 个写作目标/叙述风格（发现/确认/反驳/增量/上限/方法/巡天/理论/多信使/综述），含证据门槛、标题/摘要动作、期刊匹配与示例 DOI |
| `instruments.seed.json` | 全球主要望远镜/卫星/地面探测器/引力波/中微子设施的数据、官方分析软件、工作流与开放/受限状态 |
| `README.md` | 本说明：术语种子来源、逐条核验记录、字段语义与已知限制；期刊/高校格式另见 `research/` |

词表覆盖恒星（9）、星系（4）、宇宙学（7）、太阳物理（3）、系外行星（2）、天体测量（3）、星际介质（1），满足“恒星 / 星系 / 宇宙学 / 系外行星 / 太阳物理”五个方向的覆盖要求。难度分布：基础 20、进阶 7、前沿 2。

## 1. 数据来源与核验（2026-10-22）

审定译名、台湾名、缩写、出版状态、依据书目、最后修订日期，以及定义、备注、范例、标签均来自 **国家天文台 · 天文学名词（NADC）**：

- 检索页：`https://nadc.china-vo.org/astrodict/fuzzy?word=<英文检索词>`
- 详情页：`https://nadc.china-vo.org/astrodict/termdetails?id=<词条ID>`

核验流程（29 条全部逐条真实联网，无一条凭记忆或编造）：

1. 用 `fuzzy?word=<英文>` 抓取结果表，在“外文名”列中按分号拆出英文变体，与检索词做精确匹配，取到真实词条 ID；
2. 打开对应 `termdetails?id=<ID>` 详情页，逐字核对中文名、台湾名、缩写、状态、依据书目与“最后修订”日期，并另行抓取“定义 / 备注 / 范例 / 标签”分节（见第 4 节）；
3. 再次用检索页复核“检索词 → ID → 中文名”的对应关系，结果记录于下表（29/29 通过，0 条失败）；
4. 释义、公式、单位、常见误解等**不是** NADC 文本，由插件作者根据天体物理常识另行撰写（见第 5 节）。

| # | key | NADC ID | 审定中文名 | 台湾名（原文） | 状态 | 最后修订 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | redshift | 16171 | 红移 | 紅移 | 已出版 | 2010-04-15 |
| 2 | parallax | 14324 | 视差 | 視差 | 已出版 | 2010-04-15 |
| 3 | accretion disk | 4648 | 吸积盘 | 吸積盤 | 已出版 | 2010-04-15 |
| 4 | luminosity | 12175 | 光度 | 光度 | 已出版 | 2010-04-15 |
| 5 | metallicity | 12838 | 金属度 | （无） | 已出版 | 2013-02-01 |
| 6 | elliptical galaxy | 8707 | 椭圆星系 | 橢圓星系 | 已出版 | 2010-04-15 |
| 7 | gravitational lensing | 10224 | 引力透镜效应 | 重力透鏡效應 | 已出版 | 2010-04-15 |
| 8 | spectral line | 17530 | 谱线 | 譜線 | 已出版 | 2010-04-15 |
| 9 | star formation rate | 17817 | 产星率 | 恆星形成率 | 已出版 | 2024-10-18 |
| 10 | active galactic nucleus | 4707 | 活动星系核 | 活躍星系核 | 已出版 | 2010-04-15 |
| 11 | cosmic microwave background | 7297 | 宇宙微波背景 | （无） | 已出版 | 2010-04-15 |
| 12 | photometric redshift | 14798 | 测光红移 | 測光紅移 | 已出版 | 2010-04-15 |
| 13 | proper motion | 15469 | 自行 | 自行 | 已出版 | 2010-04-15 |
| 14 | absolute magnitude | 4561 | 绝对星等 | 絕對星等 | 已出版 | 2010-04-15 |
| 15 | Hertzsprung-Russell diagram | 1849 | 赫罗图 | 赫羅圖; HR圖 | 已出版 | 2015-04-15 |
| 16 | radial velocity | 15757 | 径向速度 | 徑向速度 | 已出版 | 2010-04-15 |
| 17 | interstellar medium | 11391 | 星际介质 | 星際介質; 星際物質 | 已出版 | 2010-04-15 |
| 18 | dark matter | 7612 | 暗物质 | [黑]暗物質; 暗質 | 已出版 | 2010-04-15 |
| 19 | dark energy | 7605 | 暗能量 | 暗能[量] | 已出版 | 2010-04-15 |
| 20 | black hole | 5940 | 黑洞 | 黑洞 | 已出版 | 2010-04-15 |
| 21 | neutron star | 13512 | 中子星 | 中子星 | 已出版 | 2010-04-15 |
| 22 | white dwarf | 19680 | 白矮星 | 白矮星 | 已出版 | 2010-04-15 |
| 23 | supernova | 18266 | 超新星 | 超新星 | 已出版 | 2010-06-08 |
| 24 | exoplanet | 9206 | 系外行星 | [太陽]系外行星 | 已出版 | 2015-10-23 |
| 25 | transit | 18912 | 凌 | 凌 | 已出版 | 2010-04-15 |
| 26 | gravitational wave | 10238 | 引力波 | 重力波 | 已出版 | 2010-04-15 |
| 27 | solar wind | 17318 | 太阳风 | 太陽風 | 已出版 | 2010-04-15 |
| 28 | flare | 9509 | 耀斑 | 閃焰; 耀斑 | 已出版 | 2010-04-15 |
| 29 | coronal mass ejection | 7212 | 日冕物质抛射 | 日冕巨量噴發 | 已出版 | 2010-04-15 |

**NADC 未找到项：0 条。** 29 条均有 NADC 审定词条；`star formation rate` 是唯一需要变体检索的条目——NADC 收录的英文写法为连字符形式 `star-formation rate`（ID 17817），按空格写法直接在 NADC 检索不到结果，因此 `en` 采用 NADC 原文，`aliases` 中保留无连字符写法。

## 2. 字段语义

每个 term 对象包含以下字段：

| 字段 | 来源 | 说明 |
| --- | --- | --- |
| `key` | DSH | 词表键，与任务清单一致，用于稳定引用 |
| `en` | NADC | 英文名。若 NADC 词条列出多个英文名，取与 `key` 对应的主名；其余变体放入 `aliases` |
| `zh` | **NADC（逐字）** | 中文名。NADC 给出分号并列多译名时按规则取第一个，其余放入 `aliases` |
| `zhTW` | **NADC（逐字）** | 台湾名，原样保留 NADC 写法（含 `[黑]暗物質` 这类方括号可选字标记与分号并列项）；NADC 无台湾名时为空字符串 |
| `abbr` | **NADC（逐字）** | NADC 缩写；无缩写时为空字符串 |
| `aliases` | DSH 整理 | 检索别名：NADC 同词条的其他中文译名、常见英文变体、常用简称。不是 NADC 的独立词条 |
| `astrodictId` / `astrodictUrl` | NADC | 真实词条 ID 与详情页链接，逐条核验 |
| `status` | **NADC（逐字）** | 出版状态，本表全部为“已出版” |
| `sources` | **NADC（逐字）** | 依据书目，按详情页“依据”顺序原样保留 |
| `lastRevised` | **NADC（逐字）** | 最后修订日期（YYYY-MM-DD） |
| `definition` | **NADC（逐字）** | 详情页“定义”栏原文，去 HTML 标签、解实体、压缩空白；保留编号与标点；无定义时为空字符串（见第 4 节） |
| `definitionSource` | DSH 标注 | 有定义时固定为 `NADC《天文学名词（定义版）》`，无定义时为空字符串 |
| `examples` | **NADC（逐字）** | 详情页“范例”栏原文数组，通常 0–1 条；无则为 `[]` |
| `notes` | **NADC（逐字）** | 详情页“备注”栏原文；无则为空字符串 |
| `nadcTags` | **NADC（逐字）** | 详情页“标签”栏链接文字数组（如 `["天体力学"]`）；无则为 `[]` |
| `field` | DSH | 领域分类：宇宙学 / 星系 / 恒星 / 太阳物理 / 系外行星 / 天体测量 / 星际介质 |
| `level` | DSH | 难度：基础 / 进阶 / 前沿 |
| `explanation` | **DSH 撰写** | 2–4 句中文释义：物理定义 + 关键机制 + 观测意义；与 NADC 的 `definition` 是两套文本，不可互相替代 |
| `formula` | DSH | 确定无误的标准公式（Unicode 纯文本）；不确定或没有代表性公式时留空 |
| `units` | DSH | 量纲 / 常用单位；不适用时留空 |
| `misconceptions` | DSH | 1–2 条常见误解 |
| `related` | DSH | 2–4 个相关中文术语，尽量使用 NADC 收录词（本表所填均可在 NADC 检索到） |
| `literatureQuery` | DSH | 英文文献检索式（3–8 词），用于插件生成 OpenAlex 检索 |
| `literatureQueryZh` | DSH | 中文检索式 |

## 3. 特殊处理与已知限制

- **中文名取首个译名**：`产星率; 恒星形成率` → `zh` 取“产星率”，“恒星形成率”入 `aliases`；`星际介质; 星际物质` → `zh` 取“星际介质”，“星际物质”入 `aliases`。这是任务规定的“分号多译名取第一个”规则，不是对 NADC 文本的改写。
- **radial velocity 有两个已出版词条**：NADC 同时收录 `15757 radial velocity → 径向速度` 与 `15758 radial velocity; line-of-sight velocity → 视向速度`。本表按“英文名精确且无分号”取 15757，把“视向速度 / line-of-sight velocity”放入 `aliases`；引用时请注明取的是 15757。
- **flare 有两个已出版词条**：`9508 flare → 耀发`（定义涵盖太阳耀斑和恒星耀斑）与 `9509 flare → 耀斑`（太阳大气局部增亮）。本表按太阳物理语境取 9509；“太阳耀斑”入 `aliases`。
- **transit**：NADC `18912 transit → 凌`，定义含内行星凌日与卫星凌母行星；为便于系外行星语境检索，`aliases` 增加常用词“凌星”。
- **exoplanet**：NADC 英文主名为 `extrasolar planet`（词条内并列 exoplanet、exotic planet），中文“系外行星”；`en` 采用任务键的常见写法 `exoplanet`，`extrasolar planet` 入 `aliases`。
- **star formation rate**：NADC 英文为 `star-formation rate`（17817），`en` 按 NADC 原文写连字符形式，`aliases` 包含无连字符写法，检索两种输入都能命中。
- **cosmic microwave background**：NADC 中文为“宇宙微波背景”（不是“宇宙微波背景辐射”），`zh` 严格取 NADC；“宇宙微波背景辐射”仅作为 `aliases`。
- **metallicity**：NADC 审定为“金属度”；“金属丰度”是常见别名，仅入 `aliases`。
- **台湾名缺失**：`metallicity`、`cosmic microwave background` 的 NADC 详情页没有台湾名，`zhTW` 按规范留空字符串，不臆造。
- **依据书目**：全部 29 条都抓到了至少 2 条依据；不同词条的修订批次不同（2010、2013、2015、2024 等），以详情页原值为准。
- **释义与公式**：`explanation`、`formula`、`units`、`misconceptions` 均非 NADC 原文，由插件作者撰写；`definition` 则是 NADC “定义”栏的逐字原文（见第 4 节），没有定义的词条保持空字符串，**不用 DSH 释义顶替**。公式只采用标准、确定的关系（如 z 的定义式、M = m − 5log10(d/10 pc)、L = 4πR²σT⁴），不确定处留空。物理内容按教学语境简化，不构成审定文本。

## 4. NADC 定义 / 备注 / 范例 / 标签（2026-10-22 复抓）

29 条在原有字段之外新增 `definition`、`definitionSource`、`examples`、`notes`、`nadcTags` 五个字段，**原有字段值未做任何改动**。本轮重新抓取 29 个 `termdetails?id=<ID>` 详情页，逐条定位 `titleLine` 分节，按“去标签 → 解 HTML 实体 → 压缩空白”处理；定义保留编号与标点，不做改写、翻译或摘要。

- **有定义：21 条** —— `definition` 为 NADC 原文，`definitionSource` 填 `NADC《天文学名词（定义版）》`。
- **无定义：8 条** —— 详情页没有“定义”栏，`definition` / `definitionSource` 均为空字符串，未臆造、未用 DSH 释义填充。

无定义词条清单（8 条）：

| key | NADC ID | 中文名 |
| --- | --- | --- |
| gravitational lensing | 10224 | 引力透镜效应 |
| spectral line | 17530 | 谱线 |
| star formation rate | 17817 | 产星率 |
| cosmic microwave background | 7297 | 宇宙微波背景 |
| photometric redshift | 14798 | 测光红移 |
| radial velocity | 15757 | 径向速度 |
| dark energy | 7605 | 暗能量 |
| exoplanet | 9206 | 系外行星 |

其他分节字段（同样为 NADC 原文照录）：

- **备注 `notes`：3 条** —— black hole（5940，说明性网址）、supernova（18266，`复数：supernovae`）、exoplanet（9206，`不加[太阳]，恐有断句歧义`）；其余 26 条为空字符串。
- **范例 `examples`：1 条** —— black hole（5940，1964 年《Science News Letter》的英文例句；HTML 实体 `&#39;` 已解码为半角单引号 `'`）；其余 28 条为空数组。
- **标签 `nadcTags`：3 条** —— luminosity（12175，`["天文学概论"]`）、absolute magnitude（4561，`["天文学概论"]`）、transit（18912，`["天体力学"]`）；其余 26 条为空数组。

### 抽查对照（`definition` 与详情页逐字对照）

| NADC ID | key | `definition` 原文 | 对照结果 |
| --- | --- | --- | --- |
| 16171 | redshift | `(1)天体谱线的观测波长向长波方向频移的现象。(2)该现象引起的谱线波长的相对改变量。` | 逐字一致（保留 `(1)`/`(2)` 编号与句末标点） |
| 5940 | black hole | `由一个只允许外部物质和辐射进入而不允许物质和辐射从中逃离的边界即视界(event horizon)所规定的时空区域。` | 逐字一致（含括号内英文原名与全角句号） |
| 18912 | transit | `(1) 内行星的圆面投影在日面上的现象。(2) 卫星的圆面投影在其母行星表面的现象。` | 逐字一致（保留编号后的半角空格） |

对照方法：2026-10-22 重新请求这三条详情页；同一段 HTML 切片分别用“正则去标签 + `html.unescape`”与独立的 `html.parser.HTMLParser` 两种解析器提取，两次结果与 JSON 里的 `definition` 三者逐字符相等，并确认该文本出现在页面纯文本中。全量 29 条的两种解析器结果同样全部一致（0 处分歧）。

## 5. 释义来源声明（重要）

- `zh`、`zhTW`、`abbr`、`status`、`sources`、`lastRevised`、`astrodictId`、`astrodictUrl`、`definition`、`examples`、`notes`、`nadcTags` 是 **NADC 审定信息 / 原文照录**，以抓取当日网页为准；其中 `definitionSource` 是按任务约定添加的固定来源标注。
- `explanation`、`formula`、`units`、`misconceptions`、`related`、`field`、`level`、`aliases`、`literatureQuery*` 是 **DSH 释义/整理**，由插件作者撰写，**不是名词委原文**，也不代表名词委观点。`explanation` 与 `definition` 是两套文本：前者是 DSH 自写讲解，后者是 NADC 原文。
- 插件输出中应保持“审定译名 / 定义”与“DSH 释义”的区分（`lib/astrodict.js` 的输出格式与 attribution 已做此区分）。

## 6. 文献检索式抽检（OpenAlex，2026-10-22）

用 OpenAlex Works 接口对部分 `literatureQuery` 做了抽样验证，均能返回天文学结果，例如：

| 检索式 | 命中总数（约） | 示例标题 |
| --- | --- | --- |
| `redshift cosmological distance measurement` | 73,875 | *HUBBLE PARAMETER MEASUREMENT CONSTRAINTS ON THE COSMOLOGICAL DECELERATION-ACCELERATION TRANSITION REDSHIFT* (2013) |
| `gravitational wave interferometer detection` | 25,397 | *Interferometer Techniques for Gravitational-Wave Detection* (2010) |
| `exoplanet transit photometry` | 11,248 | *Transit Analysis Package: An IDL Graphical User Interface for Exoplanet Transit Photometry* (2012) |
| `dark matter halo rotation curve` | 24,251 | *The extended rotation curve and the dark matter halo of M33* (2000) |
| `active galactic nucleus accretion disk` | 12,142 | *Microlensing and the structure of active galactic nucleus accretion disks* (1991) |

其余检索式按同样格式构造（英文 3–8 词，含领域关键词），未在 JSON 中写入检索结果。

## 7. 校验与更新

```bash
# JSON 语法校验
python3 -m json.tool data/terms.seed.json > /dev/null

# 重新核验单条（示例：redshift）
curl -s "https://nadc.china-vo.org/astrodict/fuzzy?word=redshift" | grep -o 'termdetails?id=16171' | head -1
curl -s "https://nadc.china-vo.org/astrodict/termdetails?id=16171" | grep -E '红移|已出版|最后修订'
```

更新建议：先跑检索页拿到 ID，再抓详情页核对 `中文名 / 台湾名 / 缩写 / 状态 / 依据 / 最后修订 / 定义 / 备注 / 范例 / 标签`，只替换对应字段。`definition`、`examples`、`notes`、`nadcTags` 必须原文照录；释义部分如需修改，请保持“DSH 撰写”的标注，不要复制 NADC 的定义文本，也不要让 `explanation` 覆盖 `definition`。

## 8. 引用与许可

- 审定译名与出版信息：© 中国科学院国家天文台 · 天文学名词（NADC），<https://nadc.china-vo.org/astrodict/>；转载或再分发时请注明来源。
- 本文件中的 DSH 释义、公式、误解条目、检索式为插件作者原创整理，随插件代码一同分发。
