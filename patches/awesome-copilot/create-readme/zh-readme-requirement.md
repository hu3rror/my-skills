---
id: create-readme.zh-readme-requirement
file: skills/awesome-copilot/create-readme/SKILL.md
upstream:
  source: github/awesome-copilot
  path: skills/create-readme/SKILL.md
verification: diff
summary: >-
  Task step 7 added: the README is written in English by default; the skill
  determines whether the target repo is a personal repository (remote owner
  matches `gh api user --jq .login`; treated as external when unconfirmed) and,
  if so, also writes a `README_zh-CN.md` — a Chinese re-organization of the
  English README covering the same technical facts, scope, usage steps, and key
  limitations, cross-linked with the English file. The rules ship with the
  skill so the README task carries them wherever it runs.
---

## Why

The README task is the single entry point for README creation; the personal-repo
Chinese README requirement only fires on that task. It belongs in the skill
itself so the behavior is self-contained for any consumer, not carried by
context from outside the skill.

## Diff

```diff
--- a/skills/create-readme/SKILL.md
+++ b/skills/create-readme/SKILL.md
@@ -20,2 +20,3 @@
 5. Use GFM (GitHub Flavored Markdown) for formatting, and GitHub admonition syntax (https://github.com/orgs/community/discussions/16925) where appropriate.
 6. If you find a logo or icon for the project, use it in the readme's header.
+7. Write the README in English by default. Determine whether this is a personal repository (its remote owner matches `gh api user --jq .login`; treat it as external if it can't be confirmed). If personal, also write a `README_zh-CN.md`: a Chinese re-organization of the English README — same technical facts, scope, usage steps, and key limitations, not a sentence-by-sentence translation — and cross-link the two files.
```