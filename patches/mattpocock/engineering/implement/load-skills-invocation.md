---
id: implement.load-skills-invocation
file: skills/mattpocock/engineering/implement/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/implement/SKILL.md
verification: diff
summary: >-
  Invocation wording rewritten in 2 places: Skill tool -> load the skill by reading its SKILL.md (tdd, code-review); 2 lines replaced.
---

## Why

pi has no Skill tool; cross-skill invocation means loading each skill by reading its SKILL.md and following it.

## Diff

```diff
--- a/skills/engineering/implement/SKILL.md
+++ b/skills/engineering/implement/SKILL.md
@@ -9,9 +9,9 @@ If the user passes a ticket reference, fetch it from the issue tracker and state
 If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

-Call the Skill tool with "tdd" where possible, at pre-agreed seams.
+Load the "tdd" skill (read its SKILL.md) where possible, at pre-agreed seams.

 Run typechecking regularly, single test files regularly, and the full test suite once at the end.

-Once done, call the Skill tool with "code-review" to review the work.
+Once done, load the "code-review" skill (read its SKILL.md) to review the work.

 Commit your work to the current branch.
```
