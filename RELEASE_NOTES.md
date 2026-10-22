# astro-ph-researcher 3.4.0

发布日期 / Release date：2026-10-22

## 中文

3.4.0 补齐 Codex 可视化工作台，使写作、新手路径等功能可以从网页访问，同时保留 DSH 和原 skills。

- 新增写作项目、10 章节编辑器、真实材料/文本导入、目标格式参考、启发式检查、作者确认、论文 Markdown 和写作交接。
- 新增新手九步路径进度、研究计划依赖图式任务、方法/统计/设施/工具库、跨学科检查和汇报 Markdown。
- 新增中英文界面切换，记住语言偏好；提供英文新手配套内容及英文安装/启动入口，保留科学原始资料语言。
- 新增可分发的 Codex 项目顶栏操作按钮配置及安装器；保留用户项目原设置，不再把置顶聊天视作插件入口。
- 保留文献多源检索、标识符核验、来源快照、阅读笔记、版本去重与导出。
- 新增完整工作区备份、13 项 UI/接口测试和跨平台 CI 配置。
- 补充版权、AIGC、免责、非盈利与致谢声明；设置页可查看和下载，用户反馈 QQ 交流群为 1126615665。保留原 MIT 许可。

升级前备份阅读库和工作区。新文件为 `ui/local-data/workbench.json`；原 `library.json` 可继续使用。DSH 数据不会自动迁移或覆盖。

本版不注册全局 Codex 侧栏入口；原生按钮依赖用户项目的 `.codex/environments/environment.toml`，显示位置为受支持桌面版的顶栏。按钮配置和命令已测试，主机实际发现/显示需要安装后验证。网页不调用模型，PPTX 仍由后续演示文稿工具制作。

## English

Version 3.4.0 adds a bilingual local Codex workbench while preserving the original DSH integration and nine skills.

- Writing projects, ten section editors, source materials/text import, target metadata, heuristic checks, explicit author review, Markdown manuscript export and Codex handoff prompts.
- A nine-step learning path with saved progress, a dependency-aware research plan, methods/statistics/facility libraries, research checks and Markdown presentation outlines.
- English/Chinese interface switching, English companion learning content, and English launch/action installers.
- Shareable native Codex **project top-bar actions** with an installer that preserves existing project settings. This is not a global sidebar entry and does not depend on a pinned chat.
- Retained literature search, DOI/arXiv record checks, provenance, reading notes, version deduplication and exports.
- Workspace backups, thirteen UI/API tests and a Windows/Linux Node 22/24 CI workflow.
- Updated copyright, AIGC, disclaimer, non-profit and acknowledgment statements in the package and About section. User feedback QQ group: 1126615665. The original MIT License is retained.

Back up local stores before upgrading. Detailed scientific source material retains its original language. Heuristic scores do not validate science, record lookup does not prove peer review, and writing/slide workflows prepare prompts rather than silently calling a model. Action UI availability depends on the desktop host; it requires a supported project environment.

## 下载与安装 / Downloads and installation

| 文件 / Asset | 用途 / Purpose |
| --- | --- |
| `astro-ph-researcher-3.4.0-dsh.zip` | 完整 DSH bundle，含原宿主/客户端、skills、资料与 Codex 目录 / Complete DSH bundle with Codex sources retained |
| `astro-ph-researcher-3.4.0-codex-zh.zip` | 独立 Codex 插件，默认中文 / Standalone Codex plugin, Chinese default |
| `astro-ph-researcher-3.4.0-codex-en.zip` | 同一 Codex 插件，英文入口、按钮和说明 / Same Codex plugin with English defaults |
| `astro-ph-researcher-3.4.0-source.zip` | 完整源码，与 DSH ZIP 内容相同 / Complete source, same contents as the DSH ZIP |
| `SHA256SUMS.txt` | 安装包与独立说明文档的 SHA-256 校验 / Checksums for packages and documentation |

DSH：解压后进入含 `package.json` 的目录，运行 `dsh plugin --profile desktop add .`，完全退出并重启 DSH。若使用 `web` profile，请替换该参数。Windows 本地安装回退见仓库的 `docs/INSTALL-DSH.md` 或附件 `INSTALL-DSH.md`。

Codex：解压独立包，在该包目录按本机 CLI 支持的命令运行 `codex plugin marketplace add .`，再运行 `codex plugin add astro-ph-researcher@astro-ph-researcher-local`。使用根目录 `start-ui.cmd` / `start-ui-en.cmd` 启动工作台，使用 `install-button-zh.cmd` / `install-button-en.cmd` 为所选项目安装操作按钮。完整源码中的相应文件在 `codex/` 下。详见附件 `README.md` / `README.en.md` 和包内指南。

For DSH, extract the complete bundle, run `dsh plugin --profile desktop add .` from its project folder, and fully restart DSH. For standalone Codex packages, add the extracted folder as a local marketplace, install `astro-ph-researcher@astro-ph-researcher-local`, and use the included launch/action installers. Back up your data before replacing an older installation.

The original 3.3.0 release notes are retained in [docs/releases/3.3.0.md](docs/releases/3.3.0.md).
