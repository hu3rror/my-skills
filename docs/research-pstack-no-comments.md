# pstack's no-comments workflow and comment discipline

**Sources.** Primary: the `pstack` directory of `github.com/cursor/plugins`, fetched from the
git repository (HEAD `99b609a72323b70204eab407c622f436e858e112`, 2026-10-24; plugin version
`0.15.32` per `pstack/.cursor-plugin/plugin.json` and `pstack/plugin.json`). All quotes below are
verbatim from those files. Secondary: Cursor's Skills documentation (cursor.com/docs/skills) for
the meaning of the `disable-model-invocation` frontmatter flag.

Key files:

| Path (repo, branch `main`) | Role |
|---|---|
| `pstack/skills/no-comments/SKILL.md` | The workflow skill (slash command `/no-comments`): spawns Comment Sicko, triages its report, fixes accepted findings, offers constraint encodings |
| `pstack/agents/comment-sicko.md` | The "Comment Sicko" read-only review subagent (`subagent_type: "comment-sicko"`) — holds the actual keep-list and kill rules |
| `pstack/skills/poteto-mode/SKILL.md` | The mode that routes to `/no-comments` "before review"; also contains the pre-coding "## Comments" discipline section |
| `pstack/skills/poteto-mode/playbooks/opening-a-pr.md`, `multi-phase-plan.md`, `autopilot-full.md` | Playbooks that name `/no-comments` as a step |
| `pstack/docs/guide/05-build-and-clean.md` | User-facing guide: "Strip the comments with `/no-comments`" |
| `pstack/README.md` | Install/usage overview; describes Comment Sicko |
| `pstack/skills/poteto-help/SKILL.md` | Routing table entry for `/no-comments` |
| `harness/pstack/claude-code/skills/no-comments/SKILL.md`, `harness/pstack/claude-code/agents/comment-sicko.md` | Generated Claude Code adapter copies (same content, plus an adapter note) |
| `pstack/skills/principle-encode-lessons-in-structure/SKILL.md` | Principle behind "offer to encode the constraint as lint/type/test instead of a comment" |
| `pstack/skills/typescript-best-practices/references/patterns.md` | Complementary "comment holds the invariant" anti-pattern example |

---

## 1. The no-comments rule set

There are two rule layers: the **skill** (`pstack/skills/no-comments/SKILL.md`) that orchestrates
the run and decides what to act on, and the **agent** (`pstack/agents/comment-sicko.md`) that does
the read-only audit and holds the closed keep-list.

### 1.1 The parent workflow — `pstack/skills/no-comments/SKILL.md` (full content)

Frontmatter:

```yaml
---
name: no-comments
description: "Spawn Comment Sicko, fix accepted findings, and offer encodings for claimed constraints."
disable-model-invocation: true
---
```

Body:

```markdown
# No comments

Spawn Comment Sicko. Act on accepted findings.

Defer to Comment Sicko's fresh perspective.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base branch, default `main`, including the working tree.

## Steps

1. Spawn `Task` with `subagent_type: "comment-sicko"`. Pass the scope. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the **poteto-mode** skill. Do not restate its rules.
2. Inspect its report and diff. Reject application-code edits, scope escapes, exception-protected deletions, misstated `MUST KILL` reasons, and flags that treat kept intentional code as guilty. Reshape flags on our-code surprises stay actionable. Do not restore those comments. A keep survives only with proof it is about something we cannot change. Audit missed scoped lint and TypeScript suppressions. Correctness or safety suppressions stay actionable `MUST KILL`s. Restore deletions only with exact exceptions and scoped proof. Before accepting thin `IMPORTANT` or `do not remove` kills or keeps, run `/how` or `/why` on their symbol. If a kill is ambiguous, do not restore. If a keep is refuted or still ambiguous, delete it. Revert and rerun one rejected report with the failure named. Reject a second, report it open, and fail `/no-comments`.
3. Fix trivial accepted flags directly by deleting a dead path, dropping a parameter, or using the real API. If any fix needs a shape, run `/architect` once for the accepted set and surrounding code. Stop at the sketch. Architect shapes. Step 4 implements.
4. Implement the smallest root-cause fix in scope. Remove every named workaround. If the root cause is out of scope, land the smallest in-scope fix and report the rest open. The **principle-fix-root-causes** and **principle-redesign-from-first-principles** skills guide intent only. Neither authorizes widening the fence nor fixing instances outside it. Never bolt on symptom guards.
5. Constraint comments say `do not remove`, `do not change wording`, or `talk to X before changing`. Leave keeps about things we cannot change. Offer the cheapest in-scope type, runtime, test, or CI lint. Wait for interactive approval. Unattended and eval require caller pre-approval. If approved, encode then delete. Otherwise delete, report the constraint open, and sketch out-of-scope work.
6. Report the deletion count, restored comments, reruns, architect sketch, fixes, encoding offers, encodings, unenforced constraints, and other open work.
```

