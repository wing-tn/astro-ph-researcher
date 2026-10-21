# astro-ph-researcher 数据源调研报告（实测版）

- 调研时间：2026-10-21T17:00Z ~ 2026-10-21T17:04Z（北京时间 2026-10-22 01:00~01:04）
- 调研环境：WSL2 / curl 8.5.0 / Python 3.12.3（Windows pwsh 沙箱不可用，未使用）
- 原始证据：`research/probes/*.json`（含每条请求的 URL、HTTP 状态、响应片段；`request-log.json` 记录 64 条（最终采集轮），另有若干补测未入该文件）
- 原则：**只写实测结论**。凡未实测到的均标“未验证”，不做猜测。
- 范围：仅为插件数据源与排序服务，不含 UI 代码、不含 Python 环境搭建。

---

## 0. 结论速览（给实现者）

| 来源 | 是否需要鉴权 | 相关性字段 | 时间字段 | 引用数字段 | 结论 |
|---|---|---|---|---|---|
| **NADC 天文学名词** | 否 | 无（结果按外文名字母序） | 仅“最后修订”（非发表时间） | 无 | ✅ 离线词库最佳（696 KB zip，3 万词条）；在线接口可作后备 |
| **OpenAlex** | 免费 key 可选（强烈建议） | `relevance_score`（可 select） | `publication_date` | `cited_by_count` | ✅ **主数据源**；新计费模型下必须处理额度/401 |
| **Crossref** | 否（UA 带 mailto 进 polite 池） | `select=score` / `sort=relevance` | `published` / `issued` | `is-referenced-by-count` | ✅ 主数据源之二；中文文献意外可用 |
| **Semantic Scholar** | 建议 key | 无数值分 | `publicationDate` / `year` | `citationCount` | ⚠️ 无 key 时**多数 429**，不可依赖 |
| **arXiv** | 否 | 无（原生 relevance 排序） | `published` / `updated` | 无 | ✅ 预印本补充；限速 1 请求/3 秒 |
| **NASA ADS** | 必须 token | 原生 relevance 排序 | `pubdate` / `date` / `year` | `citation_count` | ✅ 天文最专业，但需用户自备 token（本次未申请） |
| **CNKI 知网** | — | — | — | — | ❌ robots `Disallow: /` + 验证码；**只做人工深链，不抓取** |
| **doi.org 内容协商** | 否 | — | — | — | ✅ BibTeX / CSL-JSON / APA 三种格式实测可用 |

