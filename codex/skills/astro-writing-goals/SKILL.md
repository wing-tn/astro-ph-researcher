---
name: astro-writing-goals
description: "按论文目标选择叙述风格：首次发现、独立确认、批判反驳、跟进增量、零结果上限、方法软件、巡天星表、理论模型、多信使、综述观点；给出证据门槛、标题/摘要动作、期刊匹配与可执行提示词。"
whenToUse: "用户要写或改天文论文、不确定该用 discovery / refutation / incremental / null-limit / method 等哪种叙述策略，或需要按目标调整标题、摘要、引言、结果、讨论和审稿人红队检查时加载。"
metadata:
  domain: astronomy
  language: zh
---

> **Codex 适配说明（与 DSH 版的差异）**
> 本 skill 原文面向 DeepSeek Harness（DSH）。在 Codex CLI 中，`astro_*`、`pyenv_*`、`dsh-*` 等 DSH 工具名不可直接调用；请用本插件自带的 `node scripts/astro-cli.mjs` 查询本地 `data/`，用系统 Python/venv 代替 `pyenv_*`，用仓库文件代替 DSH 侧栏操作。不要伪造工具调用或数据；数据来源、引用边界和写作门禁与原文一致。


# 论文目标与叙述风格选择器

写作风格不是“语气装饰”，而是**主张强度与证据结构的匹配**。先选目标，再写标题/摘要；不要先写漂亮句子再补证据。

## 1. 十个主流目标

| id | 目标 | 一句话姿态 | 常见期刊 |
|---|---|---|---|
| discovery | 首次发现/新现象 | 强主张，但把发现限定在数据覆盖范围 | ApJL / Nature / Science / PRL |
| confirmation | 独立确认/复现 | 审慎肯定，强调独立数据与一致性 | ApJ / MNRAS / A&A |
| refutation | 批判/反驳/重分析 | 对事不对人：先复现，再指出具体问题 | MNRAS / ApJ / A&A / RNAAS |
| incremental | 跟进/增量更新 | 诚实承认增量，价值在更准/更全/更稳 | ApJ / MNRAS / A&A / AJ |
| null-limit | 零结果/上限 | 把“没看到”转成“排除了什么参数空间” | ApJ / MNRAS / PRD |
| method-software | 方法/软件/管线 | 可复现、有基线、有失败模式 | JOSS / A&C / ApJS / PASP |
| survey-catalog | 巡天/星表/数据发布 | 选择函数、完备度、纯度、访问方式 | ApJS / A&A / AJ |
| theory-model | 理论/模型解释 | 假设透明、预言可证伪、替代模型 | ApJ / MNRAS / PRD / JCAP |
| multimessenger | 多信使/快速响应 | 关联显著性优先，物理含义其次 | ApJL / Nature / Science / PRL |
| review-perspective | 综述/观点/路线图 | 问题导向，区分共识/争议/未知 | ARA&A / Nature Reviews / Physics Reports |

## 2. 选择算法

1. **问“本文的新东西是什么”**
   - 第一次报告 → discovery
   - 独立验证别人 → confirmation
   - 指出别人不成立 → refutation
   - 沿别人工作往前一点 → incremental
   - 没探测到但排除参数 → null-limit
   - 新工具/管线 → method-software
   - 新数据产品/目录 → survey-catalog
   - 新解释/预言 → theory-model
   - 多信使联合 → multimessenger
   - 综合领域 → review-perspective

2. **问“最强主张被什么证据支撑”**
   - 5σ/贝叶斯证据 + 系统误差 + 替代解释 → discovery 才成立
   - 独立数据 + 一致性统计 → confirmation
   - 原分析可复现 + 具体错误定位 → refutation
   - 与先前结果对齐 + 改进量化 → incremental
   - 效率/背景/注入测试 + 上限 → null-limit

3. **证据不够就降级**
   `discovery → confirmation/incremental`；`refutation → null-limit`；`multimessenger 确认关联 → 仅时间/空间关联`。  
   降级不是失败，是把主张写到数据能支撑的位置。

## 3. 通用写作纪律

- 标题给“对象 + 方法/信使 + 结果”，不要只写“Studying X”。
- 摘要按“缺口 → 我们做了什么 → 关键定量结果 → 含义/限制”四段，不写文献综述。
- 引言最后一段必须明确本文贡献，不用“In this paper, we study…”空转。
- 结果先主证据，再稳健性；讨论先替代解释，再物理。
- 每个强主张都要能指向图/表/数值/引用；没有就降级。
- 引用只引真正支持该句的文献；区分“支持/扩展/反驳”。
- 英文期刊用 US/UK 学术英语；避免 AI 腔、重复连接词、每段固定长度。
- 不使用“proves”“first ever”除非证据与检索都支撑。

## 4. 提示词模板

```text
目标风格：<id>。
证据清单：<数据/图/表/统计量/系统误差/引用>。
请先给 3 个标题变体 + 摘要骨架，并标注每个强主张对应的证据；
若证据不足以支撑该风格，明确建议降级到 <更保守 id>，不要硬写。
```

## 5. 工具

- `astro_writing_goal`：list/get 目标卡；返回证据门槛、标题/摘要动作、期刊匹配、示例论文。
- `astro_writing_project`：创建项目时传 `goalId`；写作提示词自动注入风格。
- `astro_writing_handoff`：`mode=outline|draft|audit|format`；`audit` 做主张-证据表、引用意图、审稿人红队。
- 示例论文只作结构参考，引用前核验 DOI 与结论；不要照抄句子或摘要。
