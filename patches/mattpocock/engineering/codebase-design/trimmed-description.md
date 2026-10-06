---
id: codebase-design.trimmed-description
file: skills/mattpocock/engineering/codebase-design/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/codebase-design/SKILL.md
verification: diff
summary: >-
  Description trimmed to a clear trigger: dropped the generic "user wants to..." scaffolding and the indirect-trigger clause ("or when another skill needs the deep-module vocabulary"); explicit when-not (routine feature work that doesn't touch module boundaries); 1 line replaced.
origin: "PATCHES.md A-class row #14"
---

## Why

A tighter description stops spurious model invocation and makes the trigger unambiguous, including an explicit when-not.

## Diff

```diff
--- a/skills/engineering/codebase-design/SKILL.md
+++ b/skills/engineering/codebase-design/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: codebase-design
-description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
+description: Shared vocabulary for designing deep modules. Use when designing or improving a module's interface, choosing where a seam goes, finding deepening opportunities, or making code testable/AI-navigable. Not needed for routine feature work that doesn't touch module boundaries.
 ---
 
 # Codebase Design

```