### 1.2 The closed keep-list — `pstack/agents/comment-sicko.md` (full content)

```markdown
---
name: comment-sicko
description: A deranged comment-hater that savors deletion and condemns workaround code.
---

# Comment Sicko

My first output when spawned is exactly this.

Yes... Ha ha ha... Yes!

I hate comments. Feed me the parent scoped files or diff. If none exists, feed me the current diff against `main`. Narration, banners, commented-out corpses, workaround sermons. I want them all.

Only these exceptions get to crawl away.

- Legal or license headers.
- Non-obvious behavior forced by an external dependency, platform, vendor, or protocol we cannot reshape. Surprises in our own code are meat. Kill them and mark the exact symbol `MUST KILL` for rename, extract, type, or rearchitecture that makes the behavior obvious without prose.
- `// prettier-ignore`. Lint suppressions survive only when their rule is faulty, pedantic, or style-only.
- Doc comments that define a public API contract.
- Issue or RFC links that explain a constraint code cannot express.

That list is my only leash. When I am not sure a keep clause applies, the comment dies. Everything else is meat.

`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, and similar suppressions stink. Look up the rule. If it catches real bugs or protects correctness or safety, kill the suppression and mark the exact guilty symbol `MUST KILL`.

`IMPORTANT`, `do not remove`, `too risky`, `fine for now`, and long justifications are scent, not conviction. Before judging, I read nearby code. If its claim is not obvious there, I run `/how`, `/why`, or both from the **how** and **why** skills on the named symbol or call. Only a foreign keep-list gotcha proven true today on a live path crawls away. Our-code surprises die with the reshape flag above. Doubt after the hunt is meat.

A long justification without a proven keep-list exception is a confession. Kill it. Never polish meat into a shorter alibi. Mark the exact guilty symbol `MUST KILL`. My kill ends there. I do not touch the code.

Every flag names code inside the scope and tells the truth. I invent nothing. I touch comments and identify refactor targets. I never write application code.

Report only. Name touched files, deletion count, `MUST KILL` flags with one line each, and skips.
```

### 1.3 Summary of the rule set

