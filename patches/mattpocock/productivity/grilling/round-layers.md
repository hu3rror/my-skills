---
id: grilling.round-layers
file: skills/mattpocock/productivity/grilling/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/grilling/SKILL.md
verification: diff
summary: >-
  Rewrites the round template so its three tiers are visible: the example is left unfenced, plain
  markdown, with two alternatives shown one per line; the question body is bounded to one or two
  sentences instead of inviting inline option lists; "yes" is defined for a choice question (the
  recommended label) and for a bare round-level yes (every recommendation); and the tier rule now
  states that ❓ carries only what one answer settles together, that an item the user could answer
  apart from its neighbours gets its own question, and that a choice question drops its
  alternatives when one answer settles them all.
---

## Why

The template's only slot for a question read "question body, might be multiple paragraphs,
including multiple choices", so options and their costs arrived as one dense paragraph and the
recommendation had no statement to attach to. The fix keeps every item on a line of its own and
states when items merge back onto the question line.

The example was fenced and its alternatives slot was one placeholder line, so a round came back with
every question inside its own fence: the model had no example of options spread over lines, only a
fence holding the spacing. The example is now unfenced, with two alternatives, so the shape it
teaches is the shape it wants.

## Diff

```diff
--- a/skills/productivity/grilling/SKILL.md
+++ b/skills/productivity/grilling/SKILL.md
@@ -9,19 +9,23 @@
 
 Format a round like so:
 
-```
-❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>
+❓ **Q1** - **<question title>**: <the question and the context it needs, one or two sentences>
+
+**<label>** <alternative>; <what it costs or enables>
+
+**<label>** <alternative>; <what it costs or enables>
 
 ➡️ <your recommended answer>
 
 ---
 
-❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>
+❓ **Q2** - **<question title>**: <the question and the context it needs, one or two sentences>
 
 ➡️ <your recommended answer>
-```
 
-Word each question so "yes" accepts your recommended answer.
+Word each question so "yes" accepts your recommended answer; on a choice question, the recommended label is that "yes"; a bare "yes" takes every recommendation of the round.
+
+One tier per line: ❓ carries the items one answer settles together (a security model, a storage layer); an item the user could answer apart from its neighbours gets its own question. A choice question lists its alternatives one per line, and drops them when one answer settles them all.
 
 Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.
 
```
