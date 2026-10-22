# 隐私说明 / Privacy

版本：3.4.0 · 更新：2026-10-22

## Codex 工作台的本地数据

默认保存在 `codex/ui/local-data/`：

- `library.json`：阅读清单、题录核验、笔记与检索快照。
- `workbench.json`：写作项目、正文、新手进度、计划和研究检查笔记。
- 浏览器语言偏好：仅保存中文/英文的选择。

`ASTRO_UI_LIBRARY` 可指定文献库文件；`workbench.json` 随其目录存放。原 DSH 版继续使用其原有数据目录，两者不会自动合并。设置中的完整备份包含上述研究内容，分享前请自行检查。

## 网络请求与模型交接

主动检索或核验时，Codex 文献窗口会把检索词或公开 DOI/arXiv ID 发送给 Crossref/arXiv。请求也会向对方暴露网络地址及常规请求头。手动点击 ADS、SciX、CNKI、NADC、期刊、设备和工具链接时，由浏览器访问相应站点，其隐私规则另行适用。原 DSH 功能的可选联网来源仍包括原配置支持的 OpenAlex、ADS 等服务。

Codex 窗口把个人笔记和手稿保存在本地，不含广告或遥测 SDK。写作与汇报按钮生成可复制的交接提示词；将其发送到 Codex 或其他 AI 服务时，用户应遵循相应服务的数据政策。导入文本文件只读取用户主动选择的文件。

## 反馈

隐私问题：1253932197@qq.com。一般反馈 QQ 交流群：**1126615665**。公开交流使用不含密钥、未公开数据或私密手稿的最小示例。

## English

The Codex UI stores reading lists, drafts, learning progress, plans and notes locally in `library.json` and `workbench.json`. The browser retains the interface-language preference. Search/verification sends the chosen query or identifier to Crossref/arXiv; manual links are handled by the browser and destination services. The local UI includes no advertising or telemetry SDK and prepares prompts rather than calling a model. Sending a handoff to an AI service is governed by that service's data policy. Backups may contain private research material.

Privacy contact: 1253932197@qq.com. General user feedback QQ group: **1126615665**.
