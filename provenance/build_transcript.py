#!/usr/bin/env python3
"""Build a readable, UTF-8 transcript from the local DSH session JSONL.

The full JSONL contains reasoning and tool output; this script keeps only:
- real user messages (source.kind == "user")
- the final assistant text of each turn (the longest text block in that turn)
No network. No writes outside provenance/.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "provenance" / "raw" / "session-418e083a.jsonl"
OUT = ROOT / "provenance" / "transcript.md"
CST = timezone(timedelta(hours=8))

IDENTITY = {
    "nickname": "天外奇航",
    "handle": "@hyperskysail",
    "email": "1253932197@qq.com",
    "address": "GXU-CN",
}
SESSION_ID = "session-418e083a-2170-4aea-a8a8-22c7bdc22945"


def iso(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000, tz=CST).isoformat(timespec="seconds")


def text_of(message: dict) -> str:
    parts = []
    for item in message.get("content", []):
        if item.get("type") == "text" and item.get("text"):
            parts.append(item["text"])
    return "\n".join(parts).strip()


def main() -> None:
    if not RAW.exists():
        raise SystemExit(f"missing raw session: {RAW}")
    events = []
    with RAW.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            event_type = obj.get("type")
            data = obj.get("data", {})
            if event_type == "user/message":
                source = data.get("source", {})
                if source.get("kind") != "user":
                    continue
                text = text_of(data.get("message", {}) or {"content": data.get("content", [])})
                if not text:
                    text = "\n".join(item.get("text", "") for item in data.get("content", []) if item.get("type") == "text")
                events.append({
                    "role": "user",
                    "seq": obj.get("seq"),
                    "time": obj.get("time"),
                    "text": text.strip(),
                })
            elif event_type == "assistant/message":
                message = data.get("message", {})
                text = text_of(message)
                if len(text) >= 100:
                    events.append({
                        "role": "assistant",
                        "seq": obj.get("seq"),
                        "turn": data.get("turn"),
                        "time": obj.get("time"),
                        "text": text,
                    })
    # Only final assistant text per turn: keep the longest assistant text for each turn.
    by_turn = {}
    for event in events:
        if event["role"] == "assistant":
            turn = event.get("turn")
            if turn not in by_turn or len(event["text"]) > len(by_turn[turn]["text"]):
                by_turn[turn] = event
    selected = [event for event in events if event["role"] == "user"] + list(by_turn.values())
    selected.sort(key=lambda item: item["seq"])

    lines = [
        "# 对话日志（可读节选）",
        "",
        f"- 会话 ID：`{SESSION_ID}`",
        f"- 会话开始：2026-10-22 00:34:14 +08:00（由会话 createdAt 换算）",
        f"- 导出时间：{datetime.now(tz=CST).isoformat(timespec='seconds')}",
        "- 身份：天外奇航（@hyperskysail，1253932197@qq.com，GXU-CN）",
        "",
        "> 本文件只保留**真实用户消息**与**每轮最终 assistant 文本**。",
        "> 原始会话 JSONL 另行保存，其中包含工具调用、推理状态与终端输出；",
        "> 本文件不复制推理过程，避免把内部思考与工具输出当作“对话内容”公开。",
        "",
        "---",
        "",
    ]
    for event in selected:
        stamp = iso(event["time"]) if event.get("time") else "时间未记录"
        if event["role"] == "user":
            lines += [f"## 用户 · {stamp}", "", event["text"], "", "---", ""]
        else:
            lines += [f"## 助手 · 第 {event.get('turn')} 轮 · {stamp}", "", event["text"], "", "---", ""]
    lines += [
        "## 归档说明",
        "",
        "当前正在进行的这一轮（审计请求）在导出时还没有最终 assistant 文本，",
        "因此本 transcript 只包含已完成的轮次；原始 JSONL 会继续由 DSH 追加。",
        "",
    ]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT} events={len(selected)} users={sum(1 for e in selected if e['role']=='user')} assistants={sum(1 for e in selected if e['role']=='assistant')}")


if __name__ == "__main__":
    main()
