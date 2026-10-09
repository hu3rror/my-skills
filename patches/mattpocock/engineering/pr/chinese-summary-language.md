---
id: pr.chinese-summary-language
file: skills/mattpocock/engineering/pr/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/pr/SKILL.md
verification: diff
summary: >-
  A `## Language` section added after the template block: the PR body is
  written in English, and when the target repo is a personal repository (remote
  owner matches `gh api user --jq .login`; treated as external when unconfirmed)
  a separate comment with `## Chinese Summary (non-authoritative)` is posted on
  the PR — the primary content — summarizing the key points. The rules ship
  with the skill so the PR-writing task carries them wherever it runs.
---

## Why

The PR template only shapes the body; it says nothing about language or about posting a Chinese summary on personal repos. Those rules fire exactly when this skill runs, so they belong in the skill itself — self-contained for any consumer, not carried by context from outside the skill.

## Diff

```diff
--- a/skills/engineering/pr/SKILL.md
+++ b/skills/engineering/pr/SKILL.md
@@ -33,5 +33,9 @@
 ```
 
+## Language
+
+Write the PR body in English. If the target repo's remote owner matches the current GitHub user (`gh api user --jq .login`; treat it as external when it can't be confirmed), also post a separate comment on the PR — the primary content — with a `## Chinese Summary (non-authoritative)` section summarizing the key points.
+
 ## Sections
 
 Skip all preambles and keep prose brief. Use the user's domain language from `GLOSSARY.md`.
```