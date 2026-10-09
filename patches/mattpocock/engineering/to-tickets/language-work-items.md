---
id: to-tickets.language-work-items
file: skills/mattpocock/engineering/to-tickets/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/to-tickets/SKILL.md
verification: diff
summary: >-
  Step 6 added: ticket bodies are written in English. Tickets are work items
  for agents, not primary content, so no `## Chinese Summary` comment is
  attached to tickets, sub-issues, or follow-ups — a Chinese summary applies
  only to primary content (the spec issue a `to-spec` run published, for a
  personal repo), never per ticket or per run.
---

## Why

Tickets are derived work items for agents, not primary content; the rule makes
explicit that Chinese summaries belong to the spec issue alone, preventing
per-ticket annotation noise while keeping ticket bodies in English.

## Diff

```diff
--- a/skills/engineering/to-tickets/SKILL.md
+++ b/skills/engineering/to-tickets/SKILL.md
@@ -105,1 +105,5 @@
 In either form, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
+
+### 6. Language
+
+Write ticket bodies in English. Tickets are work items for agents, not primary content — never attach `## Chinese Summary (non-authoritative)` comments to tickets, sub-issues, or follow-ups. A Chinese summary applies only to primary content (the spec issue a `to-spec` run published, for a personal repo), never per ticket or per run.
```