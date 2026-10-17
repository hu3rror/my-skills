---
id: implement.scope-sibling-tickets
file: skills/mattpocock/engineering/implement/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/implement/SKILL.md
verification: diff
after: implement.load-skills-invocation
summary: >-
  Add a start-of-run step: fetch the tickets this one blocks and that block it and restate their titles, so scope leaks to sibling tickets (e.g. implementing a sibling's seam inside this ticket) are caught before implementation; a failed fetch marks the scope assumption [NEED-VERIFY] instead of proceeding silently. Trigger: the #44/#45 boundary flip (retro 2026-10-17) — adapter capture implemented inside #44, reverted after a later fetch showed it belongs to #45.
---

## Why

The implement skill had no step to read sibling tickets, so a flaky `gh issue view` at planning time let the agent proceed on an unverified scope assumption and build a sibling's seam inside this ticket. This step makes the boundary explicit and forces the assumption to be flagged, not silently carried.

## Diff

```diff
--- a/skills/engineering/implement/SKILL.md
+++ b/skills/engineering/implement/SKILL.md
@@ -9,3 +9,4 @@ If the user passes a ticket reference, fetch it from the issue tracker and state
 If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.
+Also fetch the tickets this one blocks and that block it, and restate their titles — scope leaks to sibling tickets are the failure mode to prevent (e.g. implementing a sibling's seam inside this ticket). If a fetch fails (network, permissions), mark the scope assumption `[NEED-VERIFY]` instead of proceeding silently; verify it before committing.
 
 Load the "tdd" skill (read its SKILL.md) where possible, at pre-agreed seams.
```
