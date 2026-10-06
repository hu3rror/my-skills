---
id: grilling.verified-claims
file: skills/mattpocock/productivity/grilling/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/grilling/SKILL.md
verification: diff
summary: >-
  2 lines appended after the "Finding facts" paragraph: recommended answers are claims, not opinions — each must rest on a fact the agent verified (filesystem, tools, docs, or a sub-agent), or carry an inline (待验证) label naming the missing fact and how to check it — never present unverified facts as settled.
origin: "PATCHES.md A-class row #20"
---

## Why

Grilling's recommended answers carry the most weight exactly when the user trusts the facts; an unverified claim presented as settled is the failure mode this rule closes.

## Diff

```diff
--- a/skills/productivity/grilling/SKILL.md
+++ b/skills/productivity/grilling/SKILL.md
@@ -25,4 +25,6 @@ Each round the user answers reshapes the tree: settled decisions push the fronti
 
 Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.
 
+A recommended answer is a claim, not an opinion: it must rest on a fact you have verified (via the filesystem, tools, docs, or a sub-agent). When a recommendation depends on a fact you have not verified, label it `(待验证)` inline, name the missing fact and how you would check it — never present it as settled.
+
 The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

```
