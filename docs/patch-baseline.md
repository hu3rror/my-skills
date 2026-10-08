# Patch baseline — the A-class patch rows vs their pinned commits

Mechanical baseline for the migration of the A-class patch rows in `PATCHES.md`
(map ticket #18: _Redesign skill management_). Produced 2026-10-06.

For each A-class row: the file's pinned upstream commit (from the **Upstream references**
table) was fetched, the recorded file was diffed against the pinned blob, and the row's
"`git diff` shows exactly …" claim was checked against the current diff. The report is the
migration's completeness input (ticket _Patch record format prototype_) and the acceptance
comparison after migration: a migrated record must reproduce these same hunks against the
same pins.

> **Count note.** The originating issue (#21) and the map (#18) say "28 A-class patch rows…
> 26 diff-verifiable, 2 behavioral". The current `PATCHES.md` A-class table holds **27 rows**,
> numbered 1–28 with **#5 absent** (dropped in commit `8bdc964`, curation of the
> distribution set); the numbering gap is preserved so historical rows keep their
> identities. Verifying the 27 present rows: **25 diff-asserted + 2 behavioral (#7, #15)** —
> i.e. **25 of 25 diff claims hold**, not 26. The migration should reconcile the manifest
> count against the issue/map "28" figure.

## Method

- Pins read from `PATCHES.md` **Upstream references**:
  - mattpocock/skills `4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d`
  - yetone/kill-ai-slop `f6e2ae32b30443ec7bd0da4da971ee18d8f8ffcb`
  - github/awesome-copilot `caab1f623bb68a330f294a11279597d7ae7be737`
  - cloudflare/security-audit-skill `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (no A-class rows — source "ships unpatched")
- Upstream → local path mapping: `skills/mattpocock/<X>` → upstream `skills/<X>`;
  `skills/kill-ai-slop/kill-ai-slop/<X>` → upstream `skill/<X>`;
  `skills/awesome-copilot/create-readme/<X>` → upstream `skills/create-readme/<X>`.
- Diffs are LF-normalized on both sides (upstream blob vs local working tree), so a
  checkout line-ending translation can never surface as drift. Byte-compare otherwise.

## Verdict summary

A row's "diff assertion" is the `Verification method` claim in `PATCHES.md` that says
"`git diff` vs pinned upstream shows exactly …" — checked here hunk-by-hunk against the
actual diff. Rows verified behaviorally instead (no diff assertion) are marked `—`.

| # | File | Claim | Holds today |
|---|---|---|---|
| 1 | `skills/mattpocock/engineering/research/SKILL.md` | exactly the 2 added push lines (file also carries #28) | ✅ |
| 2 | `skills/mattpocock/engineering/wayfinder/SKILL.md` | exactly the 1 extended step-5 line (file also carries #25) | ✅ |
| 3 | `.../setup-matt-pocock-skills/issue-tracker-github.md` | exactly the 1 replaced `--add-assignee` line | ✅ |
| 4 | `skills/kill-ai-slop/kill-ai-slop/SKILL.md` | frontmatter line + rewritten description block | ✅ |
| 6 | `skills/mattpocock/engineering/diagnosing-bugs/SKILL.md` | exactly the HITL-loop added sentence (file also carries #27) | ✅ |
| 7 | `skills/self/write-release-notes/SKILL.md` | behavioral — **out of the diff assertion** | — |
| 8 | `.../issue-tracker-gitlab.md` | exactly the changed lines (here-string + claim line) | ✅ |
| 9 | `skills/mattpocock/engineering/ask-matt/SKILL.md` | exactly the replaced precondition paragraph (file also carries #16) | ✅ |
| 10 | `skills/awesome-copilot/create-readme/SKILL.md` | step 2 rewritten + the 4 `references/` files added | ✅ |
| 11 | `skills/mattpocock/engineering/code-review/SKILL.md` | exactly the 2 added lines | ✅ |
| 12 | `.../improve-codebase-architecture/HTML-REPORT.md` | exactly the 2 replaced lines | ✅ |
| 13 | `.../improve-codebase-architecture/SKILL.md` | exactly the 2 added lines (file also carries #22) | ✅ |
| 14 | `skills/mattpocock/engineering/codebase-design/SKILL.md` | exactly the 1 replaced description line | ✅ |
| 15 | `skills/self/write-release-notes/references/release-notes-guide.md` | behavioral — **out of the diff assertion** | — |
| 16 | `skills/mattpocock/engineering/ask-matt/SKILL.md` | exactly the 4 dropped routing references (alongside #9) | ✅ |
| 17 | `skills/mattpocock/productivity/grill-me/SKILL.md` | exactly the 1 replaced line | ✅ |
| 18 | `skills/mattpocock/engineering/grill-with-docs/SKILL.md` | exactly the 1 replaced line | ✅ |
| 19 | `skills/mattpocock/productivity/handoff/SKILL.md` | 5 lines added + 1 replaced | ✅ |
| 20 | `skills/mattpocock/productivity/grilling/SKILL.md` | exactly the 2 added lines | ✅ |
| 21 | `skills/mattpocock/engineering/implement-spec/SKILL.md` | exactly the 2 replaced lines | ✅ |
| 22 | `.../improve-codebase-architecture/SKILL.md` | exactly #13's 2 added lines + this patch's 4 replaced | ✅ |
| 23 | `skills/mattpocock/engineering/retro/SKILL.md` | exactly the 1 replaced step-1 line (file also carries #26) | ✅ |
| 24 | `skills/mattpocock/engineering/tdd/SKILL.md` | exactly the 1 replaced line | ✅ |
| 25 | `skills/mattpocock/engineering/wayfinder/SKILL.md` | exactly the 6 replaced lines (step-5 merges #2) | ✅ |
| 26 | `skills/mattpocock/engineering/retro/SKILL.md` | exactly the 1 extended step-2 line (alongside #23) | ✅ |
| 27 | `skills/mattpocock/engineering/diagnosing-bugs/SKILL.md` | exactly the 2 added lines (alongside #6) | ✅ |
| 28 | `skills/mattpocock/engineering/research/SKILL.md` | exactly the rewritten step-3 line (file also carries #1) | ✅ |

**25 of 25 diff-assertion rows hold today** against their pinned commits. Rows #7 and #15
are behavioral (self-authored, no upstream diff baseline) and are out of the diff assertion,
as the issue notes. (27 rows present in the manifest; see the count note above.)

## Actual diff hunks — multi-patch files

These six files each carry more than one A-class patch; the full diff against the pin is
reproduced so each row's claim can be checked against the exact hunks, and so the future
migration can split them into per-patch records unambiguously.

### research — rows #1 + #28 (`skills/mattpocock/engineering/research/SKILL.md`)

```diff
@@ -9,4 +9,6 @@
 
 1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
 2. Write the findings to a single Markdown file, citing each claim's source.
-3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
+3. Save it inside the repo's working tree, where the repo already keeps such notes: match the existing convention, and if there is none, pick a repo-relative location (e.g. `docs/research-<slug>.md` or next to the topic it concerns) and state it. The findings path must resolve inside the repo — check with `git rev-parse --show-toplevel` — so the file is a committed artifact of the work it informs.
+
+The agent's completion is **pushed** back to you: when it finishes (or fails, or is stopped), a notification arrives in your context carrying the findings path. Read the file when the push lands — don't poll for it, and don't plan around reading it at a fixed time.
```

- **#1** claim (the 2 added push lines): the blank line + the pushed-completion sentence are
  exactly the 2 added lines. **Holds.**
- **#28** claim (rewritten step-3 line): exactly the 1 replaced line. **Holds.**

### `skills/mattpocock/engineering/ask-matt/SKILL.md` — rows #9 + #16

```diff
@@ -41,10 +41,6 @@
 
 A starting situation that generates work, then merges onto the main flow.
 
-- **Bugs and requests piling up** → **`/triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/implement`** later picks up.
-
-  Triage is only for issues **you didn't create**: bug reports, incoming feature requests, anything that arrives raw. Tickets that `/to-tickets` produced are already agent-ready, so **don't triage them**.
-
 - **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** (one command that already goes red on *this* bug), then fixes with a regression test. Once the fix is in, run **`/retro`** in the same session to ask what would have prevented the bug; where the real finding is that there's no good seam to lock it down, that's a job for **`/improve-codebase-architecture`**.
 
 - **A huge, foggy effort: a greenfield project or a huge feature build, too big for one session** → **`/wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time, producing **decisions, not deliverables**, until the fog is pushed back and the way is clear. Where **`/grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't, and it's slower and denser, so save it for exactly that, never a well-scoped feature.
@@ -81,15 +77,13 @@
 Off the main flow entirely.
 
 - **`/grill-me`**: the same relentless interview as `/grill-with-docs`, but **stateless**: it saves nothing locally and builds no `GLOSSARY.md`. Reach for it when you are **not working in a working directory** (sharpening a plan, a design, a piece of writing, anything with no repo under it). If you are in a working directory, use `/grill-with-docs` instead: it runs the same interview and leaves a paper trail, so it is strictly the better one.
-- **`/grilling`** is the interview primitive itself: rounds, the frontier, facts are the agent's job and decisions are yours. `/grill-me` and `/grill-with-docs` are the two named ways in, and `/triage`, `/wayfinder` and `/improve-codebase-architecture` all run it internally. Reach for it directly only when you want the interview with no wrapper around it.
+- **`/grilling`** is the interview primitive itself: rounds, the frontier, facts are the agent's job and decisions are yours. `/grill-me` and `/grill-with-docs` are the two named ways in, and `/wayfinder` and `/improve-codebase-architecture` all run it internally. Reach for it directly only when you want the interview with no wrapper around it.
 - **`/prototype`** is a small, throwaway program that answers one design question: does this state model feel right, or what should this UI look like. Throwaway is a constraint on how the code is written, not a promise to destroy it: the answer folds into the real code, and the prototype itself is kept as a **primary source** on a `prototype/<name>` branch out of main, pointed at from the implementation issue. It's the detour in step 2 of the main flow, but reach for it any time a design question is hard to settle on paper.
 - **`/research`**: delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces is something to take *into* the main flow at `/grill-with-docs`, since research feeds the thinking rather than replacing it.
-- **`/to-questionnaire`** comes in when the thing blocking you isn't in your head or the codebase but in **someone else's**, and it writes them a questionnaire to fill in. It's the inverse of `/grill-me`: instead of interviewing you about the subject, it interviews you about the **send** (who it's going to, what you need back) and aims the questions at the gap. What comes back is material for `/grill-with-docs` or `/to-spec`.
-- **`/wizard`** is for the steps only a **human** can take: provisioning infrastructure, setting up credentials or CI secrets, clicking through an unfamiliar third-party dashboard, running a one-off migration or cutover. It generates an interactive bash script that opens each URL, captures each value, and writes it into `.env` and GitHub secrets, so the procedure stops being something you re-explain to an agent every time. Model-invoked, so the agent reaches for it the moment it hits a wall only you can pass. If the agent could just do it itself, it should; this is for where a human is genuinely in the loop.
 - **`/wait-what`** is the corrective for a message that didn't land. Use it mid-conversation, inside any other skill, and the agent re-pitches what it just said with the context you were missing, in plain English, using the `GLOSSARY.md` vocabulary. It works after the fact; `/grill-with-docs` is the upfront cure, because a shared language agreed early is what stops the jargon arriving at all.
 - **`/teach`**: learn a concept over multiple sessions, using the current directory as a stateful workspace.
 - **`/writing-for-agents`** is the reference for writing documents agents consume: skills, AGENTS.md, pointed-at docs.
 
 ## Precondition
 
