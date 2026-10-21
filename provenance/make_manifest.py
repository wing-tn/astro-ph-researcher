#!/usr/bin/env python3
"""Generate SHA-256 checksums for the project's source, data, skills, docs and provenance."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "provenance" / "MANIFEST.sha256"

FILES = [
    "README.md",
    "AUTHORS.md",
    "CITATION.cff",
    "CHANGELOG.md",
    "SUPPORT.md",
    "RELEASE_NOTES.md",
    ".github/FUNDING.yml",
    "LICENSE",
    "package.json",
    "cordis.patch.yml",
    "provenance/transcript.md",
    "provenance/DEVELOPMENT_LOG.md",
    "provenance/PROVENANCE.md",
    "provenance/README.md",
    "provenance/DATE.txt",
    "provenance/build_transcript.py",
    "provenance/make_manifest.py",
    "provenance/make_archive.py",
    "provenance/raw/session-418e083a.v4.jsonl.zstd",
    "provenance/raw/session-418e083a.jsonl",
    ".agents/plugins/marketplace.json",
    "screenshots.json",
]

for pattern in ("lib/*.js", "data/*.json", "data/*.md", "skills/*/SKILL.md", "docs/*.md", "research/*.md", "test/*.mjs", "presentation/*", "codex/**/*", "assets/**/*", "submission/**/*", "scripts/*.mjs", "scripts/*.py"):
    FILES.extend(str(path.relative_to(ROOT)).replace("\\", "/") for path in sorted(ROOT.glob(pattern)) if path.is_file())


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def main() -> None:
    lines = []
    for relative in sorted(set(FILES)):
        path = ROOT / relative
        if not path.is_file():
            raise SystemExit(f"missing file: {relative}")
        lines.append(f"{digest(path)}  {relative}")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT} files={len(lines)}")


if __name__ == "__main__":
    main()
