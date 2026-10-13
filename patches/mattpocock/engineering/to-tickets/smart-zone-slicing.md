---
id: to-tickets.smart-zone-slicing
file: skills/mattpocock/engineering/to-tickets/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/to-tickets/SKILL.md
verification: diff
summary: >-
  Slice sizing switched from the raw context window to the smart zone: the
  advertised window size is only the raw ceiling, while quality reasoning holds
  within roughly the first 100K–150K tokens (the smart zone — the established
  term `ask-matt` already uses); past it an agent drifts
  into the dumb zone. A size rule reworded, a `<smart-zone>` block defining the
  concept and its overshoot signals, one quiz question, and a `**Scale:**` line
  added to both ticket templates so every drafted ticket states its smart-zone
  footprint.
---

## Why

The size rule said "fits in a single fresh context window", which sizes a slice
against the window's advertised ceiling. Quality falls off well before that
ceiling, so a slice drafted for the raw window would push the implementing
agent into the dumb zone mid-ticket. The skill now sizes slices for the smart
zone — the established term, already used by `ask-matt` — and the published
 tickets carry an explicit smart-zone scale so
the drafting agent weighs size against the zone, not the window.

## Diff

```diff
--- a/skills/engineering/to-tickets/SKILL.md
+++ b/skills/engineering/to-tickets/SKILL.md
@@ -30,11 +30,19 @@
 
 - Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
 - A completed slice is demoable or verifiable on its own
-- Each slice is sized to fit in a single fresh context window
+- Each slice is sized to fit in a single fresh context window's **smart zone**, not the window's raw advertised ceiling (smart-zone block below)
 - Any prefactoring should be done first
 
 </vertical-slice-rules>
 
+<smart-zone>
+
+A slice is sized to fit in one fresh session's **smart zone** — roughly the first 100K–150K tokens of a fresh context window, where the agent still reasons sharply. The window's advertised size is only the raw ceiling; past the smart zone the agent drifts into the **dumb zone**, still executing but sloppier, more forgetful, more mistake-prone. Plan around the smart zone, never the window: the practical budget is the tokens the agent works well within, not the tokens it can technically hold.
+
+Estimate the ticket's context spend (read + write + reasoning) and cut it until it lands comfortably inside the smart zone. Signals that a ticket overshoots into the dumb zone: the agent must read hundreds of files, write thousands of lines, or sustain many rounds of reasoning to land it. When in doubt, split it — a ticket drafted for the raw window is really several smart-zone tickets.
+
+</smart-zone>
+
 Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.
 
 **Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.
@@ -50,6 +58,7 @@
 Ask the user:
 
 - Does the granularity feel right? (too coarse / too fine)
+- Does every ticket sit comfortably inside the smart zone, or would any push its agent into the dumb zone?
 - Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
 - Should any tickets be merged or split further?
 
@@ -72,6 +81,8 @@
 
 **What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.
 
+**Scale:** estimated to fit within one smart zone (roughly <150K tokens of read + write + reasoning)
+
 **Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".
 
 **Status:** ready-for-agent
@@ -91,6 +102,8 @@
 
 The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.
 
+**Scale:** estimated to fit within one smart zone (roughly <150K tokens of read + write + reasoning)
+
 ## Acceptance criteria
 
 - [ ] Criterion 1
```