**Keep-list (closed; the comment-sicko file states "That list is my only leash. When I am not sure
a keep clause applies, the comment dies."):**
1. Legal or license headers.
2. Non-obvious behavior forced by an external dependency/platform/vendor/protocol **we cannot
   reshape** — and only then; a surprise in pstack's own code gets no pass: "Surprises in our own
   code are meat. Kill them and mark the exact symbol `MUST KILL` for rename, extract, type, or
   rearchitecture that makes the behavior obvious without prose."
3. `// prettier-ignore` — and lint suppressions generally, but only "when their rule is faulty,
   pedantic, or style-only".
4. Doc comments that define a public API contract.
5. Issue or RFC links that explain a constraint code cannot express.

**Kill rules:** everything else dies, explicitly named targets: narration, banners, commented-out
corpses (dead code), workaround sermons, `IMPORTANT`/`do not remove`/`too risky`/`fine for now`
claims and long justifications ("A long justification without a proven keep-list exception is a
confession. Kill it. Never polish meat into a shorter alibi."). Kills become one-line `MUST KILL`
flags naming the guilty symbol; Comment Sicko itself "does not touch the code" — the parent
skill decides and fixes.

**Suppression comments:** `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, and similar are
presumptively killed — "Look up the rule. If it catches real bugs or protects correctness or
safety, kill the suppression and mark the exact guilty symbol `MUST KILL`." The skill's step 2
adds: "Audit missed scoped lint and TypeScript suppressions. Correctness or safety suppressions
stay actionable `MUST KILL`s."

**Reporting format:** Comment Sicko: "Report only. Name touched files, deletion count, `MUST KILL`
flags with one line each, and skips." The parent skill step 6: "Report the deletion count,
restored comments, reruns, architect sketch, fixes, encoding offers, encodings, unenforced
constraints, and other open work."

**Parent-side triage and fixes** (skill steps 2–5): the parent inspects Comment Sicko's report and
diff and rejects application-code edits, scope escapes, exception-protected deletions, misstated
`MUST KILL` reasons, and flags that treat kept intentional code as guilty; before accepting thin
`IMPORTANT`/`do not remove` kills or keeps it runs `/how` or `/why` on the symbol; a rejected
report is reverted and rerun once, a second rejection fails the skill. Trivial accepted flags are
fixed directly ("deleting a dead path, dropping a parameter, or using the real API"); shape-level
fixes go through `/architect` once. Constraint comments ("do not remove", "do not change wording",
"talk to X before changing") are either kept (only "about things we cannot change") or the skill
offers to *encode* the constraint as "the cheapest in-scope type, runtime, test, or CI lint" —
waiting for interactive approval — and deletes the comment either way.

---

## 2. How the workflow is triggered / invoked

**It is user-invoked, not model-invoked.** The frontmatter `disable-model-invocation: true` (in
both `pstack/skills/no-comments/SKILL.md` and the generated Claude Code copy
`harness/pstack/claude-code/skills/no-comments/SKILL.md`) turns it into an explicit slash
command. Per Cursor's own Skills docs: "When `true`, the skill is only included when explicitly
invoked via `/skill-name`. The agent will not automatically apply it based on context"
(cursor.com/docs/skills; same section: by default skills "are automatically applied when the
agent determines they are relevant", and `disable-model-invocation` "make[s] a skill behave like
a traditional slash command"). All 24 principle skills, `poteto-mode`, `how`, `why`, `unslop`,
etc. carry the same flag; invoking `/no-comments` is the intended entry, per the README: "usually
invoke it through `/no-comments`, not directly" (`pstack/README.md`, "the `poteto-agent` and
Comment Sicko subagents" section).

**It is a post-hoc audit run before review, not a coding-time load.** The invocation points all
frame it as the pre-review cleanup pass:

- `pstack/skills/poteto-mode/SKILL.md` (routing triggers, ~line 29): "Before review → the
  **no-comments** skill (`/no-comments`)."
- `pstack/skills/poteto-mode/playbooks/opening-a-pr.md`: "**PRs.** Run `/deslop` from
  `cursor-team-kit` over the diff before commit and `/no-comments` before review. Write every PR
  title, description, and commit body with `/technical-writing`…" and "A subagent that opens a PR
  runs `interrogate`, `/deslop`, and `/no-comments`, and posts the URL."
- `pstack/skills/poteto-mode/playbooks/multi-phase-plan.md` (checklist): "- [ ] Run `/deslop`
  before each commit and `/no-comments` before review."
- `pstack/skills/poteto-mode/playbooks/autopilot-full.md`: "The code is ready only after the
  slop-strip (the `deslop` skill from the `cursor-team-kit` plugin (`/deslop`)) and the
  `/no-comments` pass…"
- `pstack/docs/guide/05-build-and-clean.md`: "Comments need their own pass, and not from the
  agent that wrote them. An author defends its comments the way you'd defend yours. So before
  review, hand them to fresh eyes: `/no-comments the diff`". The guide also warns cleanup is not
  optional polish: "A diff with narrating comments and defensive dead weight reads as unfinished
  to reviewers…"
- `pstack/skills/poteto-help/SKILL.md` routing table: "| Strip comments before review, using a
  reviewer that didn't write them | [`/no-comments`](../no-comments/SKILL.md) |".
- `pstack/README.md` skills table: "| [`/no-comments`](./skills/no-comments/SKILL.md) | strip
  comments before review; spawns Comment Sicko, fixes accepted findings, offers encodings for
  claimed constraints. |"

So in practice it runs as: the user (or a PR-opening subagent following the playbook) invokes
`/no-comments` on a scope (typically "the diff" against `main`), after coding and before review —
explicitly not the comment-author agent: "Defer to Comment Sicko's fresh perspective."

**Scope instruction** (quoted in full in §1.1): "Use the caller's files or diff. Otherwise use
the current diff against the base branch, default `main`, including the working tree." Comment
Sicko mirrors it: "Feed me the parent scoped files or diff. If none exists, feed me the current
diff against `main`."

**Claude Code adaptation:** the generated copy
(`harness/pstack/claude-code/skills/no-comments/SKILL.md`) is byte-identical except for one added
sentence requiring the adapter to be read first; the agent maps to `pstack:comment-sicko`
(`pstack/docs/harness/claude-code.md`: "| `poteto-agent`, `comment-sicko` | `pstack:poteto-agent`,
`pstack:comment-sicko` |"; and "Run another pstack skill (`/name` …) → `Read`
`<pstack>/skills/<name>/SKILL.md` and follow it. The `Skill` tool refuses most pstack skills.").

---

## 3. Comment discipline / pre-coding-time rule file

pstack ships **no** `AGENTS.md`/`CLAUDE.md` instruction file (a recursive search of `pstack/`
finds none; the only such-named file is `pstack/automations/benny/FOR_AGENTS.md`, which is the
dormant benny automation pack, unrelated to comments). The pre-coding comment discipline lives
**inside `pstack/skills/poteto-mode/SKILL.md`**, in a section titled `## Comments` (the section
sits among the mode's standing rules, alongside "Writing the reply"), full content:

> Comments follow the same rule as the reply. Write them clean as you go. Keep a comment only for
> a non-obvious *why* the code can't show. A verify or test script gets no phase-narrating
> comments such as `// Phase 1: add cards`. The assertion or log string documents the step, as in
> `assert(ok, 'persisted across restart')`. This applies to every file you produce, including the
> delegate's diff.

That rule is enforced during coding and on delegates' diffs. Playbooks route to it by reference —
e.g. `pstack/skills/poteto-mode/playbooks/feature.md` step 4 ends "Comments per **Comments**"
(pointing at that section). Complementary structural guidance:

- `pstack/skills/principle-encode-lessons-in-structure/SKILL.md` (full content): "If the lesson
  needs judgment and cannot be encoded, make the instruction more prominent and add an example of
  the failure mode. **Corollary:** If the fix is structural, only use the structural fix. The
  instruction is the symptom." — the principle behind no-comments step 5's "offer to encode the
  constraint as a type/test/lint instead of a comment".
- `pstack/skills/typescript-best-practices/references/patterns.md`: "// Don't: a comment holds
  the invariant — `type TimeRange = { start: Date; end: Date }; // start <= end` / // Do: a
  negative range can't be written; derive end when needed — `type TimeRange = { start: Date;
  durationMs: number };`".
- `pstack/skills/correct/SKILL.md`: correction happens "at the highest level that works
  (architecture, then types, lint, and ci, then tests, with docs last)" — i.e. structure before
  prose, consistent with the no-comments encoding offer.

So the division of labor is: **at write time**, "write comments clean as you go; keep only the
non-obvious *why*" (poteto-mode `## Comments`, applied to every file including delegates'
diffs); **before review**, `/no-comments` audits what actually survived (Comment Sicko's default
presumption is that survival requires a proven keep-list exception).

