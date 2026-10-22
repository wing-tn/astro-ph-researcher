import hashlib
import os
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
import json
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
ZIP = DIST / f"astro-ph-researcher-{VERSION}.zip"
TGZ = DIST / f"astro-ph-researcher-{VERSION}.tar.gz"

INCLUDE = [
    ".agents",
    ".codex",
    ".github",
    ".gitignore",
    "AUTHORS.md",
    "CHANGELOG.md",
    "CITATION.cff",
    "LICENSE",
    "README.md",
    "README.en.md",
    "RELEASE_NOTES.md",
    "ACKNOWLEDGMENTS.md",
    "PRIVACY.md",
    "DISCLAIMER.md",
    "SECURITY.md",
    "SUPPORT.md",
    "cordis.patch.yml",
    "package.json",
    "assets",
    "codex",
    "demo",
    "data",
    "docs",
    "lib",
    "presentation",
    "screenshots.json",
    "scripts",
    "skills",
    "test",
]
EXCLUDE_DIRS = {".venv", "node_modules", ".git", "dist", "release", "local-data", "provenance", "research", ".dict-test"}


def files():
    for item in INCLUDE:
        p = ROOT / item
        if not p.exists():
            continue
        if p.is_file():
            yield p
            continue
        for child in sorted(p.rglob("*")):
            if not child.is_file():
                continue
            if any(part in EXCLUDE_DIRS for part in child.relative_to(ROOT).parts):
                continue
            if child.name == '.env' or child.name.startswith('.env.') or child.suffix in {'.log', '.bak', '.pem', '.key'}:
                continue
            yield child


def main():
    DIST.mkdir(exist_ok=True)
    all_files = list(files())
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in all_files:
            zf.write(path, path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(ZIP, "a") as zf:
        zf.writestr("VERSION", VERSION + "\n")
    import tarfile
    with tarfile.open(TGZ, "w:gz") as tf:
        for path in all_files:
            tf.add(path, arcname=f"astro-ph-researcher-{VERSION}/{path.relative_to(ROOT).as_posix()}")
    shutil.copy2(ROOT / "RELEASE_NOTES.md", DIST / "RELEASE_NOTES.md")
    lines = []
    for path in (ZIP, TGZ, DIST / "RELEASE_NOTES.md"):
        h = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append(f"{h}  {path.name}")
    (DIST / "SHA256SUMS").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    print(f"files={len(all_files)} zip={ZIP.stat().st_size} tgz={TGZ.stat().st_size}")


if __name__ == "__main__":
    main()
