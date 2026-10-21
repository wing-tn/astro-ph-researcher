# 提示词 skill：文献、代码、英文期刊、学位论文与写作目标

> 版本：v1.0.0
> 位置：`skills/`，随插件通过 `ctx.skills.register` 注册到 DSH 会话技能目录。

---

## 1. 八个 skill

| skill | 何时加载 | 核心内容 |
|---|---|---|
| `astro-literature-research` | 检索/综述天文文献、核对原始出处、写引言/组会文献、查证术语 | 六步工作流；SciX/ADS/arXiv/OpenAlex/Crossref/CNKI 分工；ADS/SciX 检索式；去重与证据分级；精读模板；文献库字段；禁止编造 |
| `astro-code-writing` | 把观测/模拟数据做成分析脚本、复现论文方法、拟合/MCMC、检查代码单位与统计 | 数据契约；pyenv 环境；项目结构；astropy 单位/常数；筛选与 Malmquist；统计/收敛；PDF 图表/色盲；测试；复现 |
| `astro-english-journal-writing` | 投英文天文期刊、写/改标题摘要引言方法结果讨论、按审稿意见返修 | US/UK 语言标准；选刊与模板；标题/摘要/关键词；各节写法；图表；引用一致性；修订与 AI 腔清理；门禁 |
| `astro-phd-thesis-writing` | 写/改硕士博士学位论文、开题/章节/创新点/综述/摘要/查重盲审答辩 | 学校格式+年份版本；章节骨架与字数；≤3 创新点；主题式综述；GB/T 7714-2015；中英文摘要；答辩/伦理 |
| `astro-writing-goals` | 不确定论文目标/叙述风格 | 10 个目标选择器；证据门槛；标题/摘要；期刊匹配 |
| `astro-discovery-writing` | 首次发现/确认/多信使 | 5σ/独立校验；关联显著性；替代解释 |
| `astro-critical-writing` | 批判/反驳/零结果 | 先复现；统计/背景/假设定位；克制语气 |
| `astro-incremental-method-writing` | 增量/方法/巡天/理论/综述 | 诚实增量；基线；选择函数；可证伪 |

文件：
- `skills/astro-literature-research/SKILL.md`
- `skills/astro-code-writing/SKILL.md`
- `skills/astro-english-journal-writing/SKILL.md`
- `skills/astro-phd-thesis-writing/SKILL.md`

---

## 2. 格式

每个 `SKILL.md`：

```markdown
---
name: astro-english-journal-writing
description: "一句话说明何时加载"
whenToUse: "具体场景"
metadata:
  domain: astronomy
  language: zh
---

# 标题
...
```

- `name` 必须与目录名一致、kebab-case。
- `description` 是目录里显示的一句话。
- 正文是按需加载的完整 SOP；不要在会话开始就全文注入。

---

## 3. 加载与执行

- DSH 在相关任务出现时自动加载；用户也可显式调用。
- 加载后按 skill 的步骤执行，不要跳步；尤其是“先框架后写作”和“引用可核验”。
- 与工作台工具的关系：
  - 文献研究 → `astro_literature_search`、`astro_term_lookup`、`astro_reference_*`
  - 代码 → `pyenv_*`、shell、`astro_reference_cite`
  - 英文期刊/学位论文 → `astro_writing_project`、`astro_writing_handoff`、`astro_format_library`、`astro_reference_cite`

---

## 4. 维护规则

- 修改 skill 正文后，DSH 技能目录会热更新（文件监视）；若未生效，刷新页面或重启 DSH。
- 不要编造期刊模板、学校格式、DOI、基金号；不确定就写“未验证/需用户确认”。
- 期刊/高校格式数据更新时，同步更新 `data/journals.seed.json` / `data/thesis-formats.seed.json` 与对应 `research/` 报告。
- 新增 skill 时，目录名与 frontmatter `name` 必须一致；主机启动扫描 `skills/` 并注册。

---

## 5. 与用户原始要求的对应

| 用户要求 | 落在哪里 |
|---|---|
| 文献来源 SciX/ADS/arXiv/期刊/知网 | `astro-literature-research` + 文献库字段 |
| 前三位作者/ORCID/单位/卷期页/DOI | 文献库数据模型 + `astro_reference_save` |
| 分析总结/可引用内容 | `summary` / `keyResults` 字段 |
| 领域/关键词分类、用户可改 | `tags.fields/keywords/collections` + UI 编辑 |
| 引用格式/BibTeX | `astro_reference_cite/export` + 文献库 UI |
| 上传研究结果（多文件、可选 DSH 分析） | 写作项目 `files` + `astro_writing_project` |
| 选 SCI 期刊/Overleaf 模板 | 期刊格式库 + 写作目标链接 |
| 中国高校学位论文格式/年份版本 | 高校格式库 + 自定义格式包 |
| 英文期刊/学位论文写作框架 | `astro-english-journal-writing` / `astro-phd-thesis-writing` |
| 代码规范 | `astro-code-writing` |
| 文献研究规范 | `astro-literature-research` |
