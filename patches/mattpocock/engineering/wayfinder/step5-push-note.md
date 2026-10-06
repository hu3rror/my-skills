---
id: wayfinder.step5-push-note
file: skills/mattpocock/engineering/wayfinder/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/wayfinder/SKILL.md
verification: diff
after: wayfinder.load-skills-rewrite
summary: >-
  Step 5's research line gains the push-completion extension: research results arrive as a pushed findings path — read the file when the push lands, or resume from the branch's checkpointed findings if the charting session ends first. One extended line, merged onto the same line that wayfinder.load-skills-rewrite rewrites.
origin: "PATCHES.md A-class row #2 (baseline)"
---

## Why

pi's background research agent pushes its completion (findings path) back to the caller. The upstream line only said to capture findings on a branch, which leaves an agent polling or planning around a fixed read time.

## Diff

```diff
--- a/skills/engineering/wayfinder/SKILL.md
+++ b/skills/engineering/wayfinder/SKILL.md
@@ -114,3 +114,3 @@
 4. **Create the tickets you can specify now** as child issues of the map, then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog: the **Not yet specified** section.
-5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that loads the "research" skill (reads its SKILL.md) to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket.
+5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that loads the "research" skill (reads its SKILL.md) to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket. Completion arrives as a **push** carrying the findings path: read the file when the push lands — or, since research is session-scoped and charting stops here, resume from the branch's checkpointed findings in a later session if the run didn't finish before this one ended.
 6. Stop: charting is one session's work; it hand-resolves nothing.
```
