# DSH 安装与升级 / DSH installation — 3.4.0

下载 `astro-ph-researcher-3.4.0-dsh.zip` 并解压到稳定目录。该包是完整项目，与 `*-source.zip` 内容相同，保留原 DSH 宿主、客户端、9 个 skills 和所有随包资料，也含可独立运行的 Codex 窗口。

升级前备份当前 DSH profile 和个人研究数据。保留原数据目录；不要用安装包覆盖个人笔记或写作文件。

在解压后含 `package.json`、`cordis.patch.yml` 的目录执行：

```sh
dsh plugin --profile desktop add .
```

若你的 profile 叫 `web`，将 `desktop` 换成 `web`。完全退出并重启 DSH 后，在原「天文术语」入口查看设置中的插件版本，应显示 3.4.0。文献、写作、计划、深度、新手与 PPT 桥保留原操作方式；PPT 桥仍需要另行安装支持的 PPT 插件。

Windows 中若 DSH CLI 无法正确解析路径，可在同一目录执行原有回退安装器：

```sh
node scripts/install-local.mjs --profile desktop
```

它会备份所选 profile 的 `package.json`，建立到该解压目录的 junction（失败则复制），并登记 bundle。保留该稳定目录，避免移动后链接失效。仅在确认 profile 正确、已有数据已备份时使用。3.4.0 已通过原宿主/客户端注册与功能测试；仍需在你的实际 DSH 版本中验收加载。

## English

Extract `astro-ph-researcher-3.4.0-dsh.zip` into a permanent folder. This is the complete DSH bundle, with the original host/client, nine skills and bundled resources; it also contains the independent Codex workbench. The DSH and source ZIP archives contain the same project.

Back up your DSH profile and personal research data before upgrading. From the extracted folder containing `package.json` and `cordis.patch.yml`, run `dsh plugin --profile desktop add .`. Substitute `web` if that is your profile name. Fully quit and restart DSH, then confirm version 3.4.0 in the plugin settings.

If Windows CLI path resolution fails, the existing fallback is `node scripts/install-local.mjs --profile desktop`. It backs up the profile manifest and registers a junction or copy. Keep the extracted folder in place. Host/client registration and existing feature tests pass locally; validate loading in your own DSH host build.

Codex UI requires Node.js 22+. DSH uses its own supported runtime and profile. Full usage is in the repository README and the preserved `docs/README-before-3.4.md`. Feedback QQ group: **1126615665**.
