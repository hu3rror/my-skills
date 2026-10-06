---
id: handoff.preamble-and-load-skills
file: skills/mattpocock/productivity/handoff/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/handoff/SKILL.md
verification: diff
summary: >-
  Handover preamble added — the doc opens with an alignment stop addressed to the next agent (read the doc and referenced artifacts in full -> reply with the goal / current state / next steps / risks -> wait for user confirmation before working); suggested-skills wording rewritten to load-not-invoke (Skill tool -> read each SKILL.md and follow it); 5 lines added + 1 replaced.
origin: "PATCHES.md A-class row #19"
---

## Why

A handoff is only safe when the incoming agent stops to align before working; and "call the Skill tool" names a tool pi does not have.

## Diff

```diff
--- a/skills/productivity/handoff/SKILL.md
+++ b/skills/productivity/handoff/SKILL.md
@@ -7,7 +7,11 @@ disable-model-invocation: true
 
 Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.
 
-Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.
+Open the document with a handover preamble addressed to the next agent, worded to force an alignment stop before any work:
+
+> You are the incoming agent. Read this document and every artifact it references in full before doing anything else. Then reply with your understanding of four things: the goal, the current state, the next steps, and the risks. Wait for the user's confirmation before starting work.
+
+Include a "suggested skills" section in the document, naming which skills the next agent should load (read each SKILL.md and follow it) and in what order.
 
 Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.
 

```
