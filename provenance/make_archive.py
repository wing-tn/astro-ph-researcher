#!/usr/bin/env python3
"""Create a shareable provenance/source archive (no .venv, no secrets)."""
from __future__ import annotations

import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
OUT = ROOT / "provenance" / f"astro-ph-researcher-v{VERSION}-provenance-2026-10-22.zip"

INCLUDE_DIRS = ["lib", "data", "skills", "codex", "presentation", "assets", "submission", "docs", "research", "test", "provenance", ".agents", ".github", "scripts"]
INCLUDE_FILES = [
    "README.md",
    "AUTHORS.md",
    "CITATION.cff",
    "CHANGELOG.md",
    "SUPPORT.md",
    "RELEASE_NOTES.md",
    "LICENSE",
    "package.json",
    "cordis.patch.yml",
]


def iter_files():
    for name in INCLUDE_FILES:
        path = ROOT / name
        if path.is_file():
            yield path
    for dirname in INCLUDE_DIRS:
        base = ROOT / dirname
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file():
                continue
            # Never include caches, virtualenvs, or nested archives.
            if any(part in {".venv", "__pycache__", ".pytest_cache"} for part in path.parts):
                continue
            if path.suffix == ".zip":
                continue
            if path.name == "ARCHIVE.sha256":
                continue
            yield path


def main() -> None:
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in iter_files():
            archive.write(path, path.relative_to(ROOT).as_posix())
    print(f"wrote {OUT} bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()
