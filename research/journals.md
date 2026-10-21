# 天文期刊数据核验报告（journals.seed.json）

- 核验日期：2026-10-22
- 数据文件：`data/journals.seed.json`（14 个期刊，UTF-8，`python3 -m json.tool` 通过）
- 核验环境：WSL2 Linux + `curl 8.5.0` + `python3 3.12.3`（Windows pwsh 沙箱不可用，全部实测在 WSL 内完成）
- 记录原则：只记录 HTTP 状态与要点摘要，不转载出版商指南正文；所有未能直连确认的项写“未验证”，不编造 URL、模板或图表规格。

## 0. 结论速览

| id | 期刊 | homepage | 作者指南 | Overleaf 模板 | verified |
| --- | --- | --- | --- | --- | --- |
| apj | ApJ | 200 → Radware 验证页 | 连接超时 | 200（AAS 官方） | false |
| aa | A&A | 403（DataDome） | 403（DataDome） | 200（社区模板） | false |
| raa | RAA | 200 | 200 | 200（社区模板） | **true** |
| mnras | MNRAS | 403（Cloudflare） | 403（Cloudflare） | 200（OUP 官方） | false |
| prl | PRL | 403（Cloudflare） | 403（Cloudflare） | 200（APS 官方） | false |
| prd | PRD | 403（Cloudflare） | 403（Cloudflare） | 200（APS 官方） | false |
| jheap | JHEAP | 403（ScienceDirect） | 403（ScienceDirect） | 200（elsarticle，非官方标注） | false |
| cpc | CPC | 200 | 200 | 未找到官方模板 | **true** |
| universe | Universe | 403（Akamai） | 403（Akamai） | 200（MDPI 官方） | false |
| nature | Nature | 301 → nature.com | 200 | 200（Springer Nature 官方） | **true** |
| science | Science | 403（Cloudflare） | 403（Cloudflare） | 200（社区模板） | false |
| aj | AJ | 200 → Radware 验证页 | 连接超时 | 200（AAS 官方） | false |
| pasp | PASP | 200 → Radware 验证页 | 留空（见 §2.13） | 200（PASP 官方） | false |
| natastron | Nature Astronomy | 200 | 200 | 200（Springer Nature 官方） | **true** |

`verified=true` 的判定标准：该刊主页/指南/模板等关键链接均取得真实 2xx 内容并读过正文；只有模板页可确认、主页或指南被反爬拦截的，一律 `verified=false` 并在 `notes` 记录状态。

## 1. 方法与环境

每条 URL 用下列命令实测（不跟随假 URL、不写死状态）：

```bash
curl -sS -L --max-time 20 -o /dev/null \
  -w "%{http_code}\t%{url_effective}\t%{size_download}\t%{content_type}" "$URL"
```

状态解读（本次实测中反复出现）：

- `200` + 正常期刊域名：真实可访问，进一步用 `python3` 抽取标题/关键段落确认内容；
- `200` + `validate.perfdrive.com`：IOPscience 的 Radware Bot Manager 人机验证页，**不是期刊内容**（ApJ/AJ/PASP 主页均如此；挑战页 `ssc` 参数回显目标 URL，可确认路径存在）；
- `403` + `Just a moment...`：Cloudflare 质询（OUP、APS、Science）；
- `403` + DataDome 脚本：A&A（aanda.org）；
- `403` + `Access Denied`：MDPI（Akamai）；ScienceDirect 同样返回 403 壳页；
- `curl: (28) Connection timed out`：`journals.aas.org` 从本机网络 TCP 不可达（DNS 可解析到 141.193.213.10/11）。

交叉验证（说明非“未认真试”）：对 OUP 指南页另用 DSH `web_fetch`（同样 403）、`api_client_request`（同样 403 + Cloudflare `cf-mitigated: challenge`）；`web.archive.org` DNS 解析失败、`r.jina.ai` 连接超时；WSL 内无可用 HTTP 代理（127.0.0.1/网关常见端口均不通），IPv6 不可用。因此被反爬域名的期刊只能 `verified=false`。

