---
id: to-tickets.loading-toll
file: skills/mattpocock/engineering/to-tickets/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/to-tickets/SKILL.md
verification: diff
after: to-tickets.smart-zone-slicing
summary: >-
  Slice sizing refined to account for the context-loading toll a fresh
  implementer pays before writing a line. The smart-zone block is restructured
  reduce-then-budget: the drafter's first job is to front-load orientation into
  the ticket (stable anchors — ADR IDs, glossary terms, module/package names,
  the parent issue) so a fresh agent loads less, and only the residual loading
  is budgeted against the zone (effective budget = smart zone minus
  context-loading overhead; the dumb-zone signal is loading plus work, not work
  alone). The reduce-the-tax lever is primary over budget-the-tax, per Pocock's
  principle that exploration belongs in a different session; budgeting the toll
  in-session is the backstop. Tickets gain an Orientation section; the Scale
  line asserts orientation front-loaded plus residual fits the ~100K-150K zone
  (fixing the prior <150K ceiling vs 100K-150K range inconsistency). Step 2
  'Explore the codebase' graduates from optional to conditional (required when
  the area is unfamiliar to a fresh implementer or the ticket nears the zone
  edge; its output is the orientation each ticket carries). The anti-staleness
  rule narrows from 'avoid specific file paths' to 'avoid volatile references
  (paths/line numbers/dist internals); stable anchors encouraged'. The same
  smart-zone budget concept is shared by ask-matt (SKILL.md ~150K,
  PHASE-BOUNDARIES.md 'enough smart zone left for the next phase'); mirroring
  the loading-toll accounting there is tracked separately (GitHub issue
  hu3rror/my-skills#31 — see that issue for the mirror scope and acceptance
  criteria).
---

## Diff

```diff
--- a/skills/engineering/to-tickets/SKILL.md
+++ b/skills/engineering/to-tickets/SKILL.md
@@ -16,9 +16,11 @@ The issue tracker and triage label vocabulary should have been provided to you.
 
 Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.
 
-### 2. Explore the codebase (optional)
+### 2. Explore the codebase (conditional)
 
-If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.
+Explore when a ticket's area is unfamiliar to a fresh implementer, or when a ticket sits near the smart-zone edge; skip it only when you already know the area and the ticket is small. The output of exploring is the **orientation** each ticket carries (stable anchors in its Orientation section) so a fresh agent does not have to re-explore — see the smart-zone block below.
+
+Understand the current state of the code, use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.
 
 Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."
 
@@ -37,9 +39,11 @@ Break the work into **tracer bullet** tickets.
 
 <smart-zone>
 
-A slice is sized to fit in one fresh session's **smart zone** — roughly the first 100K–150K tokens of a fresh context window, where the agent still reasons sharply. The window's advertised size is only the raw ceiling; past the smart zone the agent drifts into the **dumb zone**, still executing but sloppier, more forgetful, more mistake-prone. Plan around the smart zone, never the window: the practical budget is the tokens the agent works well within, not the tokens it can technically hold.
+A slice is sized to fit one fresh session's **smart zone** — roughly the first 100K–150K tokens of a fresh context window, where the agent still reasons sharply. Past it the agent drifts into the **dumb zone**: still executing, but sloppier, more forgetful, more mistake-prone. Plan around the smart zone, never the window's advertised ceiling.
+
+A fresh session pays a **context-loading toll** before it writes a line. The agent grabbing a ticket starts empty: it reads the ticket body, the parent spec and related issues, the area's ADRs and glossary, the coding standards, then navigates the codebase to orient itself. Loading tokens count against the smart zone just as much as implementation tokens — the zone is a budget, and orientation spends it. So the drafter's first job is to **reduce** what the implementer must load: front-load the orientation into the ticket (stable anchors in its Orientation section), and prefactor so the change is easy. Only what cannot be front-loaded stays as a toll to budget for.
 
-Estimate the ticket's context spend (read + write + reasoning) and cut it until it lands comfortably inside the smart zone. Signals that a ticket overshoots into the dumb zone: the agent must read hundreds of files, write thousands of lines, or sustain many rounds of reasoning to land it. When in doubt, split it — a ticket drafted for the raw window is really several smart-zone tickets.
+The effective implementation budget is **smart zone − context-loading overhead**. Estimate the loading a fresh implementer pays for *this* ticket (low when the drafter already explored and left anchors; high in an unfamiliar or large area) plus the implementation spend (read + write + reasoning the change costs), and cut the ticket until loading + implementation lands comfortably inside the smart zone. The dumb-zone signal is the *total* (loading + work), not the work alone: a ticket small by change size can still overshoot if its area demands heavy loading. When in doubt, split it.
 
 </smart-zone>
 
@@ -58,6 +62,7 @@ Present the proposed breakdown as a numbered list. For each ticket, show:
 Ask the user:
 
 - Does the granularity feel right? (too coarse / too fine)
+- Does each ticket carry the orientation a fresh implementer needs (stable anchors in its Orientation section), so it won't have to re-explore?
 - Does every ticket sit comfortably inside the smart zone, or would any push its agent into the dumb zone?
 - Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
 - Should any tickets be merged or split further?
@@ -81,7 +86,9 @@ Do NOT close or modify any parent issue.
 
 **What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.
 
-**Scale:** estimated to fit within one smart zone (roughly <150K tokens of read + write + reasoning)
+**Orientation:** stable anchors a fresh implementer reads before touching code — ADR IDs, glossary terms, module/package names, the parent issue. No volatile file paths or line numbers. Reduces the context-loading toll so the implementer need not re-explore.
+
+**Scale:** orientation front-loaded (stable anchors above); residual loading + implementation estimated within the smart zone (~100K–150K total session tokens)
 
 **Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".
 
@@ -102,7 +109,11 @@ A reference to the parent issue on the tracker (if the source was an existing is
 
 The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.
 
-**Scale:** estimated to fit within one smart zone (roughly <150K tokens of read + write + reasoning)
+## Orientation
+
+Stable anchors a fresh implementer reads before touching code — ADR IDs, glossary terms, module/package names, the parent issue. No volatile file paths or line numbers. Reduces the context-loading toll so the implementer need not re-explore.
+
+**Scale:** orientation front-loaded (stable anchors above); residual loading + implementation estimated within the smart zone (~100K–150K total session tokens)
 
 ## Acceptance criteria
 
@@ -115,7 +126,7 @@ The end-to-end behaviour this ticket makes work, from the user's perspective, no
 
 </issue-template>
 
-In either form, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
+In either form, avoid **volatile references** — specific file paths, line numbers, or dist internals: they go stale fast. **Stable anchors are encouraged instead**: ADR IDs, glossary terms, module/package names, the parent issue — these survive churn and let a fresh implementer load precisely. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
 
 ### 6. Language
 
```