-**`/setup-matt-pocock-skills`**: run before your first engineering flow to configure the issue tracker, triage labels, and doc layout the other skills assume. Custom issue trackers also work.
+**`/setup-repo`**: run before your first engineering flow to configure the issue tracker, triage labels, doc layout, and coding standards the other skills assume — it drives `/setup-matt-pocock-skills` then `/setup-coding-standards`, with your standard answers pre-filled; the primitives stay available when you want only part of the setup. Custom issue trackers also work.
```

- **#16** claim (the 4 dangling routing references): `/triage` on-ramp row, `/triage` inline in
  the grilling-family sentence, the `/to-questionnaire` bullet, the `/wizard` bullet — all
  removed, nothing else. **Holds.**
- **#9** claim (replaced precondition paragraph): the `/setup-repo` paragraph replaces
  `/setup-matt-pocock-skills`. **Holds.**

### `skills/mattpocock/engineering/wayfinder/SKILL.md` — rows #2 + #25

```diff
@@ -74,9 +74,9 @@
 
 Every ticket is either **HITL** (human in the loop, worked _with_ a human who speaks for themselves) or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).
 
-- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that calls the Skill tool with "research". Use when knowledge outside the current working directory is required.
-- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by calling the Skill tool with "prototype". Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
-- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for "grilling" and "domain-modeling".
+- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that loads the "research" skill (reads its SKILL.md). Use when knowledge outside the current working directory is required.
+- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or UI/logic code) by loading the "prototype" skill (reading its SKILL.md). Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
+- **Grilling** (HITL): Conversation. The default case. Always load two skills, "grilling" and "domain-modeling" (read each SKILL.md and follow it).
 - **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made: nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides, and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.
 
 ## Fog of war
