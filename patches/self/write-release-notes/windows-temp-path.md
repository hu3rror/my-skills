---
id: write-release-notes.windows-temp-path
file: skills/self/write-release-notes/SKILL.md
# self-authored — no upstream diff baseline; verification is behavioral
verification: behavioral
summary: >-
  Release-notes temp path moved from /tmp/release-notes-vX.Y.Z.md to $env:TEMP\release-notes-<tag>.md (steps 3-4, incl. both --notes-file args); content relocated from npm-release step 7 when the release-notes step was extracted into this skill. Self-authored — no upstream diff baseline, so verification is behavioral, not a diff.
origin: "PATCHES.md A-class row #7"
---

## Why

/tmp does not exist on Windows PowerShell; the release-notes temp file must resolve under $env:TEMP, and the two gh release --notes-file call sites (steps 3 and 4) must pass the same expanded path.

## Static assert (CI-runnable)

- `skills/self/write-release-notes/SKILL.md` contains `$env:TEMP\release-notes-`
- `skills/self/write-release-notes/SKILL.md` contains no `/tmp/release-notes`
- `skills/self/npm-release/SKILL.md` contains no `--notes-file`
- `skills/self/npm-release/SKILL.md` contains `write-release-notes`

## Live check (human re-run)

The behavior depends on a live gh + PowerShell, so CI records this procedure and a human re-runs it when the record is touched:

1. `gh release create --help` -> `--notes-file` flag present.
2. `"$env:TEMP\release-notes-vX.Y.Z.md"` resolves via `Test-Path` under PowerShell (write the notes file there first).
3. End-to-end from PowerShell, both branches: `gh release create v0.0.0-verify --notes-file "$env:TEMP\release-notes-verify.md"` and `gh release edit v0.0.0-verify-edit --notes-file "$env:TEMP\release-notes-edit.md"` exit 0 with the body confirmed via `gh release view`.
4. Delete both releases and tags afterwards.

Originally verified at patch time (PATCHES.md row #7); this section is the re-run recipe, not a claim that CI re-verifies it unattended.
