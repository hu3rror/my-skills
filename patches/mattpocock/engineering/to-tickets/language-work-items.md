---
id: to-tickets.language-work-items
file: skills/mattpocock/engineering/to-tickets/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/to-tickets/SKILL.md
verification: diff
summary: >-
  Step 6 added: ticket bodies are written in English — tickets are work items
  for agents, not primary content.
---

## Why

Tickets are derived work items for agents, not primary content; the rule keeps
ticket bodies in English.

## Diff

```diff
--- a/skills/engineering/to-tickets/SKILL.md
+++ b/skills/engineering/to-tickets/SKILL.md
@@ -105,1 +105,5 @@
 In either form, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
+
+### 6. Language
+
+Write ticket bodies in English. Tickets are work items for agents, not primary content.
```