@@ -108,11 +108,11 @@
 
 User invokes with a loose idea.
 
-1. **Name the destination.** Call the Skill tool twice, for "grilling" and "domain-modeling", to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
+1. **Name the destination.** Load the "grilling" and "domain-modeling" skills (read each SKILL.md and follow it) to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
 2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you don't need a map. Stop and ask the user how they'd like to proceed.
 3. **Create the map** (label `wayfinder:map`): Destination and Notes filled in, Decisions-so-far empty, the fog sketched into **Not yet specified**.
 4. **Create the tickets you can specify now** as child issues of the map, then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog: the **Not yet specified** section.
-5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that calls the Skill tool with "research" to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket.
+5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that loads the "research" skill (reads its SKILL.md) to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket. Completion arrives as a **push** carrying the findings path: read the file when the push lands — or, since research is session-scoped and charting stops here, resume from the branch's checkpointed findings in a later session if the run didn't finish before this one ended.
 6. Stop: charting is one session's work; it hand-resolves nothing.
 
 ### Work through the map
@@ -121,7 +121,7 @@
 
 1. Load the **map**: the low-res view, not every ticket body.
 2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
-3. Resolve it. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for "grilling" and "domain-modeling".
+3. Resolve it. **Zoom as needed**: fetch the full body of any related or closed ticket on demand; load whichever skills the `## Notes` block names (read each SKILL.md and follow it). If in doubt, load "grilling" and "domain-modeling" (read each SKILL.md and follow it).
 4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far.
 5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals that a ticket (this one or another) sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or delete those tickets.
