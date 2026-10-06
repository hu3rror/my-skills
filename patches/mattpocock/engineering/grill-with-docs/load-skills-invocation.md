---
id: grill-with-docs.load-skills-invocation
file: skills/mattpocock/engineering/grill-with-docs/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/grill-with-docs/SKILL.md
verification: diff
summary: >-
  Invocation line rewritten: "Call the Skill tool twice" -> "Load two skills in order, grilling then domain-modeling (read each SKILL.md and follow it)" — same pi Skill-tool rationale; 1 line replaced.
origin: "PATCHES.md A-class row #18"
---

## Why

pi has no Skill tool; the invocation must say how this runtime actually loads skills, in order.

## Diff

```diff
--- a/skills/engineering/grill-with-docs/SKILL.md
+++ b/skills/engineering/grill-with-docs/SKILL.md
@@ -4,4 +4,4 @@ description: A relentless interview to sharpen a plan or design, which also crea
 disable-model-invocation: true
 ---
 
-Call the Skill tool twice, for "grilling" and "domain-modeling".
+Load two skills in order, "grilling" then "domain-modeling" (read each SKILL.md and follow it).

```
