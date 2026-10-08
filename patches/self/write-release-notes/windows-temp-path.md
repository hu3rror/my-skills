---
id: write-release-notes.windows-temp-path
file: skills/self/write-release-notes/SKILL.md
# self-authored — no upstream diff baseline; verification is behavioral
verification: behavioral
summary: >-
  Release-notes temp path made OS-portable: the Windows-only $env:TEMP\release-notes-<tag>.md (and the /tmp form before it) replaced with a per-OS pair — Windows `$env:TEMP\release-notes-<tag>.md`, Linux / WSL / macOS `${TMPDIR:-/tmp}/release-notes-<tag>.md` — in step 3's completion criterion; content relocated from npm-release step 7 when the release-notes step was extracted into this skill. Self-authored — no upstream diff baseline, so verification is behavioral, not a diff.
origin: "PATCHES.md A-class row #7"
---

## Why

/tmp does not exist on Windows PowerShell, and `$env:TEMP` is unset on Linux / WSL / macOS — the temp file must resolve on every platform the skill runs on, and the `gh release` call sites in steps 3-4 must pass the same resolved path.

## Static assert (CI-runnable)

- `skills/self/write-release-notes/SKILL.md` contains `OS 临时目录`
- `skills/self/write-release-notes/SKILL.md` contains `$env:TEMP\release-notes-`
- `skills/self/write-release-notes/SKILL.md` contains `${TMPDIR:-/tmp}/release-notes-`
- `skills/self/npm-release/SKILL.md` contains no `--notes-file`
- `skills/self/npm-release/SKILL.md` contains `write-release-notes`

## Live check (human re-run)

The behavior depends on a live gh plus the platform shell, so CI records this procedure and a human re-runs it when the record is touched:

1. `gh release create --help` -> `--notes-file` flag present.
2. Write the notes file, then confirm the path resolves: Windows PowerShell `Test-Path "$env:TEMP\release-notes-vX.Y.Z.md"`; Linux / WSL `test -f "${TMPDIR:-/tmp}/release-notes-vX.Y.Z.md"`.
3. End-to-end, both branches: `gh release create v0.0.0-verify --notes-file <resolved path>` and `gh release edit v0.0.0-verify-edit --notes-file <resolved path>` exit 0 with the body confirmed via `gh release view`.
4. Delete both releases and tags afterwards.

Originally verified at patch time (PATCHES.md row #7); this section is the re-run recipe, not a claim that CI re-verifies it unattended.