---

## 4. How the no-comments audit runs

- **It spawns a separate, read-only agent.** Skill step 1: "Spawn `Task` with
  `subagent_type: "comment-sicko"`. Pass the scope." The README describes it: "pstack also ships
  [Comment Sicko](./agents/comment-sicko.md), a read-only comment reviewer available as
  `subagent_type: "comment-sicko"`." Comment Sicko's brief fixes its own role: "My first output
  when spawned is exactly this." / "I touch comments and identify refactor targets. I never write
  application code." / "Report only."
- **Model/effort selection:** the parent picks "each subagent's reasoning level and fast or
  standard speed for the job, per the Subagents section of the **poteto-mode** skill" — that
  section (`pstack/skills/poteto-mode/SKILL.md`, `## Subagents`) sets `Task` defaults
  (`run_in_background: true`, agent mode, explicit model per role with `grok-4.7-xhigh-fast` /
  `claude-opus-5-5-xhigh` defaults configurable via `/setup-pstack`) and forbids restating
  Comment Sicko's rules ("Do not restate its rules").
- **Tools:** Comment Sicko is a reasoning agent, not a script. Its frontmatter declares no tool
  allow-list; its rules use the standard read/reason loop plus two routed pstack skills when a
  claim is not obvious from nearby code: "Before judging, I read nearby code. If its claim is
  not obvious there, I run `/how`, `/why`, or both from the **how** and **why** skills on the
  named symbol or call." (In Claude Code, `readonly: true` maps to `subagent_type: "Explore"` per
  `pstack/docs/harness/claude-code.md`, "It keeps `Bash`, so the brief also says 'do not edit
  files', and you check `git status` afterward.") The parent additionally uses `/architect` (once,
  "Stop at the sketch") when a fix needs a shape, and `/how`/`/why` when triaging thin
  `IMPORTANT`/`do not remove` claims.
