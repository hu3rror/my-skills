# Unified skill structure — prototype (ticket #26)

Throwaway prototype answering: *what is the unified skill's structure — the
router SKILL.md, the per-branch references, and the open decisions?* This
package is the primary-source capture on the throwaway branch
`prototype/unified-skill-structure`; the migration (map #18) folds the
validated decisions into the real skill at `skills/self/my-skills-maintenance/`
and fills the branch outlines with full prose (the follow-up ticket "the
unified skill's full branch content").

## The question

One discoverable skill replacing `consolidate-strays` and
`my-skills-vendor-sync`, with five management branches — decided here, per the
ticket's five decision points.

## Decisions (adopted)

### 1. Router + references — not router + primitive skills

One discoverable skill (`skills/self/my-skills-maintenance/`); each branch is a
**disclosed reference** under `references/`, loaded only when the router's
classification fires it (writing-for-agents: disclosed reference on the
information hierarchy). The machinery stays in the scripts
(`scripts/vendor-sync.mjs`, `consolidate-strays.mjs`, `vendor-freshness-check.mjs`)
— the single home of the mechanics.

Router + primitives (setup-repo's precedent, ADR-0005) was rejected: it would
reintroduce five discoverable skill surfaces and five always-loaded
descriptions — precisely the discoverable-skill sprawl the redesign collapses.
setup-repo delegates because its primitives are separately useful (and
vendored); these branches are repo-local procedure text one skill uses.

### 2. Branch list — five references, one cross-cutting rule

| Reference | Covers |
|---|---|
| `vendor-sync.md` | resolve pending updates — sync, three-way merge patched files, bump pins, verify, close (A1–A28) |
| `stray-recovery.md` | consolidate/recover stray skills, modified-stray record-first (B1–B16) |
| `patch-record.md` | write/verify per-patch records at `patches/<source>/` (#22 format; D1–D10) |
| `freshness.md` | detect: read pending-update issue, re-derive from dry-run, close stale (C1–C8; the #16 case) |
| `distribute.md` | distribution chain run + retiring skills from the store |

Cross-cutting (not a branch): **load `writing-for-agents` whenever editing or
creating skill content** — carried as a shared rule in the router.

### 3. Description — model-invoked, one tight trigger

`disable-model-invocation` is **omitted** (general-purpose per GLOSSARY,
precedent: `consolidate-strays` today). The description is the single trigger
covering all five branches, scoped with the leading word **"my-skills
aggregation repo"** and the branches' own vocabulary, so other harnesses never
fire it spuriously. The proposed text (in the SKILL.md frontmatter):

> Maintain the my-skills aggregation repo — vendor sync, stray recovery, patch
> records, freshness, and distribution to the canonical skills store. One entry;
> the branch is picked from the request. Use when the user asks to sync or update
> vendored skills, recover or consolidate stray skills, resolve a pending-update
> issue, record a patch deviation, check vendor freshness, distribute skills to
> the store, or retire a skill from it. Every run starts with the read-only
> stray dry-run; all remote or destructive writes (git push, gh issue ops, store
> changes) wait on the user's go-ahead.

Spurious-fire cost is bounded by design: the first step of any run is a
read-only dry-run, and every write waits on the user — a wrongly-fired run
proposes, never executes.

### 4. Retire the two old skills — yes, with a store-side remove

Deleting `skills/self/consolidate-strays/` and `skills/self/my-skills-vendor-sync/`
from the repo is **not** enough to retire them: `npx skills add` does **not**
prune the canonical store (full evidence in `references/distribute.md` step 4 /
R1 research). Retirement = `git rm` the repo copies **and** `npx skills
remove <name>` on the store side, plus the README/GLOSSARY/ADR/scripts prose
updates — all executed in the migration (map #18), when the unified skill
replaces them. Verified: no skill body references either (only README /
GLOSSARY / ADR-0002 / ADR-0004).

### 5. CLI pin in the distribute branch — pin

`npx skills@1.7.0` (current latest, matches the machine's npx cache). Accepting
drift was rejected — rationale in `references/distribute.md` step 2 (R1
research, `docs/research-r1-skills-cli.md`: weekly churn + the #2039 class of
silent flag-drop failures make an unpinned write-heavy step non-reproducible).
Bumped deliberately per upgrade.

## Layout (as it will land at migration)

```
skills/self/my-skills-maintenance/
  SKILL.md                 # router: description + shared rules + mandatory stray step + branch table
  references/
    vendor-sync.md         # resolve pending updates (from my-skills-vendor-sync, restructured)
    stray-recovery.md      # consolidate/recover strays (from consolidate-strays)
    patch-record.md        # per-patch records at patches/<source>/ (#22 format)
    freshness.md           # detect: read pending-update issue, re-derive, stale-close
    distribute.md          # distribution chain, pinned CLI, retire-a-skill remove
```

The router's own content (shared rules, mandatory stray first step, branch
classification, propose-before-write) is complete in the prototype; the
references are structured outlines whose full prose lands with the follow-up
ticket.

## Router design notes

- **Mandatory stray first step** (router level, all branches): per map #25,
  store-drift detection is on-demand — every entry runs the read-only
  `consolidate-strays.mjs` dry-run and settles strays before anything else.
  This is the distribution clobber-window guard; no scheduled stray task.
- **Shared rules live once in the router** (repo-location probe,
  propose-before-write, verify-then-report, GLOSSARY vocabulary,
  writing-for-agents rule) — never restated per branch (writing-for-agents:
  single source of truth).
- **Branches compose in order** (vendor-sync → distribute), never in parallel.

## Edge-case coverage (acceptance trace, inventory #28)

EC codes are the numbered edge cases from the inventory ticket — A1–A28
(vendor sync), B1–B16 (stray recovery), C1–C8 (freshness), D1–D10 (patch
records) — which the redesign must pass item for item (issue #28, resolution
comment).

| Group | ECs | Home |
|---|---|---|
| A1–A28 vendor sync | all | `vendor-sync.md` |
| B1–B16 stray recovery | all | `stray-recovery.md` (B9/B10 route the record-first step through `patch-record.md`) |
| C1–C8 freshness | C1–C3 stay in CI; **C4** (stale-close) is the skill's case; C5–C8 in the branch | `freshness.md` |
| D1–D10 patch records | D1–D3, D5, D7, D10 in `patch-record.md`; D4/D6 lifecycle with `vendor-sync.md`; D8 pins with `vendor-sync.md`; D9 stays in `docs/advisory-notes.md` | `patch-record.md` |

The mandatory stray step additionally covers ADR-0004's "consolidation before
every distribution, never after" across all branches.

## Open items for the follow-up ticket

- Full prose for each reference (steps + completion criteria per writing-for-agents).
- Final description wording (test the trigger against real prompts once the
  skill is distributable).
- Exact `npx skills remove` invocation for store-side retirement (CLI churn).
- `scripts/verify-patch-records.mjs` wiring into script-tests CI.
- GLOSSARY: add **patch record** (per-patch deviation record at `patches/`,
  #22) as the term that replaces **Patch manifest** at migration; the
  prototype already uses it.
