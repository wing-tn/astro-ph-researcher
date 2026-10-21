# provenance

本目录保存 `astro-ph-researcher` 的创作过程记录，作者署名：**天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）**，日期 **2026-10-22**。

## 先看哪几个

1. [`PROVENANCE.md`](PROVENANCE.md)：这是什么、能证明什么、不能证明什么、如何校验。
2. [`transcript.md`](transcript.md)：可读对话节选（6 条用户消息 + 5 轮最终回复）。
3. [`DEVELOPMENT_LOG.md`](DEVELOPMENT_LOG.md)：日期、版本、测试、产物时间线。
4. [`MANIFEST.sha256`](MANIFEST.sha256)：主要文件的 SHA-256。

## 原始归档

- `raw/session-418e083a.v4.jsonl.zstd`：从 DSH 会话存储复制的原始 zstd 归档。
- `raw/session-418e083a.jsonl`：解压后的完整 JSONL（约 17 MB）。

> **隐私警告**：原始 JSONL 含工具调用、终端输出、内部推理与子智能体消息，可能含本机路径。分享前请审阅/脱敏；不要直接公开。

## 重建 transcript

需要 `zstandard`（已在工作区 `.venv` 安装；仅本地使用）：

```bash
python provenance/build_transcript.py
```

脚本只读 `raw/session-418e083a.jsonl`，只写 `transcript.md`。

## 校验

```bash
sha256sum -c provenance/MANIFEST.sha256
```

> 如果文件在生成清单之后又被编辑，校验会失败；请重新生成清单：
> `python provenance/make_manifest.py`（脚本见同目录）。

## 边界

这份记录是**本地开发证据**，不是法律公证。它能证明文件内容与本地会话记录一致；不能单独证明现实身份。需要更强证明时，走 Git commit / OpenTimestamps / Zenodo DOI / GPG 签名 / 公证。
