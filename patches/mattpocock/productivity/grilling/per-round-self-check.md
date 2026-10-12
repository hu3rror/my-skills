---
id: grilling.per-round-self-check
file: skills/mattpocock/productivity/grilling/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/grilling/SKILL.md
verification: diff
after: grilling.verified-claims
summary: >-
  Rewrites the "verified claims" line into an explicit per-round completion criterion
  (verified facts name their source so the evidence chain can be re-checked; unverified
  stays labelled `(待验证)` with how-to-check; a round is complete only when every
  recommendation has passed the check), and adds the consistency check a round must pass
  before presenting: every recommendation held against (a) this effort's recorded decisions,
  (b) the cited precedents, (c) this session's own statements including the other
  recommendations of this round, conflicts flagged inline. Decisions and precedents are
  records to fetch, not context to assume: a clean session (a wayfinder ticket session)
  fetches them before the first round, and an unread record is a `(待验证)` gap, never an
  empty set. Stacks on verified-claims — its paragraph is this hunk's context.
---

## Why

Four grilling sessions on 2026-10-11 asked, eight times, that recommendations be judged
against the user's prior facts and decisions; one real incident had the agent call models.json
an ecosystem gap and then recommend "models.json not in set" within the same session (the user
caught it: "你不是说 cc 默认 deny models.json 吗？怎么一下子就推翻了？"). Verification coverage
existed; consistency did not. This is the missing per-round check: a recommendation that
contradicts a recorded decision, a cited precedent, or the agent's own earlier statement is a
defect, not a fresh idea. The records phrasing matters for ticket-per-session efforts: the
effort's decisions live in the map / closed resolutions / ADRs, outside a fresh session's
context — absent record is a `(待验证)` gap, never an empty set.

## Diff

```diff
--- a/skills/productivity/grilling/SKILL.md
+++ b/skills/productivity/grilling/SKILL.md
@@ -28,5 +28,9 @@
 
 Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.
 
-A recommended answer is a claim, not an opinion: it must rest on a fact you have verified (via the filesystem, tools, docs, or a sub-agent). When a recommendation depends on a fact you have not verified, label it `(待验证)` inline, name the missing fact and how you would check it — never present it as settled.
+A recommended answer is a claim, not an opinion: it must rest on a fact you have verified (via the filesystem, tools, docs, or a sub-agent) and name the source, so the fact carries an evidence chain a later round can re-check. When a recommendation depends on a fact you have not verified, label it `(待验证)` inline, name the missing fact and how you would check it — never present it as settled. A round is complete only when every recommendation has passed this check.
+
+Before presenting a round, run the consistency check: hold every recommendation against (a) this effort's recorded decisions, (b) the precedents you cite, and (c) your own statements in this session, including the other recommendations of this round; flag any conflict inline. A recommendation that contradicts a recorded decision or your own earlier statement is a defect to resolve, not a fresh idea to float.
+
+Decisions and precedents are records, not context: when a session starts clean (a wayfinder ticket session), fetch them — the map's Decisions-so-far, the closed tickets' resolutions, the ADRs — before the first round. An unread record is a `(待验证)` gap, never an empty set.
 
 The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
```