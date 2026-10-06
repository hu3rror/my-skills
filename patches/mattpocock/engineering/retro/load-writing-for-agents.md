---
id: retro.load-writing-for-agents
file: skills/mattpocock/engineering/retro/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/retro/SKILL.md
verification: diff
summary: >-
  Step 1 invocation rewritten: Skill tool -> load writing-for-agents by reading its SKILL.md; 1 line replaced.
origin: "PATCHES.md A-class row #23"
---

## Why

pi has no Skill tool; the writing-style reference is loaded by reading its SKILL.md.

## Diff

```diff
--- a/skills/engineering/retro/SKILL.md
+++ b/skills/engineering/retro/SKILL.md
@@ -9,4 +9,4 @@
 ## Steps

-1. Call the Skill tool with `writing-for-agents` for the writing style guide.
+1. Load the `writing-for-agents` skill (read its SKILL.md) for the writing style guide.


```
