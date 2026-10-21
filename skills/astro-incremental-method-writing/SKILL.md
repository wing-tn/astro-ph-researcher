---
name: astro-incremental-method-writing
description: "跟进增量、方法/软件/管线、巡天星表、理论模型与综述观点论文的写作规范：诚实承认增量、可复现基线、选择函数与可证伪预言。"
whenToUse: "用户要写 follow-up/更大样本/改进测量、方法或软件论文、巡天/星表/数据发布、理论解释或综述时加载。"
metadata:
  domain: astronomy
  language: zh
---

# 增量、方法、数据与理论写作

## 1. incremental（跟进/增量）

**核心**：明确“相对谁，增量是什么，为什么重要”。  
标题：`An improved measurement of X with Y` / `Extending X to Y`。  
摘要：先前结果 → 新增数据/方法 → 改进量 → 与先前一致/不一致 → 新物理含义。  
引言：先前工作与遗留问题 → 为什么现在能改进 → 本文增量。  
结果：先对齐先前结果，再展示改进；给误差预算与新参数空间。  
红线：增量不足；没有与先前结果对齐；把增量包装成 first discovery。

## 2. method-software（方法/软件/管线）

标题：`X: an open-source tool for Y` / `A method for X in Y`。  
摘要：问题 → 工具/方法 → 相对基线改进 → 验证 → 获取方式。  
方法：设计/算法/依赖/版本；结果：正确性、基准、真实案例、失败模式。  
必须：公开代码/环境/版本；至少一个基线；写失败模式与适用范围。  
红线：无基线；只展示成功案例；不可复现；把工具论文写成科学结果论文。

## 3. survey-catalog（巡天/星表/数据发布）

标题：`The X survey: data release and catalog` / `A catalog of X from Y`。  
摘要：数据来源 → 样本/选择 → 规模/覆盖 → 验证/纯度 → 访问方式。  
结果：选择函数、完备度/纯度、交叉验证、数据格式/版本。  
必须：选择函数；与其他目录交叉验证；数据访问与版本。  
红线：没有选择函数；宣称 complete；把星表当科学结论；链接失效。

## 4. theory-model（理论/模型）

标题：`X as evidence for Y: a model` / `A model for X and its predictions`。  
摘要：观测问题 → 模型 → 关键预言/拟合 → 与替代模型区别 → 可检验性。  
方法：假设、近似、参数空间、简并；结果：与观测比较、敏感性；讨论：替代解释与可证伪预言。  
红线：不可证伪；参数过多；忽略替代模型；把拟合当解释。

## 5. review-perspective（综述/观点）

标题：`X: a review` / `Progress and open questions in X`。  
摘要：范围 → 综合方法 → 共识/争议 → gap → 路线图。  
正文按主题组织，不按时间罗列；每个争议呈现双方证据；结尾给可执行问题与数据/工具需求。  
红线：文献罗列无结构；只引支持自己的文献；把少数结果写成共识；未来方向空泛。

## 6. 通用检查

- [ ] 增量/方法/数据/理论的“价值句”能否用一句话说清？
- [ ] 是否给基线/选择函数/替代模型/失败模式？
- [ ] 标题是否准确反映增量，而不是夸大？
- [ ] 数据/代码/版本是否可复现？
- [ ] 是否引用了先前工作和原始文献，而不是只引综述？
- [ ] 结论是否超出样本/参数空间？

## 7. 工具

- `astro_writing_goal`：incremental / method-software / survey-catalog / theory-model / review-perspective。
- `astro_writing_project(goalId=...)`；`astro_writing_handoff(mode="outline|draft|audit")`。
- 结构示例：emcee（DOI 10.1086/670067）、Gaia DR3（DOI 10.48550/arXiv.2208.00211）、CatNorth（10.3847/1538-4365/ad2ae6）。引用前核验。