```

- **#25** claim (6 replaced lines): 3 (ticket-type list) + step 1 + step 5 + step 3 = 6. **Holds.**
- **#2** claim (1 extended step-5 line): the step-5 line's push-completion extension is the
  only #2 change, merged onto the same line as #25's rewrite. **Holds.**

### `skills/mattpocock/engineering/diagnosing-bugs/SKILL.md` — rows #6 + #27

```diff
@@ -9,6 +9,8 @@
 
 When exploring the codebase, read `GLOSSARY.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.
 
+When the bug's trail runs through past pi sessions (it happened in an earlier run, or a behavior changed between runs), search them with the `pi-session-search` skill instead of ad-hoc grep/python: it is UTF-8-safe, knows the JSONL structure, and caps output.
+
 ## Redact
 
 This skill has you show commands, outputs and captured artifacts. **Redact every secret first**: write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.
@@ -32,7 +34,7 @@
 7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
 8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
 9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
-10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.
+10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you. On Windows, run it with Git Bash or WSL — it's a bash script and PowerShell can't run it directly (`bash scripts/hitl-loop.template.sh` from Git Bash, or `wsl bash "$(wsl wslpath -a 'C:/path/to/hitl-loop.template.sh')"` from PowerShell).
 
 Build the right feedback loop, and the bug is 90% fixed.
```

- **#27** claim (2 added lines): the blank line + the `pi-session-search` pointer line after the
  "When exploring the codebase…" paragraph. **Holds.**
- **#6** claim (added HITL-loop sentence): the step-10 line gains the Windows runtime note. **Holds.**

### `skills/mattpocock/engineering/improve-codebase-architecture/SKILL.md` — rows #13 + #22

