---
name: astro-critical-writing
description: "批判/反驳、零结果/上限与复现争议论文的写作规范：先复现原分析、指出具体统计/数据/假设问题、给替代解释与可接受语气，避免人身指控和过度否定。"
whenToUse: "用户认为别人结果不对、要重新分析、要写非探测/上限论文，或处理“支持/不支持”争议时加载。"
metadata:
  domain: astronomy
  language: zh
---

> **Codex 适配说明（与 DSH 版的差异）**
> 本 skill 原文面向 DeepSeek Harness（DSH）。在 Codex CLI 中，`astro_*`、`pyenv_*`、`dsh-*` 等 DSH 工具名不可直接调用；请用本插件自带的 `node scripts/astro-cli.mjs` 查询本地 `data/`，用系统 Python/venv 代替 `pyenv_*`，用仓库文件代替 DSH 侧栏操作。不要伪造工具调用或数据；数据来源、引用边界和写作门禁与原文一致。


# 批判、反驳与零结果写作

## 1. 先选对子类型

- **refutation**：能复现原分析，并定位到具体问题（统计、背景、系统误差、选择效应、假设）。
- **null-limit**：没有探测到，但能给出有物理意义的上限；不是“我们失败了”。
- **replication/confirmation**：独立数据/独立分析确认；属于 `astro-discovery-writing` 的 confirmation。

## 2. refutation 的五步

1. **中性复述原结论**：作者、数据、方法、声称的显著性与物理含义。
2. **复现原分析**：先得到与原文一致的数值/图；证明你理解它。
3. **逐项改变假设**：背景模型、噪声模型、先验、选择函数、校准、多重比较。
4. **定位差异**：指出哪一步导致差异；给原值、复现值、差值、不确定度。
5. **给替代解释与边界**：哪些原结论仍成立；哪些不成立；不能从数据判断的写“需作者确认”。

**必须区分三种表述：**

- “数据不支持该主张”（no significant evidence）
- “数据排除该参数空间”（excluded at X% confidence）
- “该主张被证明为假”（几乎不要用；需要极强证据+逻辑必然）

## 3. 语气规则

- 对事不对人：写“the analysis assumes…”, “the detection significance depends on…”，不写“作者错了/造假/动机”。
- 不用讽刺、感叹号、绝对化词。
- 先给原作者可能的合理解释，再给问题；让审稿人看到你公平。
- 结论用 “we do not reproduce / we find no significant evidence / the claimed significance is not robust”，不用 “we disprove”。

## 4. null-limit 结构

**标题**：`Upper limits on X from Y` / `A search for X in Y: no significant detection`。  
**摘要**：目标与动机 → 数据/搜索 → 上限数值与置信水平 → 与已有上限比较 → 物理含义。  
**结果**：背景模型 → 探测效率/注入测试 → 上限计算 → 系统误差。  
**讨论**：排除了哪些模型参数空间；不能排除什么；未来灵敏度。  
**红线**：没有效率/注入测试；背景估计偏差；上限置信水平不清；把上限写成探测。

## 5. 复现检查表

- [ ] 原论文的数据/版本/校准是否一致？
- [ ] 原分析的背景/噪声/先验是否被准确复现？
- [ ] 差异来自数据、管线、统计还是假设？
- [ ] 显著性是否校正 trial factor / look-elsewhere？
- [ ] 系统误差是否足以解释差异？
- [ ] 结论是否区分“不支持”与“排除”？
- [ ] 是否给原作者可执行的修正建议？

## 6. 审稿人红队

1. 你是否准确复述了原分析，而不是稻草人？
2. 你的复现是否真的独立？共享了哪些关键假设？
3. 差异是否只是软件版本/校准/选择函数？
4. 你有没有只挑对自己有利的假设？
5. 上限是否依赖背景模型？换背景会怎样？
6. 多重比较是否校正？
7. 语气是否会被读成攻击作者？
8. 哪些原结论仍然成立？
9. 你的结论是否超出数据？
10. 数据和代码是否公开到可复现？

## 7. 工具

- `astro_writing_goal(id="refutation|null-limit")`
- `astro_writing_handoff(mode="audit")`：生成主张-证据表与审稿人问题。
- 示例结构参考：Venus phosphine 独立重分析（DOI 10.1093/mnrasl/slaa187）、LIGO Scorpius X-1 上限（10.3847/1538-4357/aa86f0）。引用前核验。
