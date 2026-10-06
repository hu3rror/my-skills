---
id: wayfinder.load-skills-rewrite
file: skills/mattpocock/engineering/wayfinder/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/wayfinder/SKILL.md
  pin: 4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d
verification: diff
summary: >-
  Cross-skill invocation rewritten in 6 places: `Skill` tool → load the skill
  by reading its SKILL.md (research ×2, prototype, grilling + domain-modeling
  ×3); load phrasing unified to "(read each SKILL.md and follow it)" across
  the ticket-type list, step 1, step 3, and step 5. Step 5's line also carries
  the push-completion extension from the sibling record
  `wayfinder.step5-push-note` (applied after this one).
origin: PATCHES.md A-class row #25
---

## Why

pi has no `Skill` tool; cross-skill invocation in this runtime means reading
the target skill's SKILL.md and following it. The upstream file still says
"call the Skill tool", which would mislead an agent working in pi.

## Diff

```diff
--- a/skills/engineering/wayfinder/SKILL.md
+++ b/skills/engineering/wayfinder/SKILL.md
@@ -76,5 +76,5 @@
 
-- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that calls the Skill tool with "research". Use when knowledge outside the current working directory is required.
+- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that loads the "research" skill (reads its SKILL.md). Use when knowledge outside the current working directory is required.
-- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by calling the Skill tool with "prototype". Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
+- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by loading the "prototype" skill (reading its SKILL.md). Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
-- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for "grilling" and "domain-modeling".
+- **Grilling** (HITL): Conversation. The default case. Always load two skills, "grilling" and "domain-modeling" (read each SKILL.md and follow it).
 - **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made: nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides, and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.
@@ -110,3 +110,3 @@
 
-1. **Name the destination.** Call the Skill tool twice, for "grilling" and "domain-modeling", to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
+1. **Name the destination.** Load the "grilling" and "domain-modeling" skills (read each SKILL.md and follow it) to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
 2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you don't need a map. Stop and ask the user how they'd like to proceed.
@@ -114,3 +114,3 @@
 4. **Create the tickets you can specify now** as child issues of the map, then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog: the **Not yet specified** section.
-5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that calls the Skill tool with "research" to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket.
+5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that loads the "research" skill (reads its SKILL.md) to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket.
 6. Stop: charting is one session's work; it hand-resolves nothing.
@@ -123,3 +123,3 @@
 2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
-3. Resolve it. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for "grilling" and "domain-modeling".
+3. Resolve it. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; load whichever skills the `## Notes` block names (read each SKILL.md and follow it). If in doubt, load "grilling" and "domain-modeling" (read each SKILL.md and follow it).
 4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far.
```