Overleaf 官方身份判定：抓取模板页 HTML，检查是否有
`This template has been approved by the publisher` 徽章及出版商标签（AAS / OUP / APS / MDPI / Springer Nature 官方模板集合）；无徽章者按“社区模板”标注。

## 2. 逐刊记录

### 2.1 ApJ — The Astrophysical Journal

- 主页 `https://iopscience.iop.org/journal/0004-637X`：HTTP 200，但最终落到 `https://validate.perfdrive.com/...` 人机验证页（14 KB 挑战页），未取得期刊内容。
- 作者指南 `https://journals.aas.org/author-instructions/`：连接超时（20 s，TCP 不可达）。
- Overleaf `AASTeX Template ...`（bpkjwktvsqwp）：HTTP 200；页面徽章 “approved by the publisher”，属 AAS 官方模板集合，覆盖 ApJ/AJ/ApJS/ApJL/PSJ/RNAAS。
- 引用风格：AASTeX 7 + natbib author-year（模板为 AAS 官方；PASP 官方模板说明 AASTeX 当前 v7.0.1）。
- 未验证：官方图表规格（依赖 AAS 作者指南，当前不可达）。
- 结论：URL 均保留官方地址但 `verified=false`；模板与引用风格可放心使用。

### 2.2 A&A — Astronomy & Astrophysics

- 主页 `https://www.aanda.org/` 与指南 `https://www.aanda.org/for-authors`：均 HTTP 403（DataDome 反爬页，769 B）。
- Overleaf `Astronomy and Astrophysics Template`（zrrywvqbqtvn）：HTTP 200；**无 publisher-approved 徽章 → 社区模板**；说明写明是 A&A 官方 aa.cls 宏包 v9.4（2026-03，下载自 aanda.org/for-authors）。
- 引用风格：aa.cls + author-year（官方指南页 403，未复核）。
- 未验证：图表规格、拼写变体（en-GB 为据欧刊惯例的推断，`notes` 已注明）。

### 2.3 RAA — Research in Astronomy and Astrophysics（verified=true）

- 主页 `https://www.raa-journal.org/`：HTTP 200（190 KB）。
- 作者指南 `https://www.raa-journal.org/sub/author/`：HTTP 200（99 KB），可读正文。
- 官方宏包页 `https://www.raa-journal.org/sub/macro/`：HTTP 200，含 `raa_twocolumn.cls`、`raa.bst`、`raa-package.tar.gz`、Data Paper 模板等。
- Overleaf `RAA (Research in Astronomy and Astrophysics) journal`（hrckxpjmngxr）：HTTP 200，**无官方徽章 → 社区模板**（说明 RAA 宏包为必需）。
- 已核要点：图/表须编号、在正文引用、按应出现位置插入；摘要 ≤200 词、关键词 ≤6 个；参考文献按作者字母序、正文 author-year（如 `(Peebles 1982, 1993, 1995)`、`Paczynski (1995a, b)`）。
- 未验证：图片分辨率/dpi/格式/字号（指南未规定）；`en-GB` 为据指南用词（colour/spelt）的推断。

### 2.4 MNRAS — Monthly Notices of the Royal Astronomical Society

- 主页 `https://academic.oup.com/mnras`：HTTP 403（Cloudflare “Just a moment...”）。
- 指南 `https://academic.oup.com/mnras/pages/General_Instructions`：HTTP 403（Cloudflare）。
- Overleaf `MNRAS LaTeX template and guide for authors`（kqnjzrwjwjth）：HTTP 200，**publisher-approved（OUP 官方）**；模板内含作者指南。
- 辅助官方页 `https://ras.ac.uk/journals/Monthly-Notices-of-the-RAS`：HTTP 200（RAS 官方 MNRAS 介绍，指向 OUP 作者指南）。
- 辅助：CTAN `mnras` 包页 200，文档 `mnras_guide.pdf` 200（mnras.cls 3.2，2023-07-20，RAS 维护）。
- 引用风格：mnras.cls + author-year（Harvard，期刊惯例；官方指南页 403 未逐字复核）。
- 未验证：图表规格。