```diff
@@ -10,7 +10,7 @@
 
 This command is _informed_ by the project's domain model and built on a shared design vocabulary:
 
-- Call the Skill tool with "codebase-design" for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion, and don't drift into "component," "service," "API," or "boundary."
+- Load the "codebase-design" skill (read its SKILL.md) for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion, and don't drift into "component," "service," "API," or "boundary."
 - The domain language in `GLOSSARY.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate.
 
 ## Process
@@ -36,6 +36,8 @@
 
 ### 2. Present candidates as an HTML report
 
+**Report language follows the user's conversation.** Write the report in the language the user is working in (English when they write English, Chinese when they write Chinese, etc.). Architecture glossary terms keep their English form on first use, followed by a parenthetical translation into the report language (e.g. *locality*（局部性）); afterwards use whichever reads more naturally. Sub-agent exploration notes follow the same language.
+
 Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows) and tell them the absolute path.
 
 The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals: use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.
@@ -61,11 +63,11 @@
 
 ### 3. Grilling loop
 
-Once the user picks a candidate, call the Skill tool with "grilling" to walk the decision tree with them: constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.
+Once the user picks a candidate, load the "grilling" skill (read its SKILL.md) to walk the decision tree with them: constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.
 
-Side effects happen inline as decisions crystallize; call the Skill tool with "domain-modeling" to keep the domain model current as you go:
+Side effects happen inline as decisions crystallize; load the "domain-modeling" skill (read its SKILL.md) to keep the domain model current as you go:
 
 - **Naming a deepened module after a concept not in `GLOSSARY.md`?** Add the term to `GLOSSARY.md`. Create the file lazily if it doesn't exist.
 - **Sharpening a fuzzy term during the conversation?** Update `GLOSSARY.md` right there.
 - **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing; skip ephemeral reasons ("not worth it right now") and self-evident ones.
-- **Want to explore alternative interfaces for the deepened module?** Call the Skill tool with "codebase-design" and use its design-it-twice parallel sub-agent pattern.
+- **Want to explore alternative interfaces for the deepened module?** Load the "codebase-design" skill (read its SKILL.md) and use its design-it-twice parallel sub-agent pattern.
```

- **#13** claim (2 added lines): the blank line + the report-language sentence in step 2. **Holds.**
- **#22** claim (4 replaced lines on top of #13): the vocabulary line, the grilling line, the
  domain-modeling line, the codebase-design bullet — exactly 4 replaced lines alongside #13's
  2 added lines. **Holds.**

### `skills/mattpocock/engineering/retro/SKILL.md` — rows #23 + #26

```diff
@@ -8,9 +8,9 @@
 
 ## Steps
 
-1. Call the Skill tool with `writing-for-agents` for the writing style guide.
+1. Load the `writing-for-agents` skill (read its SKILL.md) for the writing style guide.
 
-2. Read the primary sources for the session the user specifies. This may mean searching through session logs on this machine. If the user doesn't specify a session, default to the current one.
+2. Read the primary sources for the session the user specifies. This may mean searching through session logs on this machine — use the `pi-session-search` skill (UTF-8-safe query over `~/.pi/agent/sessions` JSONL; supersedes ad-hoc grep/python one-liners). If the user doesn't specify a session, default to the current one.
 
 3. Look for candidates for improvement in these categories.
```

- **#23** claim (1 replaced step-1 line): the `writing-for-agents` invocation line. **Holds.**
- **#26** claim (1 extended step-2 line): the session-log search pointer. **Holds.**

## Drift observations (non-claim)

- `skills/awesome-copilot/create-readme/SKILL.md` (#10): the local file had lost its
  trailing newline vs the pinned blob (a zero-content byte difference on the final step-6
  line) — **fixed 2026-10-06**, the trailing newline restored, so a byte-exact artifact
  comparison during migration now compares clean on this file.
- No other file shows a claim-unrelated hunk. All 25 diff-assertion diffs contain exactly
  the lines their rows describe.
- **Count reconciliation**: the manifest's 25 diff-asserted rows is one fewer than the
  issue/map figure of "26 diff-verifiable" because #5 is absent from the current table.

## Repro

```sh
git init <repo>; git -C <repo> remote add origin <url>
git -C <repo> fetch --depth 1 origin <pin>
git show <pin>:<upstream-path> | sed 's/\r$//' > up.txt
sed 's/\r$//' <local-path> > local.txt
diff -u up.txt local.txt
```