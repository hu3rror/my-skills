---
id: implement.no-comments-before-review
file: skills/mattpocock/engineering/implement/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/implement/SKILL.md
verification: diff
after: implement.scope-sibling-tickets
summary: >-
  Load the no-comments skill before code-review so the comment audit runs on
  the working tree and the review judges the audited result. The full test
  suite has already run at this point; no-comments reruns the tests its fixes
  touch (its step 6), then code-review reviews the work.
---

## Why

Without a load pointer the no-comments audit never runs as a gate. Code-review
comes second so the review sees the audited tree, not the pre-audit one; the
comment audit and the code review stay separate passes with separate concerns.
## Diff

```diff
--- a/skills/engineering/implement/SKILL.md
+++ b/skills/engineering/implement/SKILL.md
@@ -14,5 +14,5 @@ Run typechecking regularly, single test files regularly, and the full test suite
 Run typechecking regularly, single test files regularly, and the full test suite once at the end.
 
-Once done, load the "code-review" skill (read its SKILL.md) to review the work.
+Once done, load the "no-comments" skill (read its SKILL.md), then load the "code-review" skill (read its SKILL.md) to review the work.
 
 Commit your work to the current branch.
```