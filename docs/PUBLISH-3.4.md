# 发布 astro-ph-researcher 3.4.0 到 GitHub

本文件记录 3.4.0 的可重复发布步骤。安装包与说明可由作者在 GitHub 登录后发布；实际发布结果以仓库提交、标签和 Release 页面为准。

## 上传前

1. 将完整源码包解压后与仓库合并，保留 `.agents/`、`.codex/` 和 `codex/.codex-plugin/` 等隐藏目录。
2. 确认 `package.json`、`VERSION`、`CITATION.cff`、`lib/index.js`、`codex/.codex-plugin/plugin.json`、`codex/ui/package.json` 都为 3.4.0。
3. 不上传 `codex/ui/local-data/`、个人 Markdown/JSON 备份、日志或按钮安装器生成的 `.bak`。源码 `.gitignore` 与打包脚本都已排除这些内容。
4. 运行 `npm test`、`npm run test:ui`、`node codex/scripts/astro-cli.mjs stats`。CI 已配置 Windows/Linux × Node 22/24；本机只验收 Windows，等待 GitHub 实际运行其他组合。
5. 在至少一个 Codex 桌面版项目中检查顶栏操作配置的实际显示；按钮模板和启动命令已测试，但当前会话无法代替每个宿主版本的 UI 验收。

## 发布内容

- 标题建议：`astro-ph-researcher v3.4.0 — Bilingual Codex Research Workbench`
- 标签建议：`v3.4.0`。
- Release 正文可采用根目录 `RELEASE_NOTES.md`。
- 附件包括 DSH 完整安装 ZIP、完整源码 ZIP、Codex 中文默认独立包 ZIP、英文默认独立包 ZIP、RELEASE_NOTES/README/README.en/INSTALL-DSH/DISCLAIMER 说明和 SHA256SUMS.txt。
- DSH 包与源码包内容相同，均保留原宿主/客户端及 Codex 目录；单独命名便于用户选择。
- 发布前可运行 `scripts/package-release.ps1` 重新生成附件；它会排除个人运行数据，并将英文包默认入口与说明改为英文。
- 图片使用 `docs/images/workbench-en.png` / `workbench-zh.png`（若存在交付截图）。

英文独立包采用同一程序与版本，通过英文启动入口和英文顶栏按钮默认进入 English；它不是另一个分叉插件。完整代码保留原 DSH 集成、9 个 skills 与许可证。

## 向用户说明

需要 Node.js 22+；无需 npm install。安装插件与安装项目按钮是两件事：用户选择自己的 Codex 项目目录后运行按钮安装器，重新打开项目，在顶栏使用 Open Astro Workbench。不要承诺安装 skill 即自动创建全局侧栏入口。保留已安装旧版的用户应先备份数据，再按本机 CLI 支持的 marketplace/cache 更新流程操作。

如果独立包作为本地 marketplace 使用，先在该包目录配置 marketplace，再安装插件。按钮引用稳定解压目录中的启动器；移动目录后需更新该操作的路径。当前脚本检测到已有 Astro 操作会保留它，避免覆盖用户修改。
