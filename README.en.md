# astro-ph-researcher 3.4.0

A bilingual local astronomy workbench for Codex, with the original DeepSeek Harness integration, nine skills and offline libraries retained.

Download the DSH bundle (`*-dsh.zip`), standalone Codex Chinese/English package (`*-codex-zh.zip` / `*-codex-en.zip`), or complete source (`*-source.zip`) from [v3.4.0 Releases](https://github.com/wing-tn/astro-ph-researcher/releases/tag/v3.4.0). The DSH and source archives contain the same complete project. Verify downloads against `SHA256SUMS.txt`.

Requires **Node.js 22+**; no npm installation is needed for the Codex UI.

```sh
node codex/scripts/open-ui.mjs --lang en
```

To add the **Open Astro Workbench** native project action to the Codex desktop top bar:

```sh
node codex/scripts/install-action.mjs --project "/path/to/your/project" --lang en
```

Reopen that project in Codex. Windows users can double-click `codex/start-ui-en.cmd` or `codex/install-button-en.cmd`. The repository also includes portable `.codex/environments/environment.toml` actions. This is a project-level integration; it does not claim that installing a skill creates a global sidebar button.

Features: literature search and identifier checks; reading lists and citations; writing projects and section drafts; explicit author review; a nine-step learning path; research plans; methods/statistics/facilities; research-check notes; presentation outlines; English/Chinese interface switching; local backups.

The web page prepares handoff prompts rather than calling a language model. Presentation export is Markdown, not PPTX. Metadata checks and text heuristics do not validate science. Original detailed source material retains its source language; user drafts and notes are not automatically translated.

For DSH, extract the complete bundle and run `dsh plugin --profile desktop add .` from its project folder, then fully restart DSH. Use `web` in place of `desktop` if that is your profile. See the [DSH installation guide](docs/INSTALL-DSH.md).

Read the [complete English guide](codex/README.en.md), [release notes](RELEASE_NOTES.md), [Chinese guide](codex/README-3.4.zh.md), [validation scope](codex/VALIDATION.md), and [publishing checklist](docs/PUBLISH-3.4.md).

Copyright © 2026 天外奇航 (@hyperskysail, GXU-CN). AI tools assisted implementation and materials; human review remains necessary. The maintainer operates the project on a non-profit basis without adding a non-commercial restriction to MIT. Third-party rights remain applicable; acknowledgment does not imply endorsement.

**User feedback QQ group: 1126615665** · 1253932197@qq.com. See the [copyright, AIGC, disclaimer and non-profit statements](DISCLAIMER.md), [acknowledgments](ACKNOWLEDGMENTS.md), [support](SUPPORT.md) and original [MIT License](LICENSE).
