---
id: grill-me.load-skills-invocation
file: skills/mattpocock/productivity/grill-me/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/grill-me/SKILL.md
verification: diff
summary: >-
  Invocation line rewritten: "Call the Skill tool with grilling" -> "Load the grilling skill (read its SKILL.md) and follow it" — pi has no Skill tool, so cross-skill invocation uses the read-a-SKILL.md mechanism the runtime documents; 1 line replaced.
origin: "PATCHES.md A-class row #17"
---

## Why

pi has no Skill tool; the invocation must say how this runtime actually loads another skill.

## Diff

```diff
--- a/skills/productivity/grill-me/SKILL.md
+++ b/skills/productivity/grill-me/SKILL.md
@@ -4,4 +4,4 @@ description: A relentless interview to sharpen a plan or design.
 disable-model-invocation: true
 ---
 
-Call the Skill tool with "grilling".
+Load the "grilling" skill (read its SKILL.md) and follow it.

```
