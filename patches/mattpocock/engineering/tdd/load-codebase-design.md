---
id: tdd.load-codebase-design
file: skills/mattpocock/engineering/tdd/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/tdd/SKILL.md
verification: diff
summary: >-
  Seams section invocation rewritten: Skill tool -> load codebase-design by reading its SKILL.md; 1 line replaced.
origin: "PATCHES.md A-class row #24"
---

## Why

pi has no Skill tool; the vocabulary reference is loaded by reading its SKILL.md.

## Diff

```diff
--- a/skills/engineering/tdd/SKILL.md
+++ b/skills/engineering/tdd/SKILL.md
@@ -23,7 +23,7 @@ A **seam** is the public boundary you test at: the interface where you observe b
 
 Ask: "What's the public interface, and which seams should we test?"
 
-When the shape of that interface is itself in question (how deep the module is, where the seam belongs, what the interface should expose), call the Skill tool with "codebase-design" for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not a session to run.
+When the shape of that interface is itself in question (how deep the module is, where the seam belongs, what the interface should expose), load the "codebase-design" skill (read its SKILL.md) for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not a session to run.
 
 ## Anti-patterns
 

```
