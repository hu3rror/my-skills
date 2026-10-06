---
id: research.step3-repo-internal
file: skills/mattpocock/engineering/research/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/research/SKILL.md
  pin: 4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d
verification: diff
summary: >-
  Step 3 rewritten: delegated findings placement ("put it somewhere sensible
  and say where") sharpened to a hard repo-internal bound — findings saved
  inside the repo's working tree, repo-relative location when no convention
  exists, path must resolve inside the repo (`git rev-parse --show-toplevel`);
  the file is a committed artifact of the work it informs, not a session temp
  file.
origin: PATCHES.md A-class row #28
---

## Why

Two sessions had written research findings to `%TEMP%`, discarding a committed,
searchable artifact. The relaxed phrasing let that happen; this pins the bound
to the repo tree.

## Diff

```diff
--- a/skills/engineering/research/SKILL.md
+++ b/skills/engineering/research/SKILL.md
@@ -11,2 +11,2 @@
 2. Write the findings to a single Markdown file, citing each claim's source.
-3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
+3. Save it inside the repo's working tree, where the repo already keeps such notes: match the existing convention, and if there is none, pick a repo-relative location (e.g. `docs/research-<slug>.md` or next to the topic it concerns) and state it. The findings path must resolve inside the repo — check with `git rev-parse --show-toplevel` — so the file is a committed artifact of the work it informs.
```