### 2.5 PRL — Physical Review Letters

- 主页 `https://journals.aps.org/prl`、指南 `https://journals.aps.org/prl/authors`：均 HTTP 403（Cloudflare）。
- Overleaf `APS Physical Review Journals Template`（kdtxdvcpfstb）：HTTP 200，**publisher-approved（APS 官方）**；适用 Physical Review 系列。
- 辅助：CTAN `revtex` 包页 200、`revtex4-2.pdf` 200（可从 CTAN 获取 REVTeX 文档）。
- 引用风格：REVTeX + numeric（APS 惯例）。
- 未验证：图表规格、作者指南正文。

### 2.6 PRD — Physical Review D

- 同 PRL：主页/指南 403（Cloudflare）；APS 官方 Overleaf 模板 200；REVTeX 文档 CTAN 200。
- 引用风格：REVTeX + numeric；未验证图表规格与指南正文。
- 领域定位：粒子物理、场论、引力、宇宙学及天体物理交叉。

### 2.7 JHEAP — Journal of High Energy Astrophysics

- 主页/指南：`elsevier.com` 302 到 `sciencedirect.com`，最终 HTTP 403（ScienceDirect 壳页，832 KB）。
- Overleaf `Elsevier Article (elsarticle) Template`（vdzfjgjbckgz）：HTTP 200；**页面无 publisher-approved 徽章 → 按社区/通用模板处理**，非期刊专属。
- 辅助：Elsevier 官方 LaTeX 说明页 `https://www.elsevier.com/en-xs/researcher/author/policies-and-guidelines/latex-instructions`：HTTP 200（可读，含 elsarticle 使用说明）。
- 引用风格：elsarticle.cls + numeric（Elsevier 默认）；语言/图表规格未验证（sciencedirect 403）。

### 2.8 CPC — Chinese Physics C（verified=true）

- 主页 `https://cpc.ihep.ac.cn/`：HTTP 200（252 KB）。
- 作者指南 `https://cpc.ihep.ac.cn/news/Author.htm`：HTTP 200（78 KB），可读正文。
- Overleaf：未找到官方模板（亦未搜到可靠社区模板），`overleafTemplate` 留空。
- 已核要点：优先 LaTeX（也可 Word），需上传 PDF 供审；录用后编辑部按 CPC 样式排版；正文引用方括号数字（如 `[1]`）；图优先 EPS/PDF，非矢量位图 ≥300 dpi，字体嵌入，坐标轴标注清晰；正文分至少 3 个编号章节。
- 未验证：语言仅要求 English，未明确 US/UK（`en-US` 为推断）。

### 2.9 Universe — MDPI

- 主页/指南：`https://www.mdpi.com/journal/universe` 与 `/instructions` 均 HTTP 403（Akamai “Access Denied”，约 380 B）。
- Overleaf `MDPI Article Template`（fvjngfxymnbr）：HTTP 200，**publisher-approved（MDPI 官方，2022-12 版）**。
- 引用风格：mdpi.cls + numeric；具体参考文献格式需期刊 Instructions（403 未复核）。
- 未验证：图表规格、参考文献细则、拼写变体。

### 2.10 Nature（verified=true）

