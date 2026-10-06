---
id: code-review.spawn-both-subagents
file: skills/mattpocock/engineering/code-review/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/code-review/SKILL.md
verification: diff
summary: >-
  2 lines appended in step 4 'Spawn both sub-agents in parallel': the spawn mechanism — call subagent once in parallel mode with both reviews as two tasks in the same call, which is what starts the two axes simultaneously.
origin: "PATCHES.md A-class row #11"
---

## Why

The step title says "in parallel" but the upstream text never said how; the single parallel subagent call is the mechanism that actually starts both review axes at once.

## Diff

```diff
--- a/skills/engineering/code-review/SKILL.md
+++ b/skills/engineering/code-review/SKILL.md
@@ -57,6 +57,8 @@ Each smell reads *what it is* → *how to fix*; match it against the diff:
 
 ### 4. Spawn both sub-agents in parallel
 
+Call `subagent` once, in parallel mode, with both reviews as two `tasks` in the same call — that single call is what starts the two axes simultaneously.
+
 **Standards sub-agent prompt** should include:
 
 - The full diff command and commit list.

```
