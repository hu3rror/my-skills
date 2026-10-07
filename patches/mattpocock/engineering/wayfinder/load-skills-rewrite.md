---
id: wayfinder.load-skills-rewrite
file: skills/mattpocock/engineering/wayfinder/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/wayfinder/SKILL.md
verification: diff
summary: >-
  Cross-skill invocation rewritten in 6 places: Skill tool -> load the skill by reading its SKILL.md (research x2, prototype, grilling + domain-modeling x3); load phrasing unified to "(read each SKILL.md and follow it)" across the ticket-type list, step 1, step 3, and step 5. Step 5's line also carries the push-completion extension from the sibling record wayfinder.step5-push-note (applied after this one).
origin: "PATCHES.md A-class row #25"
---

## Why

pi has no Skill tool; cross-skill invocation in this runtime means reading the target skill's SKILL.md and following it. The upstream file still says "call the Skill tool", which would mislead an agent working in pi.

## Diff

```diff
--- a/skills/engineering/wayfinder/SKILL.md
+++ b/skills/engineering/wayfinder/SKILL.md
@@ -74,9 +74,9 @@ The answer isn't part of the body; it's recorded on resolution (see [Work throug
 
 Every ticket is either **HITL** (human in the loop, worked _with_ a human who speaks for themselves) or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).
 
-- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that calls the Skill tool with "research". Use when knowledge outside the current working directory is required.
-- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by calling the Skill tool with "prototype". Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
-- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for "grilling" and "domain-modeling".
+- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that loads the "research" skill (reads its SKILL.md). Use when knowledge outside the current working directory is required.
+- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by loading the "prototype" skill (reading its SKILL.md). Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
+- **Grilling** (HITL): Conversation. The default case. Always load two skills, "grilling" and "domain-modeling" (read each SKILL.md and follow it).
 - **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made: nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides, and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.
 
 ## Fog of war
@@ -108,11 +108,11 @@ Two modes. Either way, **never resolve more than one ticket per session**, with
 
 User invokes with a loose idea.
 
-1. **Name the destination.** Call the Skill tool twice, for "grilling" and "domain-modeling", to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
+1. **Name the destination.** Load the "grilling" and "domain-modeling" skills (read each SKILL.md and follow it) to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
 2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you don't need a map. Stop and ask the user how they'd like to proceed.
 3. **Create the map** (label `wayfinder:map`): Destination and Notes filled in, Decisions-so-far empty, the fog sketched into **Not yet specified**.
 4. **Create the tickets you can specify now** as child issues of the map, then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Write cross-references in that pass too, with real ids: a placeholder `#<n>` auto-links to an unrelated issue. Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog: the **Not yet specified** section.
-5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that calls the Skill tool with "research" to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket. Push the branch but open no PR: it is never merged.
+5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that loads the "research" skill (reads its SKILL.md) to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket. Push the branch but open no PR: it is never merged.
 6. Stop: charting is one session's work; it hand-resolves nothing.
 
 ### Work through the map
@@ -121,7 +121,7 @@ User invokes with a map (URL or number). A ticket is **optional**: without one,
 
 1. Load the **map**: the low-res view, not every ticket body.
 2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
-3. Resolve it as the type its `wayfinder:<type>` label names (see [Ticket Types](#ticket-types)). Read the label, not just the body: the body never states the type. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for "grilling" and "domain-modeling".
+3. Resolve it as the type its `wayfinder:<type>` label names (see [Ticket Types](#ticket-types)). Read the label, not just the body: the body never states the type. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; load whichever skills the `## Notes` block names (read each SKILL.md and follow it). If in doubt, load "grilling" and "domain-modeling" (read each SKILL.md and follow it).
 4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far.
 5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals that a ticket (this one or another) sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or delete those tickets.
 
```