- 主页 `https://www.nature.com/nature`：HTTP 301 → `https://www.nature.com/`（站点改版；带 cookie 提示参数），最终 200；期刊信息页 `https://www.nature.com/nature/journal-information` 200。
- 作者指南 `https://www.nature.com/nature/for-authors`：HTTP 200；`formatting-guide` 200；`final-submission` 200。
- Overleaf `Springer Nature LaTeX Template`（myxmhdsbzkyd）：HTTP 200，**publisher-approved（Springer Nature 官方）**，Nature 系列通用。
- 已核要点：参考文献按出现顺序编号、正文用上标数字（非方括号）；拼写按 OED（en-GB）；图件电子提交，单栏 90 mm / 双栏 180 mm、版面深 170 mm，照片类 TIFF/PSD 300–600 dpi，优先矢量、勿栅格化线条文字，RGB 推荐，字体 12 pt Times New Roman；初审不交印刷级图，录用后按 final submission 指南提交；官方首选 Word，TeX/LaTeX 录用后转 Word。
- 未验证：无（以上均取自 200 页面正文）。

### 2.11 Science

- 主页 `https://www.science.org/journal/science`、指南 `https://www.science.org/content/page/science-information-authors`：均 HTTP 403（Cloudflare）。
- Overleaf `LaTeX Template for Science-family journals`（kjytmmfyxthd）：HTTP 200，**无 publisher-approved 徽章 → 社区模板**；描述指向 Science 官方 LaTeX 指南 `https://www.science.org/content/page/preparing-manuscripts-using-latex`（实测 403，未验证）。
- 未验证：全部官方要求（引用风格/图表/语言均无法从官方页确认，`citationFormat` 的 numeric 属惯例标注）。

### 2.12 AJ — The Astronomical Journal

- 主页 `https://iopscience.iop.org/journal/1538-3881`：HTTP 200 但落到 Radware 验证页（非期刊内容）。
- 作者指南 `https://journals.aas.org/author-instructions/`：连接超时。
- Overleaf：同 ApJ，AAS 官方 AASTeX 模板（bpkjwktvsqwp）HTTP 200。
- 未验证：官方图表规格；引用风格 AASTeX author-year 可依官方模板。

### 2.13 PASP — Publications of the Astronomical Society of the Pacific

- 主页 `https://iopscience.iop.org/journal/1538-3873`：HTTP 200 但落到 Radware 验证页（非期刊内容）。
- 作者指南字段留空：IOP 的 PASP 指南页受 Radware 拦截，未取得可验证 URL；ASP 官方页 `https://astrosociety.org/news-publications/pasp.html` 实测 200，正文说明“作者与投稿说明见 IOP 网站”，未直接给出指南 URL。
- Overleaf `AASTeX Template for submissions to PASP`（ytkhngjgpmty）：HTTP 200，**publisher-approved（PASP 官方）**；基于 AASTeX v7.0.1 的 sample701 修改，主文件 `PASPsample701.tex`，含准备/投稿说明；投稿系统 `https://mc04.manuscriptcentral.com/pasp` 实测 200。
- 引用风格：AASTeX 7 + author-year。
- 未验证：官方图表规格。

### 2.14 Nature Astronomy（verified=true）

- 主页 `https://www.nature.com/natastron`：HTTP 200；`aims`、`submission-guidelines`、`submission-guidelines/initial-formatting`、`submission-guidelines/writing-and-language` 均 HTTP 200。
- Overleaf：Springer Nature 官方通用模板（myxmhdsbzkyd）HTTP 200（该刊无专属模板）。
- 已核要点：初投接受 PDF/Word/TeX，TeX 需交编译 PDF；初投无需特殊排版，录用后按 formatting requirements 准备；引用/图表细则沿用 Nature 系列（编号上标、90/180 mm、300–600 dpi、RGB、12 pt）。
- 未验证：语言拼写（语言页只提供润色服务链接，en-GB 系按 Nature 系列惯例推断）；无该刊专属图表规格页（沿用 Nature）。

## 3. Overleaf 模板核验矩阵

