---
id: grilling.round-layers
file: skills/mattpocock/productivity/grilling/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/grilling/SKILL.md
verification: diff
summary: >-
  Rewrites the round template so its three tiers are visible: each alternative on its own
  labelled line (omitted when one answer settles every item), the question body bounded to one
  or two sentences instead of inviting inline option lists, "yes" defined for a choice question
  (the recommended label) and for a bare round-level yes (every recommendation), and one added
  sentence stating the tier rule — ❓ carries only what one answer settles together, an item the
  user could answer apart from its neighbours gets its own question.
---

## Why

The template's only slot for a question read "question body, might be multiple paragraphs,
including multiple choices", so options and their costs arrived as one dense paragraph and the
recommendation had no statement to attach to. The fix keeps every item on a line of its own and
states when items merge back onto the question line.

## Diff

```diff
--- a/skills/productivity/grilling/SKILL.md
+++ b/skills/productivity/grilling/SKILL.md
@@ -10,18 +10,22 @@
 Format a round like so:
 
 ```
-❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>
+❓ **Q1** - **<question title>**: <the question and the context it needs, one or two sentences>
+
+<alternatives, one per line — **<label>** <alternative>; <what it costs or enables>; omit when one answer settles them all>
 
 ➡️ <your recommended answer>
 
 ---
 
-❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>
+❓ **Q2** - **<question title>**: <the question and the context it needs, one or two sentences>
 
 ➡️ <your recommended answer>
 ```
 
-Word each question so "yes" accepts your recommended answer.
+Word each question so "yes" accepts your recommended answer; on a choice question, the recommended label is that "yes"; a bare "yes" takes every recommendation of the round.
+
+One tier per line: ❓ carries the items one answer settles together (a security model, a storage layer); an item the user could answer apart from its neighbours gets its own question.
 
 Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.
 
```
