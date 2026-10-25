---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (conditional)

Explore when a ticket's area is unfamiliar to a fresh implementer, or when a ticket sits near the smart-zone edge; skip it only when you already know the area and the ticket is small. The output of exploring is the **orientation** each ticket carries (stable anchors in its Orientation section) so a fresh agent does not have to re-explore — see the smart-zone block below.

Understand the current state of the code, use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window's **smart zone**, not the window's raw advertised ceiling (smart-zone block below)
- Any prefactoring should be done first

</vertical-slice-rules>

<smart-zone>

A slice is sized to fit one fresh session's **smart zone** — roughly the first 100K–150K tokens of a fresh context window, where the agent still reasons sharply. Past it the agent drifts into the **dumb zone**: still executing, but sloppier, more forgetful, more mistake-prone. Plan around the smart zone, never the window's advertised ceiling.

A fresh session pays a **context-loading toll** before it writes a line. The agent grabbing a ticket starts empty: it reads the ticket body, the parent spec and related issues, the area's ADRs and glossary, the coding standards, then navigates the codebase to orient itself. Loading tokens count against the smart zone just as much as implementation tokens — the zone is a budget, and orientation spends it. So the drafter's first job is to **reduce** what the implementer must load: front-load the orientation into the ticket (stable anchors in its Orientation section), and prefactor so the change is easy. Only what cannot be front-loaded stays as a toll to budget for.

The effective implementation budget is **smart zone − context-loading overhead**. Estimate the loading a fresh implementer pays for *this* ticket (low when the drafter already explored and left anchors; high in an unfamiliar or large area) plus the implementation spend (read + write + reasoning the change costs), and cut the ticket until loading + implementation lands comfortably inside the smart zone. The dumb-zone signal is the *total* (loading + work), not the work alone: a ticket small by change size can still overshoot if its area demands heavy loading. When in doubt, split it.

</smart-zone>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Does each ticket carry the orientation a fresh implementer needs (stable anchors in its Orientation section), so it won't have to re-explore?
- Does every ticket sit comfortably inside the smart zone, or would any push its agent into the dumb zone?
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tickets to the configured tracker

Publish the approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured; the tickets are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below: one ticket per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. If the source was an existing issue, make each ticket its sub-issue (tracker doc's operation). Apply the `ready-for-agent` triage label unless instructed otherwise; the tickets are agent-grabbable by construction.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

Do NOT close or modify any parent issue.

<local-ticket-template>

# <NN>: <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

**Orientation:** stable anchors a fresh implementer reads before touching code — ADR IDs, glossary terms, module/package names, the parent issue. No volatile file paths or line numbers. Reduces the context-loading toll so the implementer need not re-explore.

**Scale:** orientation front-loaded (stable anchors above); residual loading + implementation estimated within the smart zone (~100K–150K total session tokens)

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None (can start immediately)".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</local-ticket-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.

## Orientation

Stable anchors a fresh implementer reads before touching code — ADR IDs, glossary terms, module/package names, the parent issue. No volatile file paths or line numbers. Reduces the context-loading toll so the implementer need not re-explore.

**Scale:** orientation front-loaded (stable anchors above); residual loading + implementation estimated within the smart zone (~100K–150K total session tokens)

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking ticket, or "None (can start immediately)". Omit this section when blockers were set as native edges.

</issue-template>

In either form, avoid **volatile references** — specific file paths, line numbers, or dist internals: they go stale fast. **Stable anchors are encouraged instead**: ADR IDs, glossary terms, module/package names, the parent issue — these survive churn and let a fresh implementer load precisely. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

### 6. Language

Write ticket bodies in English. Tickets are work items for agents, not primary content.