| 期刊 | 模板 | HTTP | publisher-approved | 性质 |
| --- | --- | --- | --- | --- |
| ApJ / AJ | AASTeX Template for submissions to AAS Journals | 200 | 是（AAS 官方） | 官方 |
| PASP | AASTeX Template for submissions to PASP | 200 | 是（PASP 官方） | 官方 |
| MNRAS | MNRAS LaTeX template and guide for authors | 200 | 是（OUP 官方） | 官方 |
| PRL / PRD | APS Physical Review Journals Template | 200 | 是（APS 官方） | 官方 |
| Universe | MDPI Article Template | 200 | 是（MDPI 官方） | 官方 |
| Nature / Nature Astronomy | Springer Nature LaTeX Template | 200 | 是（Springer Nature 官方） | 官方（出版社级通用） |
| A&A | Astronomy and Astrophysics Template（aa.cls v9.4） | 200 | 否 | 社区模板，非官方 |
| RAA | RAA (Research in Astronomy and Astrophysics) journal | 200 | 否 | 社区模板，非官方；官方宏包在 raa-journal.org |
| JHEAP | Elsevier Article (elsarticle) Template (v3.4c) | 200 | 否 | 通用模板，未标注官方 |
| Science | LaTeX Template for Science-family journals | 200 | 否 | 社区模板，非官方 |
| CPC | — | — | — | 未找到官方/可靠模板 |

## 4. 未验证项与限制

1. 以下官方页面被反爬拦截，未取得正文：A&A（403 DataDome）、MNRAS（403 Cloudflare）、PRL/PRD（403 Cloudflare）、JHEAP（403 ScienceDirect）、Universe（403 Akamai）、Science（403 Cloudflare）、ApJ/AJ/PASP 的 IOP 主页（Radware 验证页）与 AAS 指南站（连接超时）。
2. 因此这些期刊的 `figureRequirements` 写“未在可访问的官方页面找到明确要求”，未做任何猜测；`verified=false`。
3. PASP 的 `authorGuidelines` 留空；其官方 Overleaf 模板已包含准备/投稿说明（200）。
4. 引用格式中 A&A/MNRAS/PRL/PRD/JHEAP/Universe/Science 的取值来自期刊/出版社惯例与官方模板，未逐字对照作者指南；RAA/CPC/Nature/Nature Astronomy 的引用事实已从 200 页面读数。
5. 语言变体：A&A（en-GB）、RAA（en-GB）、CPC（en-US）、Nature Astronomy（en-GB）为依页面用词/系列惯例的推断，`notes` 均注明“推断/未逐字确认”。
6. 未找到官方 Overleaf 模板的期刊：CPC；RAA/A&A/Science/JHEAP 只有社区或通用模板，已明确标注“非官方”。

## 5. 与写作工作台的数据契约

`lib/writing.js` 读取 `data/journals.seed.json` 的 `journals[]`，实际使用字段：`id`、`name`、`abbrev`、`authorGuidelines`、`overleafTemplate`、`citationStyle`（`buildProjectPrompt` 会拼进写作提示词）。本文件额外提供 `publisher`、`scope`、`citationFormat`、`figureRequirements`、`language`、`verified`、`verifiedAt`、`notes`，前端/后续工具可直接消费；字段缺失时 `lib/writing.js` 会回退到内置 4 条 FALLBACK_JOURNALS。

## 6. 复测方法

```bash
cd /mnt/f/dsh插件/astro-words
python3 - <<'PY'
import json
d=json.load(open('data/journals.seed.json',encoding='utf-8'))
print(len(d['journals']))
PY
python3 -m json.tool data/journals.seed.json > /dev/null && echo "JSON OK"
# 逐 URL 复测示例
curl -sS -L --max-time 20 -o /dev/null -w '%{http_code} %{url_effective}\n' https://www.raa-journal.org/
```

## 7. 版权说明

本报告与 `journals.seed.json` 只保存链接、HTTP 状态与要点摘要（≤1–2 句/项），未复制出版商指南正文、模板源码或图表规范原文；引用/图表要求以链接指向的官方页面为准。
