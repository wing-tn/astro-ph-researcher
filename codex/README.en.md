# Astro Research Workbench 3.4.0 for Codex

A local, bilingual research workbench for astronomy. Requires **Node.js 22+**. No npm installation, Python, paid API key or DSH runtime is needed for this Codex interface.

## Open the interface

On Windows, double-click **start-ui-en.cmd**. On macOS/Linux, run:

```sh
node scripts/open-ui.mjs --lang en
```

The launcher reuses a running 3.4.0 service, or starts one on an available loopback port between 4317 and 4327, then opens the browser. Copy the printed URL into the Codex browser panel if you prefer to keep it beside the conversation. The service runs in the background; to run it in a terminal with visible logs and Ctrl+C shutdown instead, use `node ui/server.mjs`.

## Add an interactive button to the Codex main window

The supported native integration is a **project action in the desktop app's top bar**. It is not a global sidebar entry, and it does not require pinning a chat.

1. Extract the package into a stable location; keep this folder after installation.
2. Double-click **install-button-en.cmd** and enter the project directory you normally open in Codex. Alternatively run:

```sh
node scripts/install-action.mjs --project "/path/to/your/project" --lang en
```

3. Reopen that project in the Codex desktop app. Select **Open Astro Workbench** from its top-bar actions.

The installer creates or appends to `.codex/environments/environment.toml`. Existing setup and actions are preserved and an existing configuration is backed up before changes. It does not edit global Codex settings, bypass hook trust, or install dependencies. Running it again leaves an existing Astro action unchanged. If the plugin folder moves, update the launcher path in that project action. Review generated commands before committing machine-specific absolute paths to Git.

The package itself also contains portable project-action templates. Opening this extracted directory as a Codex project provides the actions declared in its `.codex` folder on supported desktop versions. Action configuration and the launcher are tested; automatic UI discovery and rendering depend on the host version. Do not promise that installing a skill/plugin alone adds a global Codex button.

See the official [Codex local environments documentation](https://learn.chatgpt.com/docs/environments/local-environment).

## Features

| Workspace | What it does |
| --- | --- |
| Literature | Crossref/arXiv search, year/source filters, DOI/arXiv checks, deduplication, reading notes, provenance and BibTeX/Markdown/JSON exports |
| Writing | Journal/thesis projects; 10 narrative goals; target metadata; author materials; text import; 10 section editors; heuristic checks; author confirmation; Markdown manuscript export and Codex handoff prompts |
| Getting started | Nine steps from background and literature to reproducible analysis, writing and submission; checklists, notes and locally saved progress |
| Research plan | Tasks, parent/dependency links, deliverables, sources and status; cyclic links are rejected |
| Resources | Original 34 methods, 9 statistics entries, 30 facilities, tools, catalogs and 8 bibliography entries |
| Research checks | Nine research/cross-disciplinary areas with locally saved check notes |
| Presentation outline | Export a Markdown briefing from the reading list and plan, or prepare a presentation handoff prompt |
| Settings | English/Chinese switch and full workspace JSON backup |

## Language and evidence boundaries

Use the language selector in the top bar or Settings. The preference is saved in this browser. Manuscript text, personal notes, titles, identifiers and other source metadata are never automatically translated. English companion learning steps and research-check summaries are included. Detailed methods, facilities and other original bundled records retain their source language and can be expanded as structured source material.

The website does **not** call a language model. It prepares writing or slide prompts for you to copy into Codex. Presentation export is **Markdown, not PPTX**. Text heuristics cannot validate scientific results or approve a submission. Author confirmation requires the human to check all four items and is invalidated when the draft changes. Metadata lookup cannot prove peer review, scientific support or lack of retraction. Check current official journal instructions before submission.

## Local data and upgrades

Data are in `ui/local-data/library.json` (reading list) and `ui/local-data/workbench.json` (projects, learning, plan and check notes). `ASTRO_UI_LIBRARY` may specify a custom library file; the workbench file is stored next to it. The UI does not modify your DSH data. One service process should write each data directory.

Back up both stores in Settings before an upgrade. To restore a full backup, stop the service, keep copies of the existing files, then save the backup's `library` object to `library.json` and its `workspace` object to `workbench.json`. Release packages exclude private runtime data.

Run UI tests from this folder with `node --test ui/test/*.test.mjs`. Original skills and offline commands remain available, for example `node scripts/astro-cli.mjs stats`. The full repository preserves the original DSH host/client integration.

## Statements and feedback

Copyright © 2026 天外奇航 (@hyperskysail). The original MIT License remains applicable. AI tools assisted implementation and content; human review remains required. Non-profit maintenance does not add a non-commercial restriction to MIT. See [DISCLAIMER.md](DISCLAIMER.md), [AUTHORS.md](AUTHORS.md), [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md) and the About section in Settings.

**User feedback QQ group: 1126615665** · 1253932197@qq.com · [GitHub Issues](https://github.com/wing-tn/astro-ph-researcher/issues).