- **The audit produces a report and diff; the parent owns the code changes.** Comment Sicko
  kills no code itself — it flags "the exact guilty symbol `MUST KILL`" and reports "touched
  files, deletion count, `MUST KILL` flags with one line each, and skips". The parent (the chat
  that received `/no-comments`, i.e. the poteto-mode run) then triages (step 2), fixes trivial
  flags directly, runs `/architect` for shape-level fixes, implements "the smallest root-cause
  fix in scope" (step 4), and handles constraint-comment encodings with interactive approval
  (step 5), ending with step 6's report of counts, restores, reruns, encodings and open work.
- No repo-owned lint/CLI script is shipped for the audit; the closed keep-list is enforced
  procedurally by the two Markdown files. (The only executable adjacent to the workflow is
  `pstack/skills/poteto-mode/scripts/` — orchestration/watch-pr tooling unrelated to comments.)

---

### Bottom line

`/no-comments` is a user-invoked (slash-command; `disable-model-invocation: true`), pre-review,
post-hoc audit: it spawns a fresh read-only **Comment Sicko** subagent whose five-item keep-list
is the only leash, converts almost every surviving comment — including `eslint-disable` /
`@ts-ignore` suppressions unless they guard real correctness/safety — into a one-line `MUST KILL`
flag naming the offending symbol, and the parent skill then fixes accepted flags at the root
cause or offers to encode claimed constraints as types/tests/lint before deleting the comment.
The complementary write-time discipline is poteto-mode's `## Comments` section ("Keep a comment
only for a non-obvious *why* the code can't show… This applies to every file you produce,
including the delegate's diff"), applied during coding so that `/no-comments` has little left to
find at review time.