**排序公式**（相关性 0.60 > 时间 0.25 > 引用 0.15，缺失信号权重自动归一）见 [第 10 节](#10-排序建议相关性--时间--引用)；**字段映射与降级矩阵**见 [第 11 节](#11-统一字段映射与降级矩阵)。

---

## 1. NADC 天文学名词（nadc.china-vo.org/astrodict）

站点是 Flask 应用（404 返回 `application/json`），无官方 API 文档；以下均为实测。

### 1.1 可用端点

| 端点 | 方法 | HTTP | Content-Type | 说明 |
|---|---|---|---|---|
| `https://nadc.china-vo.org/astrodict/fuzzy?word=<q>` | GET | 200 | `text/html; charset=utf-8` | HTML 结果页，模糊检索 |
| `https://nadc.china-vo.org/astrodict/precise?word=<q>` | GET | 200 | `text/html; charset=utf-8` | HTML 结果页，精确检索 |
| `https://nadc.china-vo.org/astrodict/termdetails?id=<id>` | GET | 200 | `text/html; charset=utf-8` | 词条详情页 |
| `https://nadc.china-vo.org/astrodict/wordscandidate?q=<q>` | GET | 200 | `application/json` | **未被官方文档化的自动补全 JSON**，最多 10 条（实测 q=red/r/a 均为 10） |
| `https://nadc.china-vo.org/astrodict/termEtymology?termid=<id>` | GET | 200 | `text/html` | 是“补充词源”**提交表单**（POST + csrf + 验证码），不是词源数据 |

`wordscandidate?q=redshift` 实测响应（370 B）：

```json
[{"text":"abnormal redshift"},{"text":"angular diameter-redshift relation"},{"text":"angular diameter-redshift test"},{"text":"Canada-France redshift survey"},{"text":"CfA Redshift Survey"},{"text":"color-redshift diagram"},{"text":"color-redshift relation"},{"text":"correlation function in redshift space"},{"text":"cosmic redshift"},{"text":"cosmological redshift"}]
```

> 注意：`wordscandidate` 只返回 `text`（无 id、无中文），且继承 fuzzy 的宽松匹配（q=AGN 会返回 “AB magnitude” 一类无关项）。

### 1.2 fuzzy vs precise 实测差异（核心）

四个词各测一次（HTTP 全 200；行数含表头已扣除）：

| 查询词 | fuzzy 行数 | precise 行数 | precise 少掉的是什么 |
|---|---|---|---|
| `redshift` | **49** | **38** | `angular diameter-redshift relation`、`color-redshift diagram`、`distance-redshift relation`、`high-redshift galaxy` 等**连字符连写**词 |
| `gravitational lensing` | **7** | **6** | `microgravitational lensing; microlensing; ...`（词内子串） |
| `红移` | **52** | **16** | 中文名含“红移”但**不以它开头**（如 反常红移 / 角径-红移关系 / CfA红移巡天）；precise 的 16 条**全部**以“红移”开头 |
| `活动星系核` | **11** | **7** | `Catalogue of QSO and Active Nuclei`、`changing-look active galactic nucleus` 等 |

行为推断（与全部边界测试一致）：

- **fuzzy = 不区分大小写的子串匹配**，检索列是 **外文名 / 中文名 / 缩写**：
  - `redshif` 返回 49 行（=`redshift` 全部，前缀截断仍命中）；
  - `AGN` 返回 **100 行**（达到上限）：既命中缩写为 AGN 的 `active galactic nucleus`（id=4707，实测在其中），也命中大量只因小写 `magnitude` 含连续字符 `agn` 的噪声（`AB magnitude`、`absolute blue magnitude`…）；
  - `CFRS` 只返回 1 行 → `Canada-France redshift survey`（靠缩写列命中）。
  - 适合“记不全/拼错/中文片段”。
- **precise = 连续 token 前缀匹配**（实测规则，可直接实现）：按空格把外文名切词，查询的多个词需匹配**连续**的 token，且每个查询词是对应 token 的前缀；中文名整体视为一个 token，所以中文查询等价于“整名前缀匹配”。
  - 验证：`precise?word=redshift` 38/38 命中行都含以 `redshift` 开头的空格 token；`红移` 16/16 的中文名以“红移”开头；`活动星系核` 7/7 同理；多词 `gravitational lensing` 6/6 均为连续 token（`Optical Gravitational Lensing Experiment`、`strong gravitational lensing`…）。
  - 因此 `redshif` 返回 15 行（词条 `redshift` 的前缀命中）、`AGN` 返回 6 行（全是 AGN 相关）。适合**精确核验**。
- **两者都不是相关度排序**：结果按“外文名”字母序（`redshift` fuzzy 第一条是 `abnormal redshift`；`redshift` 本尊 `id=16171` 实测排 **第 29/49**（fuzzy）、**第 18/38**（precise））。**插件必须自己重排**（见 1.7、1.9）。
- **无分页参数**：结果表里没有页码/“下一页”，最多 100 行（`fuzzy?word=` 空查询返回前 100 条字母序词条）。
- **大小写不敏感**：`RedShift` 与 `redshift` 行数一致（49/38）。

边界测试完整数据在 `probes/nadc.json` 的 `edge_cases`。

### 1.3 搜索结果表 HTML 结构

```html
<table border="0" id="resulttbl" class="termTable2 listTable">
    <tr><th width="360">外文名</th><th width="60">缩写</th><th width="60">语种</th><th width="180">中文名</th></tr>
    <tr>
        <td><a href="/astrodict/termdetails?id=21746">Canada-France redshift survey</a></td>
        <td>CFRS</td>
        <td>英语</td>
        <td><a href="/astrodict/termdetails?id=21746">加拿大-法国红移巡天; CFRS 巡天</a></td>
    </tr>
    ...
```

可直接用的解析规则：

```python
import re, html
m = re.search(r'<table[^>]*id="resulttbl".*?</table>', page, re.S)
rows = re.findall(r'<tr>(.*?)</tr>', m.group(0), re.S)[1:]
for r in rows:
    tds = [html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', x))).strip()
           for x in re.findall(r'<td>(.*?)</td>', r, re.S)]
    ids = re.findall(r'termdetails\?id=(\d+)', r)   # 每行两次，取 ids[0]
    # tds == [外文名, 缩写, 语种, 中文名]
```

- 第二个表 `id="recommendationtbl"` 在 HTML 里为空（由 JS 填充），忽略。
- 中文名可能含分号多译名（`加拿大-法国红移巡天; CFRS 巡天`），按 `;` 拆分。
- HTML 实体会出现（如 `&#39;Oumuamua`），必须 `html.unescape`。
- 外文名也可能含分号并列（`gravitational lensing; gravitational lens effect`），需拆分。

### 1.4 详情页可解析字段（`termdetails?id=`）

实测 `id=16171`（redshift）去标签后样本：

```
redshift 【英语】
红移 （台湾名：紅移）
（已出版）
依据：
  《英汉天文学名词》李竞、许邦信主编，上海科技教育出版社，2000
  《天文学名词（定义版）》科学出版社，2001
  《英汉天文学名词》，中国科学技术出版社，2015
  《天文学名词（第三版）》科学出版社，2024
最后修订：2010-04-15
定义
(1)天体谱线的观测波长向长波方向频移的现象。(2)该现象引起的谱线波长的相对改变量。
词源
补充词源
```

实测 `id=4707`（缩写词条）样本：

```
active galactic nucleus 【英语】
缩写：AGN
活动星系核 （台湾名：活躍星系核）
（已出版）
依据：…（同上 4 条）
最后修订：2010-04-15
定义
活动性比一般星系核更强的星系核。……
```

HTML 定位：

| 字段 | 选择器 / 正则 | 备注 |
|---|---|---|
| 外文名 | `<div class="titleLine"><strong>(.*?)</strong>` | |
| 语种 | 紧跟 `【(.*?)】` | 实测均为“英语” |
| 缩写 | `缩写：([^<]*)<br/>` | 可选，仅缩写词条有 |
| 中文名 | 详情块内 `中文名 （台湾名：…）` | 注意前面可能有空白 |
| 台湾名 | `（台湾名：([^）]*)）` | 繁体，如“紅移”“活躍星系核” |
| 出版状态 | `（<span[^>]*>([^<]*)</span>）` | 实测“已出版” |
| 依据书目 | 依据后 `<ol><li>*</li></ol>` | 实测 4 条 |
| 最后修订 | `最后修订：(\d{4}-\d{2}-\d{2})` | |
| 定义 | `titleLine">定义</div>` 后文本 | 实测 16171/4707 均有；其余词条未逐一验证 |
| 词源 | 词源 `<ol>` | **12 个抽样词条（16171/4707/4536/4951/7306/16172/26515/8240/10223/23834/26230/733）全部为空**（证据：`probes/nadc.json` 的 `etymology_probe`，12/12 empty） |

⚠️ **词源不可得**：详情页的“补充词源”链接指向 `/astrodict/termEtymology?termid=N`，实测该页是提交表单（`<form id="submitform" method="post" action="/astrodict/termEtymology">`，含 csrf_token、验证码、邮箱），页面栏目为“词源内容/外文名/中文名/例句/图书/作者/出版时间”。**没有已发布的词源数据**。插件若需要词源，只能不做或让用户自行补充，不能声称“词源可解析”。

### 1.5 官方词表下载（重要发现：可直接离线）

路径：`/astrodict/article/download`（导航“词典下载”，HTTP 200）→ 开放使用约定页 → 同意链接 `id=20171117233847` → “分类下载”页 → zip。

```
当前版本：r241020
zip: https://nadc.china-vo.org/astrodict/s/2024/astrodict_241020.zip
HTTP 200 | Content-Type: application/zip | Content-Length: 696,272 B | sha256 2520bb8bd4d3382b…
ETag "68a572e7-a9fd0" | Last-Modified: Wed, 20 Aug 2025 07:01:59 GMT
```

zip 内容（实测解包）：

| 文件 | 字节 | 行数 | 格式 |
|---|---|---|---|
| `astrodict241020_ec.txt` | 1,083,531 | **30,094** | `英文<TAB>中文`，UTF-8 |
| `astrodict241020_ce.txt` | 967,947 | **26,770** | `中文<TAB>英文`，UTF-8 |
| `readme.txt` | 2,768 | 27 | 格式说明 + 使用约定 |

实测样本行：

```
AGN	全称：active galactic nucleus。活动星系核
21CMA	全称：21 Centimeter Array。21厘米[射电望远镜]阵
2dFGRS	全称：Two-degree-Field Galaxy Redshift Survey; 2dF Galaxy Redshift Survey。2度视场星系红移巡天
redshift	红移
```

- 固定 2 列（实测全部 30094/26770 行 `NF==2`），**没有 id、没有台湾名、没有定义、没有出版状态**。
- 缩写词条用中文列内嵌 **`全称：<英文全称>。<中文名>`** 表达；实测 1768 行含 `全称：`。
- 实测无首尾空白行问题（0 行以空白开头）；**同一英文键可重复**（`ac`/`ads`/`ag`/`am`/`antares` 等），解析时按 `Map<string, Row[]>` 存。
- 分类下载页还有：火星地形地貌（814 条、1136 条）、stardict/mdict/金山词霸格式等旧版。

**使用许可（原文要点，`/astrodict/article/download`）**：

1. 所有权归中国天文学会；**未经授权不得用于以赢利为目的的商业产品和活动**。
2. 通过指定网站无偿发布，可自由下载。
3. **可以集成、二次开发、格式转换**；但**无权修改内容，或与其他词库产品整合后二次发布**。
4. 建议（非强制）注明“‘英汉天文学名词数据库’由中国天文学会天文学名词审定委员会提供”。

> 给插件的合规建议：**不要把 zip 数据打包进插件发行物**（有“二次发布”风险）；而是首次使用时由用户点击、从官方 URL 下载到本地缓存，展示署名与许可。免费/开源非商业插件本身不违反第 1 条。

### 1.6 robots.txt、频率、UA

- `https://nadc.china-vo.org/robots.txt`（HTTP 200，`text/plain`，47 B）全文：

```
Disallow:/data/mirror/
Disallow:/data/archive/
```

→ **`/astrodict/` 未被禁止抓取**。`https://nadc.china-vo.org/astrodict/robots.txt` 返回 JSON 404（`application/json`）。

- 频率：连续 8 次 fuzzy 请求 **8/8 全 200**，无 429；服务端延迟约 0.9 s/请求（20 次连测均值，包含网络）。**官方未公布限速**（未验证）。
- UA：默认 `curl/8.5.0` 与自定义 UA 均返回 200、字节数相同（27756），**无 UA 门槛**。
- 建议（自律，非官方要求）：≤1 请求/秒、单连接；词典类结果缓存 7~30 天；批量需求用官方 zip，不要逐词爬。
- 建议 UA：`astro-ph-researcher/0.1 (+https://<项目主页>)`（便于对方联系，也符合常见礼貌约定）。

### 1.7 中文反查英文、缩写反查（实测支持）

| 方向 | 用例 | 结果 |
|---|---|---|
| 中文 → 英文 | `precise?word=红移` | 200，16 行，**第 2 条**即 `redshift / 红移 (id=16171)`（第 1 条是“红移空间相关函数”）✅ |
| 英文 → 中文 | `precise?word=redshift` | 200，含 `redshift / 红移 (id=16171)` ✅ |
| 缩写 → 全称 | `precise?word=AGN` | 200，6 行，首条 `active galactic nucleus / 活动星系核 (id=4707)` ✅ |
| 全称 → 缩写 | `termdetails?id=4707` | 页面显示 `缩写：AGN` ✅ |
| 缩写（fuzzy） | `fuzzy?word=AGN` | 100 行噪声（AB magnitude…），正确项 id=4707 被淹没在字母序里，**不可用** ❌ |

→ **核验规则：缩写查询必须走 precise，不要用 fuzzy。**

### 1.8 NADC 给插件的实现建议

1. **首选离线词库**（速度 0ms、无网络依赖、无频率风险）：从官方 zip 建三个索引
   - `en2zh: Map<normalizedEn, Row[]>`（30094 条）
   - `zh2en: Map<normalizedZh, Row[]>`（26770 条）
   - `abbr2full: Map<abbrUpper, {full, zh}>`（解析 `全称：X。Y`，约 1768 条）
2. **需要台湾名/定义/出版状态/依据时**才走网络：`precise?word=<词>` → 用 1.3 解析拿 id → `termdetails?id=<id>` → 1.4 解析，结果缓存 ≥30 天。
3. **重排而不是取第一条**（结果字母序）：见 1.9 匹配打分。
4. 版本检查：GET `article/download` 抓 `当前版本：r241020`，或 HEAD zip 比对 `ETag`/`Last-Modified`。

### 1.9 译名核验打分（可直接实现）

归一化：`NFKC → lowercase → 去首尾空白 → 空白折叠 → 连字符统一为 '-' → 去首尾标点`；中文另去全角空格。

分层匹配（取最高命中，命中即停）：

| 层级 | 条件 | 分数 | 含义 |
|---|---|---|---|
| 1 | 归一化后 **完全相等**（英文对英文、中文对中文、缩写大写相等） | 1.00 | 官方标准译名 |
| 2 | 分号拆分后的**任一变体完全相等** | 0.95 | 标准译名的并列写法 |
| 3 | 词集合相等（token set 相同，忽略顺序） | 0.85 | 同义措辞 |
| 4 | 词集合是真子集（查询词 ⊂ 词条 或反之） | 0.70 | 上位/下位概念，需人工确认 |
| 5 | 前缀/词边界包含（precise 命中） | 0.50 | 疑似 |
| 6 | 任意子串/字符级（fuzzy 命中） | 0.25 | 仅作候选提示 |

约定：**≥0.95 显示“权威译名”**（附依据书目 + 最后修订）；0.50~0.94 显示“疑似，请核对”；<0.50 只列候选不结论。缩写命中时展示 `缩写 + 全称 + 中文名` 三元组。

---

## 2. OpenAlex（api.openalex.org/works）

### 2.1 计费/鉴权（2026 年已改模型，必须处理）

官方文档 `https://help.openalex.org/access/pricing.md`、`/auth.md`、`/api/authentication.md`（均 HTTP 200）实测要点：

- **无 key**：免费额度 **$0.10/天，按 IP 共享**（IPv4 或 IPv6 /64）。
- **免费 key**：**$1/天**，UTC 午夜重置；申请：`POST https://api.openalex.org/api-keys` body `{"email":"<用户邮箱>"}`（官方明确要求“问用户要邮箱，不要编造”），或网页注册后在 Settings 取 key；邮件确认前带 key 请求返回 **403 `key_not_activated`**。
- 单价（`/access/example-costs.md`）：**Search $1/1000 次（$0.001/次）**；List+filter **$0.10/1000 次**；单条实体查询 **免费**；`rerank=true` 追加 +$1/1000（即检索 + rerank = $2/1000）。
- 响应头：`X-RateLimit-Cost-USD`、`X-RateLimit-Limit: 1000`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`（秒）；`meta.cost_usd`。
- 实测额度耗尽时返回 **HTTP 401**，body 仍是 JSON 且带 `meta.notice`（“No API key, so this request shares one free daily budget ($0.10)…”）。
- 实测单实体免费：`GET /works/https://doi.org/10.1088/0264-9381/27/23/233001` → 200，`X-RateLimit-Cost-USD: 0`。
- `mailto`：**当前文档已不再提**。实测带/不带都是 200、无可观察差异 → 不作为功能依赖，只作为联系方式写入 User-Agent 即可。

> 给插件：**不要内置 key**。引导用户粘贴自己的免费 key（提示“申请后 $1/天，约 1000 次检索”）；无 key 时按 $0.10/天估算可用约 100 次检索，并在 401 时自动降级到 Crossref/arXiv。

### 2.2 已验证参数

| 参数 | 实测 | 说明 |
|---|---|---|
| `search=` | 200 | 全文检索；相关性排序必须带它 |
| `sort=relevance_score:desc` | 200 | 必须同时有 search，否则见下 |
| `sort=cited_by_count:desc` | 200 | |
| `sort=publication_date:desc` | 200 | 实测返回 2026-10-31 的**未来日期**（OpenAlex 入库日期可超前，建议前端显示时 clamp） |
| `select=` 含 `relevance_score` | 200 | ✅ 允许！返回 `{"id","title","relevance_score":156.97075}` |
| `filter=from_publication_date:2020-01-01` | 200 | |
| `filter=to_publication_date:2024-12-31` | 200 | |
| `filter=cited_by_count:>10` | 200 | |
| `filter=is_oa:true` | 200 | |
| `filter=type:article` | 200 | `book`、`preprint` 等亦可 |
| `per_page` | 1–100（官方文档；实测 8/3/2 均 200） | 官方 paging 文档：100 为支持上限，`per_page=200` 是遗留行为、将被移除。**未直接实测 200/201**（当时命中额度 401，无法据此判断参数校验） |
| `page` + `per_page` | 200 | 深页上限 `page*per_page ≤ 10,000` |
| `cursor=*` | 200（首屏） | 首屏可无 key；**跟随 `next_cursor` 翻页需 key，否则 401**（官方 paging 文档） |

无 search 时按相关性排序的错误（HTTP 400，原文）：

```json
{"error":"Invalid query parameters error.","message":"Must include a search query (such as ?search=example or /filter=fulltext.search:example) in order to sort by relevance_score."}
```

### 2.3 最小字段的 8 条请求（实测 URL）

```
https://api.openalex.org/works?search=gravitational+lensing
  &filter=type:article,from_publication_date:2015-01-01
  &sort=relevance_score:desc
  &per_page=8
  &select=id,doi,title,publication_year,cited_by_count,publication_date,primary_location,authorships,open_access,abstract_inverted_index
```

HTTP 200，`meta.count=44311`，`meta.cost_usd=0.001`。样本（`probes/openalex.json`）：

| # | 年 | 引用 | DOI | 期刊 | OA |
|---|---|---|---|---|---|
| 1 | 2018 | 235 | 10.1103/physrevd.97.024042 | Physical review. D | True(hybrid) |
| 2 | 2015 | 102 | 10.1134/s1063780x15070016 | Plasma Physics Reports | False |
| 3 | 2016 | 64 | 10.1103/physrevd.93.084051 | Physical review. D | False |
| 4 | 2019 | 146 | 10.1088/1475-7516/2019/07/028 | JCAP | True(bronze) |
| 5 | 2021 | 190 | 10.21105/joss.03283 | JOSS | True(diamond) |
| 6 | 2018 | 110 | 10.1016/j.physletb.2018.12.030 | Physics Letters B | True(diamond) |
| 7 | 2018 | 572 | 10.1007/s10714-018-2361-9 | General Relativity and Gravitation | True(green) |
| 8 | 2016 | 284 | 10.1051/0004-6361/201525941 | **LA Referencia（仓库）** | True(green) |

⚠️ 实测第 8 条的 `primary_location.source.display_name` 是**仓储**（LA Referencia）而不是期刊 A&A → 取期刊名时应优先 `primary_location.source` 且校验 `source.type=="journal"`，否则回退 `best_oa_location.source` 或 `locations[]` 中 type=journal 的项。

### 2.4 字段映射

| 插件字段 | OpenAlex 路径 | 备注 |
|---|---|---|
| 标题 | `title` / `display_name` | |
| 年份 | `publication_year` | |
| 日期 | `publication_date` | `YYYY-MM-DD`，可能未来日期 |
| DOI | `doi` | 形如 `https://doi.org/...`，需剥前缀 |
| 引用数 | `cited_by_count` | |
| 期刊 | `primary_location.source.display_name` | 见上面仓储陷阱 |
| 作者 | `authorships[].author.display_name` | |
| OA | `open_access.is_oa` / `oa_status` | `oa_status`: gold/hybrid/bronze/green/diamond/closed |
| 摘要 | `abstract_inverted_index` | 需还原，见 2.5 |
| 相关性 | `relevance_score` | **必须显式写进 `select` 才返回**（实测：`sort=relevance_score:desc&select=id,title` 时结果 keys 只有 `id,title`）；无界正数（实测 156.97 / 139.37） |
| 类型 | `type` | article/book/preprint/dataset… |

### 2.5 摘要倒排索引还原（实测有效）

```python
def decode_abstract(ii: dict | None) -> str | None:
    if not ii: return None
    pos = {}
    for word, idxs in ii.items():
        for i in idxs:
            pos[i] = word
    return " ".join(pos[i] for i in sorted(pos))
```

实测还原示例：`"Gravitational lensing has developed into one of the..."`。注意：部分条目该字段为空（实测 8 条中 1 条为空）；个别条目的“摘要”内容可能是作者 comment（实测 Planck 那条还原出 “29 pages, 2 wide-format tables…”）。

---

## 3. Crossref（api.crossref.org/works）

无需 key；**UA 里带 `mailto:` 可进 polite 池**（实测速率翻 3 倍）。

### 3.1 实测参数

| 参数 | 实测 | 说明 |
|---|---|---|
| `query.bibliographic=` | 200 | 书目检索；`gravitational lensing` → **total 56876** |
| `query.title=` | 200 | 标题检索；同词 → total **52741**（与 bibliographic 结果不同） |
| `query=` | 200 | 通用检索 |
| `sort=relevance` + `order=desc` | 200 | 默认即 relevance |
| `sort=published` + `order=desc` | 200 | 实测会给出 2027 年（未来）日期 |
| `sort=is-referenced-by-count` + `order=desc` | 200 | 实测前三条 11987 / 8472 / 6660 引用 |
| `select=` | 200 | **`select=score` 可拿到相关性数值**（实测 30.55 / 30.01 / 29.99） |
| `select=relevance_score` | **400** | 见 3.3 |
| `filter=from-pub-date:2020-01-01` | 200 | |
| `filter=until-pub-date:2024-12-31` | 200 | |
| `filter=type:journal-article` | 200 | |
| `filter=has-abstract:true` | 200 | 组合后 total 121075 |
| `cursor=*` → 翻页 | 200 | **无需 key**（与 OpenAlex 不同） |
| `mailto=` | 200 | 实测：UA 不带 mailto、仅用 `?mailto=` 参数 → 同样返回 `x-api-pool: polite-array`、3 req/s，**两种写法等效**（建议放 UA，兼顾礼貌与可读性） |

### 3.2 样本（`probes/crossref.json`）

URL：

```
https://api.crossref.org/works?query.bibliographic=fast+radio+burst
  &rows=3&filter=has-abstract:true,type:journal-article
  &select=DOI,title,score,abstract,is-referenced-by-count,published,container-title,author,type,URL
```

HTTP 200，`total-results=121075`：

| DOI | 标题（实测原文，截断） | score | 引用 | 日期 |
|---|---|---|---|---|
| 10.3847/2041-8213/abc6a3 | Fast Radio Burst Breakouts from Magnetar Burst Fireballs | 27.22 | 47 | 2020-11-24 |
| 10.1093/mnras/stag1325 | Scatter in the relation between persistent radio source luminosity and fast radio burst rotation measure… | 25.72 | 0 | 2026-07-15 |
| 10.3847/1538-4357/adfec4 | Flat Tails in Fast Radio Burst and Pulsar Energy Distributions… | 25.39 | 1 | 2025-09-24 |

（注意：第 2 条的 `published` 是 **2026-07-15**——Crossref 确实存在“未来/在线优先”日期，排序与展示都要 clamp。）

### 3.3 select 错误信息（可用于校验字段）

`select=DOI,relevance_score` → **HTTP 400**：

```json
{"status":"failed","message-type":"validation-failure","message":[{"type":"select-not-available","value":"relevance_score","message":"Select 'relevance_score' specified but there is no such select for this route. Valid selects for this route are: abstract, URL, resource, member, posted, score, creat…
```

→ **相关性字段是 `score`，不是 `relevance_score`**。

### 3.4 abstract 是 JATS XML，清洗方法（实测）

原始（截断 280 字符）：

```
<jats:title>Abstract</jats:title> <jats:p>The recent discovery of a Mega-Jansky radio burst occurring simultaneously with short X-ray bursts from the Galactic magnetar…</jats:p>
```

清洗（先去 title 再剥标签，否则会残留“Abstract”单词）：

```python
ab = re.sub(r'<jats:title>.*?</jats:title>', '', raw, flags=re.S)
ab = re.sub(r'<[^>]+>', ' ', ab)
ab = re.sub(r'\s+', ' ', ab).strip()
```

实测清洗结果：`"The recent discovery of a Mega-Jansky radio burst occurring simultaneously with..."`。

### 3.5 polite 池（实测响应头）

| UA | `x-api-pool` | `x-rate-limit-limit` | `x-rate-limit-interval` | `x-concurrency-limit` |
|---|---|---|---|---|
| `astro-ph-researcher-research/0.1` | `public-array` | 1 | 1s | 1 |
| `astro-ph-researcher-research/0.1 (mailto:astro-ph-researcher@example.com)` | `polite-array` | **3** | 1s | **3** |

→ 插件 UA 建议固定为 `astro-ph-researcher/<version> (mailto:<用户可配置邮箱>)`，速率 ≤3 req/s。

### 3.6 中文检索（意外收获）

`query.bibliographic=活动星系核` → HTTP 200，**total 199291**，返回中文题名：

```
活动星系核中紫外大包的辐射机制 (1993)
活动星系核中的尘埃 (2014)
Blandford-Znajek效应对活动星系核中心黑洞热力学演化的影响 (1997)
```

→ 这是**不需要 CNKI 也能拿到中文文献元数据**的合法路径（仅题录，无全文）。适合中文检索模式。

### 3.7 字段映射

| 插件字段 | Crossref 路径 | 备注 |
|---|---|---|
| 标题 | `title[0]` | 有时全大写 |
| DOI | `DOI` | |
| 年/日期 | `published.date-parts[0]`（回退 `issued`） | 可能只有年月 |
| 引用数 | `is-referenced-by-count` | |
| 期刊 | `container-title[0]` | |
| 作者 | `author[]` → `given + family` | 可能为空（book-chapter 实测为空） |
| 摘要 | `abstract` | JATS，见 3.4 |
| 类型 | `type` | `journal-article` / `book-chapter` / `proceedings-article` 等 |
| 相关性 | `score`（需 select） | 数值压缩（30.55 vs 25.39），**建议用排名归一** |

---

## 4. Semantic Scholar Graph API（可选，不稳定）

- 端点：`https://api.semanticscholar.org/graph/v1/paper/search?query=…&limit=…&fields=…`
- **首次实测 HTTP 200**（有数据），响应片段：

```json
{"total": 907521, "offset": 0, "next": 3, "data": [{"paperId": "933bc7a2ad9cd303da44125541c4ebb1d1c94033", "externalIds": {"ArXiv": "2503.00082", "DOI": "10.1016/j.physletb.2025.139448", "CorpusId": 276741369}, "title": "Gravitational lensing phenomena of Ellis-Bronnikov-Morris-Thorne wormhole…", "venue": "Physics Letters B", "year": 2025, "citationCount": 39, …
```

- **随后 7 次重试全部 HTTP 429**（4 次连发 + 3 次间隔 3s 的顺序重试），`Retry-After` 头**缺失**，body：

```json
{"message": "Too Many Requests. Please wait and try again or apply for a key for higher rate limits. https://www.semanticscholar.org/product/api#api-key-form", "code": "429"}
```

- 字段：`title, year, citationCount, externalIds, venue, openAccessPdf, authors, abstract, publicationDate`（按需 `fields=` 逗号分隔）。
- 结论：**无 key 不可作为默认依赖**（成功与否取决于共享池状态）；若使用必须：超时 2s + 单次尝试 + 429 直接跳过；或引导用户配置 key。未验证 key 的限额与字段差异。

---

## 5. arXiv API

- 端点：`https://export.arxiv.org/api/query`（HTTP 200，`application/atom+xml; charset=utf-8`）
- 实测 `search_query` 语法：

| 查询 | HTTP | 条目数 |
|---|---|---|
| `all:"gravitational lensing"` | 200 | 3（max_results=3） |
| `ti:"gravitational lensing"` | 200 | 2 |
| `au:Bartelmann` | 200 | 2 |
| `cat:astro-ph.CO AND abs:"redshift"` | 200 | 2 |
| `all:红移` | 200 | **0**（不支持中文） |

- 排序：`sortBy=relevance` 与 `sortBy=submittedDate`（配合 `sortOrder=descending`）均实测 200。
  - `relevance` 首条：`Image simulations for strong and weak gravitational lensing`（2020，astro-ph.CO）
  - `submittedDate` 首条：`2026-10-19T20:02:50Z`（最新）
- Atom 字段（实测存在）：`id`、`updated`、`published`、`title`、`summary`、`author/name[]`、`arxiv:doi`、`arxiv:journal_ref`、`arxiv:primary_category@term`、`link[@rel=alternate]`、`category@term`。
- **无引用数字段**（arXiv 不提供 citation count）→ 排序时按“引用信号缺失”降级（见 11）。
- 限速（官方 `https://info.arxiv.org/help/api/tou.html`，HTTP 200 原文）：**“make no more than one request every three seconds, and limit requests to a single connection at a time”**。
- 分页参数：`start` + `max_results`（本次仅验证首屏；深分页行为未验证）。

---

## 6. NASA ADS（必须 token，本次未申请）

### 6.1 无 token / 假 token 的实测错误

| 请求 | HTTP | body |
|---|---|---|
| `GET https://api.adsabs.harvard.edu/v1/search/query?q=gravitational+lensing&fl=title,year,citation_count&rows=2` | **401** | `{"message": "Missing \"Authorization\" in headers."}`（无 `WWW-Authenticate` 头） |
| 同上 + `Authorization: Bearer INVALID_TOKEN_PROBE` | **401** | `{"message": "The access token provided is expired, revoked, malformed, or invalid for other reasons."}` |

### 6.2 鉴权与申请

- Header：`Authorization: Bearer <token>`（OpenAPI `securitySchemes.ApiKeySecurity`：`type: http, scheme: bearer, bearerFormat: JWT`）。
- 申请：登录 `https://ui.adsabs.harvard.edu` → 用户设置 → `https://ui.adsabs.harvard.edu/#user/settings/token` → “Generate a new key”（**本次按要求未申请**）。
- 额度（官方仓库 README 原文）：每端点 **5000 次/天**，响应头 `X-RateLimit-Limit/Remaining/Reset`，UTC 午夜重置。

### 6.3 端点与参数（取自官方 OpenAPI 规范）

> 官方文档站 `https://ui.adsabs.harvard.edu/help/api/api-docs` 被 **AWS WAF 拦截**（HTTP 202、空 body、`awsWafCookie` 脚本），所以字段表取自官方仓库 `github.com/adsabs/adsabs-dev-api/openapi`（`openapi.yaml` + `services/solr.yaml` + `parameters.yaml`，均 HTTP 200）。

- `GET /v1/search/query`：`q`（必填，ADS 检索语法）、`fq`（数组，最多 10 个）、`fl`、`start`（默认 0）、`rows`（默认 10，**最大 2000**）、`sort`。
- `fl` 允许 **66 个字段**，含：`abstract, author, bibcode, citation_count, citation_count_norm, classic_factor, date, doi, doctype, first_author, identifier, issue, keyword, page, property, pub, pubdate, read_count, reference, title, volume, year, score, arxiv_class, …`
- `sort` 枚举（`field asc|desc`）：`score, citation_count, citation_count_norm, date, entry_date, read_count, classic_factor, author_count, bibcode, first_author, id` —— 默认即**相关度排序**。
- 返回：JSON（`response.numFound`、`response.docs[]`）。
- 其他端点：`/v1/search/qtree`、`/v1/search/bigquery`、`/v1/export`。

**未验证**：以上参数均无 token 无法实测（401 前置），仅来自官方规范；`rows=2000`、5000/天等未做真实调用验证。

---

## 7. CNKI 知网（合规红线，只做人工深链）

| 测试 | URL | HTTP | 结果 |
|---|---|---|---|
| robots | `https://kns.cnki.net/robots.txt` | 200 | `User-agent: *` / **`Disallow: /`** |
| kns 深链 | `https://kns.cnki.net/kns8s/defaultresult/index?kw=活动星系核` | 200（302 →） | 302 到 `https://kns.cnki.net/verify/home?captchaType=blockPuzzle&…`，最终页 `<title>安全验证</title>`（滑块验证码），**拿不到结果** |
| kns 根路径 | `https://kns.cnki.net/kns8s/` | 200（302 →） | 同样跳“安全验证” |
| 知网空间深链 | `https://search.cnki.com.cn/Search/Result?content=活动星系核` | **200** | `<title>综合搜索_知网空间</title>`，41,277 B，**无需登录即可打开页面**；但静态 HTML 中**结果条目为 0**（前端 JS 渲染），页面含筛选（文献类型/学科分类/发表年度）与排序（相关度/发表时间/下载次数/被引次数） |
| 学位论文参数 | 加 `&dbcode=CDMD` | 200 | **响应与不加完全一致**（md5 相同 `b426a5a6e70a`），参数被忽略 |
| 学位论文参数 | 加 `&type=学位论文` | 200 | 仅 +10 字节（疑似回显），**无法确认是筛选** |
| robots | `https://search.cnki.com.cn/robots.txt` | **超时** | 25~30s 无响应（HTTP 000），未取得 |

结论：

1. **没有公开 API、没有官方文档**；`kns.cnki.net` 明确 `Disallow: /` 且首请求即触发验证码 → **不得抓取、不得绕过**（本次未尝试任何绕过）。
2. `search.cnki.com.cn` 页面可直接打开且不强制登录，但结果是 JS 渲染 + 可能的验证码，**不适合作为程序化数据源**。
3. **学位论文筛选的可用 URL 参数：未验证**（`dbcode=CDMD` 无效，`type=学位论文` 存疑）。
4. 插件里 CNKI 只能是“**在知网打开**”外链按钮：`https://search.cnki.com.cn/Search/Result?content=<encodeURIComponent(关键词)>`，由用户浏览器自行通过验证码。付费墙/登录一律不碰。

---

## 8. DOI 内容协商（可直接做引用导出）

`curl -LH "Accept: <type>" https://doi.org/<doi>` 实测（两个 DOI × 三种格式，全部 HTTP 200）：

| DOI | Accept | HTTP | Content-Type | 字节 |
|---|---|---|---|---|
| 10.1088/0264-9381/27/23/233001 | `application/x-bibtex` | 200 | `application/x-bibtex` | 337 |
| 同上 | `application/vnd.citationstyles.csl+json` | 200 | 同 | 80,266 |
| 同上 | `text/x-bibliography; style=apa` | 200 | `text/x-bibliography` | 140 |
| 10.1103/PhysRevD.97.024042 | `application/x-bibtex` | 200 | 同 | 345 |
| 同上 | CSL-JSON | 200 | 同 | 7,149 |
| 同上 | APA | 200 | 同 | 148 |

BibTeX 样本（原文）：

```bibtex
@article{Bartelmann_2010, title={Gravitational lensing}, volume={27}, ISSN={1361-6382}, url={http://dx.doi.org/10.1088/0264-9381/27/23/233001}, DOI={10.1088/0264-9381/27/23/233001}, number={23}, journal={Classical and Quantum Gravity}, publisher={IOP Publishing}, author={Bartelmann, Matthias}, year={2010}, month=Nov, pages={233001} }
```

APA 样本：`Bartelmann, M. (2010). Gravitational lensing. Classical and Quantum Gravity, 27(23), 233001. https://doi.org/10.1088/0264-9381/27/23/233001`

**备用降级（实测）**：

- 内容协商失败时 → `GET https://api.crossref.org/works/<doi>` → 200（该 DOI 返回 cites 410、published `[2010,11,15]`）。
- 或 → `GET https://api.openalex.org/works/https://doi.org/<doi>` → 200（cites 444，`cost 0`，单实体免费）。

**未验证**：DataCite 类型 DOI（如 Zenodo）的内容协商；部分出版商可能不支持某格式。

---

## 9. 各来源请求礼仪与缓存策略（建议）

| 来源 | 鉴权 | 速率（实测/官方） | 缓存 | UA/头 |
|---|---|---|---|---|
| NADC | 无 | 官方未公布；实测 8/8 200，建议 ≤1/s | 词条 30 天；词库按版本（ETag） | `astro-ph-researcher/0.1 (+项目URL)` |
| OpenAlex | 免费 key（建议） | $1/天（key）或 $0.10/天（无 key，共享 IP）；单实体免费 | 搜索结果 10 分钟；实体 7 天 | `api_key` 参数 |
| Crossref | 无 | polite 3/s、3 并发（UA 带 mailto） | 10 分钟；实体 7 天 | `astro-ph-researcher/0.1 (mailto:<email>)` |
| Semantic Scholar | 建议 key | 无 key 多数 429 | 不建议缓存失败 | 2s 超时、429 即跳过 |
| arXiv | 无 | **1 请求/3 秒，单连接** | 24 小时 | 常规 UA |
| ADS | 用户 token | 5000/天/端点 | 7 天 | `Authorization: Bearer` |
| CNKI | — | 不请求 | — | 仅外链 |
| doi.org | 无 | 无明显限制 | 引用结果 30 天 | Accept 头 |

---

## 10. 排序建议：相关性 > 时间 > 引用

### 10.1 目标与数据现实

- **相关性**：OpenAlex 有 `relevance_score`（数值大、跨查询不可比）；Crossref 有 `score`（数值压缩）；arXiv/ADS 只有原生排序；S2 无数值；NADC 无相关性（字母序）。
- **时间**：OpenAlex `publication_date`、Crossref `published`、arXiv `published`、ADS `pubdate/date`、S2 `publicationDate`；NADC 只有“最后修订”（**不是发表时间**，不可当时间信号）。
- **引用**：OpenAlex `cited_by_count`、Crossref `is-referenced-by-count`、ADS `citation_count`、S2 `citationCount`；**arXiv 没有**；NADC 没有。

### 10.2 归一化（关键：跨源可比）

**相关性**：不要直接混用原始分（OpenAlex 156 vs Crossref 30）。用**来源内排名归一**，合并后仍可比：

```
r_i = 1 - (i - 1) / max(1, n - 1)      # i = 该来源结果里的 1-based 名次；n = 该来源本次返回条数
```

可选增强（OpenAlex 这类有稳定数值分的）：

```
minmax_i = (raw_i - min) / (max - min)       # max==min 时取 1
r_i      = 0.7 * rank_norm_i + 0.3 * minmax_i
```

**时间**：用半衰期指数衰减（默认 H=8 年，天文领域偏慢；古籍/经典可设 H=15；“最新进展”模式 H=2）：

```
age_years = clamp((now - published_date) / 365.25, 0, 200)
t = 0.5 ** (age_years / H)
```

- 只有年份时：按 `year-07-01` 估算。
- 缺失日期：`t = 0.5`（中性），并标记 `has_date=false`。
- 未来日期（Crossref/OpenAlex 实测存在）：`age_years=0 → t=1`，但 UI 显示“日期可疑”。

**引用**：对数归一（避免 1 万引用的经典论文碾压一切）：

```
c = clamp(log1p(citations) / log1p(1000), 0, 1)     # 1000 引用 ≈ 0.95，视为“极高”
```

可选“年均引用”版本（缓解老论文偏置，若用户抱怨全是老经典时启用）：

```
c = clamp(log1p(citations / max(1, age_years + 1)) / log1p(100), 0, 1)
```

### 10.3 综合分（缺失信号自动降权）

```python
W_R, W_T, W_C = 0.60, 0.25, 0.15          # 可配置
num = W_R * r + W_T * t + (W_C * c if has_citations else 0)
den = W_R + W_T + (W_C if has_citations else 0)
score = num / den
if normalized_query and normalized_query in normalized_title:
    score = min(1.0, score + 0.05)        # 标题精确命中加成（可选）
```

- **缺引用**（arXiv/NADC）→ 权重归一，不惩罚成 0 分。
- **缺日期** → `t=0.5`，视为“信息不足的中性值”。
- 权重默认值把“相关性”压到 0.6，保证它主导；时间 0.25 次之；引用 0.15 第三。

### 10.4 严格优先级模式（满足“相关性为主、时间次1、引用数次2”的字面语义）

加权分在极端情况下可能让“高度新+高引”的低相关论文逆袭。若产品要求严格优先级，用**分层字典序**：

```python
def strict_key(x, R_BUCKET=0.05):
    return (
        int(x.r / R_BUCKET),   # 第 1 优先：相关性（5% 一档，档内视为并列）
        x.t,                   # 第 2 优先：时间
        x.c,                   # 第 3 优先：引用
    )
items.sort(key=strict_key, reverse=True)
```

即：相关性差距 > 5% 时，时间和引用**无法翻盘**；只有近分（同档）才比时间，再比引用。建议默认用 10.3 加权分，提供“严格模式”开关。

### 10.5 合并与去重（多源结果）

1. 每个来源都用**自己的相关性排序**取前 20~30 条（**不要**用 `cited_by_count`/`is-referenced-by-count` 排序取数，否则排名归一失效）。
2. 去重键优先级：`lowercased DOI` > `arXiv ID`（`externalIds.ArXiv` / `arxiv.org/abs/xxx`）> `normalized_title + year`。
3. 合并策略：`r = max(r_all)`；`citations = max()`；`published_date = min()`（最早公开）；元数据取可信度最高来源（OpenAlex > Crossref > ADS > S2 > arXiv），但 PDF/OA 链接优先取 OA 来源。
4. 合并后再计算时间/引用项并排序（相关性 r 已在来源内算好，合并时保留）。

### 10.6 中文查询的特殊流程（插件核心价值）

```
用户输入
  ├─ 检测含 CJK
  ├─ NADC 离线词库精确/近似匹配 → 得到英文标准名（如 活动星系核 → active galactic nucleus, AGN）
  ├─ 英文查询：OpenAlex(search=EN) / arXiv(all:"EN") / Crossref(query.bibliographic=EN)
  └─ 中文查询：Crossref(query.bibliographic=ZH) 取中文题录
合并 → 去重 → 10.3 排序
```

- NADC 命中分数 ≥0.95 时，把“权威译名”展示在结果顶部（含依据书目、最后修订、台湾名）。
- 英文查询与中文查询的结果各自做来源内排名归一后再合并（避免中文结果因条数少而被系统性压低）。
- **不要**把 NADC 的“最后修订”当作文献时间。

### 10.7 参考实现（TypeScript，可直接落地）

```ts
export interface Candidate {
  source: 'openalex' | 'crossref' | 'arxiv' | 's2' | 'ads';
  title: string;
  publishedDate?: string;   // ISO
  year?: number;
  citations?: number;
  relevanceRaw?: number;
  rank: number;             // 该来源结果中的 1-based 名次
  sourceTotal: number;      // 该来源本次返回条数
}

export interface RankOpts {
  wR?: number; wT?: number; wC?: number;
  halfLifeYears?: number;   // 默认 8
  citationAnchor?: number;  // 默认 1000
  titleHit?: (c: Candidate) => boolean;
}

export function rankCandidates(items: Candidate[], query: string, o: RankOpts = {}) {
  const { wR = 0.60, wT = 0.25, wC = 0.15, halfLifeYears = 8, citationAnchor = 1000 } = o;
  const now = Date.now();
  return items.map(it => {
    // 1) 相关性：来源内排名归一（合并后仍可比）
    const r = it.sourceTotal > 1 ? 1 - (it.rank - 1) / (it.sourceTotal - 1) : 1;

    // 2) 时间：半衰期指数衰减
    let t = 0.5;
    if (it.publishedDate) {
      const age = Math.max(0, (now - new Date(it.publishedDate).getTime()) / 31557600000);
      t = Math.pow(0.5, age / halfLifeYears);
    } else if (it.year) {
      const age = Math.max(0, new Date().getUTCFullYear() - it.year);
      t = Math.pow(0.5, age / halfLifeYears);
    }

    // 3) 引用：对数归一
    const hasC = Number.isFinite(it.citations);
    const c = hasC ? Math.min(1, Math.log1p(it.citations!) / Math.log1p(citationAnchor)) : 0;

    // 4) 缺失信号：权重归一
    const num = wR * r + wT * t + (hasC ? wC * c : 0);
    const den = wR + wT + (hasC ? wC : 0);
    let score = num / den;

    if (o.titleHit?.(it)) score = Math.min(1, score + 0.05);
    return { ...it, r, t, c, score };
  }).sort((a, b) => b.score - a.score);
}
```

---

## 11. 统一字段映射与降级矩阵

### 11.1 统一候选记录

```ts
interface UnifiedWork {
  source: 'openalex'|'crossref'|'arxiv'|'s2'|'ads';
  sourceId: string;
  doi?: string;
  arxivId?: string;
  title: string;
  abstract?: string;
  authors: string[];
  venue?: string;
  year?: number;
  publishedDate?: string;   // ISO YYYY-MM-DD
  citations?: number;       // 缺失表示未知
  isOpenAccess?: boolean;
  oaUrl?: string;
  relevanceRaw?: number;
  relevanceRank: { rank: number; total: number };
}
```

### 11.2 字段映射表

| UnifiedWork | OpenAlex | Crossref | arXiv | S2 | ADS |
|---|---|---|---|---|---|
| `doi` | `doi`（剥 `https://doi.org/`） | `DOI` | `arxiv:doi`（缺失常见） | `externalIds.DOI` | `doi` |
| `arxivId` | `ids` 内 arXiv | — | `id`（`arxiv.org/abs/...`） | `externalIds.ArXiv` | `identifier` 内 `arXiv:...` |
| `title` | `title` | `title[0]` | `<title>` | `title` | `title` |
| `authors` | `authorships[].author.display_name` | `author[]` | `<author><name>` | `authors[].name` | `author[]`（"Last, First"） |
| `venue` | `primary_location.source.display_name`（校验 type） | `container-title[0]` | `arxiv:journal_ref`（可选） | `venue` | `pub` |
| `year` | `publication_year` | `published.date-parts[0][0]` | `<published>` 前 4 位 | `year` | `year` |
| `publishedDate` | `publication_date` | `published.date-parts`（可能仅年月） | `<published>` | `publicationDate` | `pubdate`/`date` |
| `citations` | `cited_by_count` | `is-referenced-by-count` | **无** | `citationCount` | `citation_count` |
| `abstract` | 倒排索引还原 | JATS 清洗 | `<summary>` | `abstract` | `fl=abstract` |
| `isOpenAccess` | `open_access.is_oa` | 不可靠（无统一字段） | 恒 true | `openAccessPdf` 是否存在 | `property` 含 `OPENACCESS` |
| `relevanceRaw` | `relevance_score` | `select=score` | 无 | 无 | 无（用原生排序） |

### 11.3 降级矩阵（字段缺失时）

| 缺失项 | 处理 |
|---|---|
| 相关性数值 | 用来源内排名归一 `r = 1-(i-1)/(n-1)`；若来源未按相关性返回（不应发生），先按本地相似度（标题 token 重合率）排序再归一 |
| `publishedDate` | 用 `year` 按 7 月 1 日估算；再缺失 → `t=0.5` |
| `citations` | 引用项权重剔除并归一化（10.3）；不按 0 分处理 |
| 摘要 | 不影响排序，只影响展示；不为摘要额外发请求 |
| 期刊名 | 用 `publisher` 或留空；不要把仓储名当期刊（OpenAlex 实测坑） |
| DOI | 用 `title+year` 去重；引用导出不可用，改为展示纯文本引用 |
| 内容协商失败 | Crossref `/works/<doi>` → OpenAlex `/works/https://doi.org/<doi>` → 显示链接 |

### 11.4 与“译名核验”的结合

- 结果卡片上展示 NADC 权威译名（`en2zh` 精确命中）+ 依据书目 + 最后修订年份。
- 若论文标题含 NADC 词条（英文），可自动高亮对应中文名，帮助中文用户读英文文献。
- NADC 匹配只影响**展示与核验**，不进入文献排序分（NADC 无相关性/引用/发布时间信号）。

---

## 12. 未验证清单（务必在实现/验收时保留“未验证”标注）

| # | 项目 | 现状 |
|---|---|---|
| 1 | NADC 官方速率限制/服务条款 | 站点无相关文档；仅实测 8 连发无 429 |
| 2 | NADC 是否存在任何已发布“词源”数据 | 12 个抽样词条词源为空（`nadc.json` 的 `etymology_probe`）；`termEtymology` 是提交表单 → 倾向“无” |
| 3 | NADC 缩写模糊检索 | `fuzzy?word=AGN` 返回 100 条噪声，不可用；仅 precise 可用 |
| 4 | OpenAlex 401/429 的确切语义与额度核算细节 | 实测额度耗尽返回 401；官方文档只给单价、未逐条说明错误码 |
| 5 | OpenAlex 中文检索质量 | 未实测中文 `search=` 效果（插件应走“NADC 译英 + Crossref 中文题录”） |
| 6 | Crossref `rows` 上限 | 未实测（常见说法 1000，本次未验证） |
| 7 | Crossref 内容协商/中文 metadata 覆盖率 | 仅抽样 1 个中文查询 |
| 8 | Semantic Scholar key 模式下的限额与字段 | 无 key，未验证 |
| 9 | ADS 参数 (`fl`/`sort`/`rows=2000`) 的真实调用 | 无 token，仅来自官方 OpenAPI 规范；`5000/天` 来自仓库 README |
| 10 | ADS 官方文档站内容 | 被 AWS WAF 拦截（HTTP 202 空页），未读到 |
| 11 | CNKI 学位论文筛选 URL 参数 | `dbcode=CDMD` 无效；`type=学位论文` 存疑 → 未验证 |
| 12 | CNKI `search.cnki.com.cn/robots.txt` | 25~30s 超时，未取得 |
| 13 | DataCite DOI（Zenodo 等）内容协商 | 未测试 |
| 14 | arXiv `start` 深分页稳定性 | 仅测首屏 |
| 15 | 各来源数据在插件发布时是否仍一致 | 数据会变，`request-log.json` 有 2026-10-21 的时间戳 |

---

## 13. 证据文件说明（research/probes/）

| 文件 | 内容 |
|---|---|
| `nadc.json` | 4 词 × fuzzy/precise 行数与 top5、6×2 边界用例、robots 原文、wordscandidate、3 个详情页字段、12 词条词源抽样（全空）、zip 元数据与解包统计（行数/`全称`条数/样本行）、频率与 UA 探测 |
| `openalex.json` | 8 条最小字段样本（含 8 条完整记录）、三种排序实测、`select=relevance_score`、无 search 排序 400 原文、组合 filter、分页/计费/mailto 记录 |
| `crossref.json` | 3 条含 JATS 摘要与 score 的样本、三种排序、无效 select 400 原文、中文检索、polite/public 池响应头、cursor 翻页 |
| `s2-arxiv-ads.json` | S2 首次 200 样本 + 7 次 429、arXiv 两种排序条目与 Atom 字段、5 组 search_query 测试、ADS 401 两种错误、官方 OpenAPI 参数表 |
| `cnki.json` | kns robots 全文、302→安全验证、知网空间 200 页面信息、学位论文参数探测（md5 对比）、合规结论 |
| `doi-negotiation.json` | 2 DOI × 3 格式实测、Crossref/OpenAlex 按 DOI 降级查询 |
| `request-log.json` | 最终采集轮 64 条请求的 name/url/http/content-type/bytes 清单 |

> 复现：任意 HTTP 客户端直接访问上表 URL 即可；NADC zip 的 sha256 已记录，可用于校验版本。
