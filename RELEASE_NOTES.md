# astro-ph-researcher v2.0.0

**发布日期**：2026-10-22  
**许可**：MIT  
**作者**：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）

## 这是什么

面向天文学生与研究者的 DSH / Codex 工作台：

- NADC 审定术语核验 + 本地术语本；
- 文献检索、参考文献库与 BibTeX/APA/GB 7714 引用；
- 14 个天文期刊 + 21 个中国高校/中科院院所学位论文格式；
- 10 种目标感知写作风格（发现/确认/反驳/增量/上限/方法/巡天/理论/多信使/综述）；
- 学位论文格式/模板本地抓取、上传与 DOCX/TXT/ZIP 解析；
- 27 个数据处理方法 + 9 条统计原理；
- 30 个观测设施的数据、软件与工作流入口；
- 8 个 Agent Skills，DSH 与 Codex 双版本；
- 方法/统计/术语公式用本地 KaTeX 编译显示，每个公式可复制 LaTeX 源码。
- 逐节写作、6 维评分、作者确认台账、文件格式百科、物理书目、3ML/AM³/SED/DS9 引导。
- 术语公式增至 15 个；公式资源支持 HEAD/自检/失败回退。

## 安装

```bash
git clone https://github.com/hyperskysail/astro-ph-researcher.git
cd astro-ph-researcher
dsh plugin --profile desktop add .
```

完全重启 DSH 后，侧栏出现「天文术语」；设置页显示 `astro-ph-researcher v2.0.0`。

## 从旧版升级

- 新包名：`astro-ph-researcher`。
- 首次启动自动把 `$DSH_HOME/astro-words` 迁移到 `$DSH_HOME/astro-ph-researcher`。
- 旧 DSH bundle `dsh-astro-words` 需要卸载；旧 Codex 插件也需要移除后重装。
- 路由改为 `/api/astro-ph-researcher/*`；工具名 `astro_*` 保持不变。

## 验证

```bash
npm test
```

覆盖：术语/词表、文献库、写作项目、8 个 skill、数据方法/设施、格式抓取、迁移、Host、Client。

## 已知边界

- 示例论文只作写作结构参考，不是引用许可；DOI 使用前请核验。
- PDF/DOC 格式材料需要 DSH 阅读；插件不内置 PDF 文字抽取。
- 部分高校格式需登录/验证码，插件不绕过；请手动下载后上传。
- 写作风格是修辞结构归纳，不保证审稿结果。
- 当前本地优先，无服务器依赖。

## 支持

免费、开源、不盈利。自愿打赏入口见 [SUPPORT.md](SUPPORT.md)；功能不设付费墙，打赏不购买优先支持或任何权利。

## 校验

```text
dist/astro-ph-researcher-1.0.0.zip
dist/SHA256SUMS
```

下载后：

```bash
sha256sum -c SHA256SUMS
```
