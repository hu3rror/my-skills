---
id: write-release-notes.english-template
file: skills/self/write-release-notes/references/release-notes-guide.md
# self-authored — no upstream diff baseline; verification is behavioral
verification: behavioral
summary: >-
  Structure template rewritten from a Chinese skeleton (## 亮点, Chinese item lines) to an English skeleton (## Highlights / ## Features / ## Fixes / ## Docs / Chore / ## ⚠️ Breaking Changes / ## Full Changelog), with the Chinese guidance moved out of the fenced block as "理解用，不抄" notes — the copy-paste output is now English-headed; 17 lines added, 7 removed. Self-authored — no upstream diff baseline, so verification is behavioral, not a diff.
origin: "PATCHES.md A-class row #15"
---

## Why

Release notes are an English-facing artifact (AGENTS.md: body language English); the template the agent copies must be English-headed, with the Chinese guidance kept as non-copied notes outside the fence.

## Static assert (CI-runnable)

- `skills/self/write-release-notes/references/release-notes-guide.md` contains `## Highlights`
- `skills/self/write-release-notes/references/release-notes-guide.md` contains no `## 亮点`

## Live check (human re-run)

Dry-run the consolidation report to confirm write-release-notes no longer reads as a modified stray:

1. `node scripts/consolidate-strays.mjs` — write-release-notes must classify as **current**.
2. If it ever classifies as a modified stray, the store copy diverged from this template — recover per the stray-recovery branch (record-first).
