---
name: astro-research-workflow
description: "v2 研究/写作流程：文献与章节评分、逐节写作、作者本人确认、物理书目、文件格式（FITS/Fermi XML 等）、3ML/AM³/SED/DS9 引导与公开源表。"
whenToUse: "用户要按章节推进论文、给文献/章节打分、作者确认、查文件格式、使用 3ML/AM³/SED/DS9 或公开源表时加载。"
metadata:
  domain: astronomy
  language: zh
---

> **Codex 适配说明（与 DSH 版的差异）**
> 本 skill 原文面向 DeepSeek Harness（DSH）。在 Codex CLI 中，`astro_*`、`pyenv_*`、`dsh-*` 等 DSH 工具名不可直接调用；请用本插件自带的 `node scripts/astro-cli.mjs` 查询本地 `data/`，用系统 Python/venv 代替 `pyenv_*`，用仓库文件代替 DSH 侧栏操作。不要伪造工具调用或数据；数据来源、引用边界和写作门禁与原文一致。


# 研究流程与作者确认

## 1. 评分是辅助，不是判决

- 文献 6 维：相关性、证据、方法、可复现、发表可信度、时效。
- 章节 6 维：主张-证据、引用、一致、可复现、风格、语言。
- 每项必须给理由；作者可覆盖；分数不能替代物理检查/同行评审。
- 无来源、无数字、无引用的章节会被标 blocker，不要硬写。

## 2. 逐节写作

```text
todo → ai_draft → author_editing → needs_evidence
→ ready_for_review → author_confirmed → locked
```

只写当前节：

1. 选目标期刊/学校 + 写作目标；
2. 上传结果文件/参考文献；
3. 逐节起草；
4. 作者在 DSH 中手动改；
5. 保存 → 评分 → 检查；
6. 作者本人勾选四项并确认；
7. 内容改变 → 确认自动失效。

**AI 不能代替作者点确认。**

## 3. 作者确认四项

- 数字/单位/图已核对；
- 引用已核验、无虚构 DOI；
- 主张有证据、不超出数据；
- 写作目标/格式已应用。

确认记录包含 contentHash、rubricVersion、评分快照、时间、备注。导出/审计时保留。

## 4. 文件格式

优先查 `astro_file_format`：

- FITS 图像 / BINTABLE / 事件表 + GTI；
- PHA / RMF / ARF / IRF；
- **Fermi XML 是源模型，不是事件表**；
- VOTable / ECSV / WCS / HDF5 / ASDF / NetCDF。

检查：HDU/EXTNAME、BUNIT/BSCALE、WCS/历元、EXPTIME、GTI、响应版本。

## 5. 分析工具

- **3ML**：time-energy / joint fit；检查时间标签、响应、背景、模型比较。
- **AM³**：轻子-强子时变模拟；参数简并强，需扫描/不确定度。
- **SED Builder**：多波段 SED；单位/消光/来源。
- **DS9**：本地 FITS 查看；插件不控制 GUI。
- **Geant4 / GENT4**：GENT4 具体指代需确认。
- 插件不打包/不自动运行重型程序，不绕过数据权限。

## 6. 公开源表

Fermi 4FGL/3FHL、Swift/XRT、Chandra、XMM、Gaia、SDSS、NED/SIMBAD/VizieR。  
只走官方 API/TAP/VizieR；缓存版本/许可/坐标历元；交叉匹配报半径/误差/误配率。

## 7. 工具

- `astro_literature_score`
- `astro_section_workflow`
- `astro_author_status`（只读；确认只能由客户端按钮）
- `astro_file_format`
- `astro_physics_reference`
- `astro_research_guide`

规则：没有数据就写“缺什么”，不编造光谱、能谱、引用或确认记录。
