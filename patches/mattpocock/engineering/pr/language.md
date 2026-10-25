---
id: pr.language
file: skills/mattpocock/engineering/pr/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/pr/SKILL.md
verification: diff
summary: >-
  A `## Language` section added after the template block: the PR body is
  written in English. The rule ships with the skill so the PR-writing task
  carries it wherever it runs.
---

## Why

The PR template only shapes the body; it says nothing about language. The rule fires exactly when this skill runs, so it belongs in the skill itself — self-contained for any consumer, not carried by context from outside the skill.

## Diff

```diff
--- a/skills/engineering/pr/SKILL.md
+++ b/skills/engineering/pr/SKILL.md
@@ -33,5 +33,9 @@
 ```
 
+## Language
+
+Write the PR body in English.
+
 ## Sections
 
 Skip all preambles and keep prose brief. Use the user's domain language from `GLOSSARY.md`.
```