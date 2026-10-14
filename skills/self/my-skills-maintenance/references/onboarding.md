# Branch: onboarding — integrate a new skill into the repo

Route a new skill into the aggregation repo: classify where it sits, follow
the existing path when one exists, complete the two blank paths (new upstream
source, self-authored / loose file), and gate the skill's content on
`writing-for-agents` before it enters. This is the entry for any "integrate /
adopt / bring in / add a new skill" request — the request the router's
`Pick a branch` table sends here.

## 1. Classify where the skill sits — location, not intention

Decide the path by where the skill currently is (never by guessing what the
user intends to do with it):

| Where the skill is now | Path |
|---|---|
| already in the canonical store (`~/.agents/skills`), untracked or modified | **stray-recovery** — load `stray-recovery.md`; adopt or recover it there |
| an upstream source this repo already vendors (mattpocock, kill-ai-slop, cloudflare) | **vendor-sync** — a new upstream file syncs in as an `added` item — load `vendor-sync.md` |
| a brand-new upstream source (a repo not yet registered in `vendor/`) | step 3 below |
| a self-authored or loose skill file (written locally, copied from elsewhere, no upstream) | step 4 below |

Provenance is the user's judgement, not a guess: a self-authored skill goes to
`skills/self/<name>`, a provenance-unknown file waits under
`skills/other/<name>` per GLOSSARY — note the repo has **no `skills/other/`
directory today**, so a provenance-unknown file is a question to the user
(first instance creates the directory), never a silent default.

**Done when**: the skill has exactly one path, and the user confirmed the
classification.

## 2. Gate the content — load `writing-for-agents` first

Every onboarded skill's `SKILL.md` must meet the drafting standard before it
enters the repo (shared rule 4): load `writing-for-agents`
(`skills/mattpocock/productivity/writing-for-agents/SKILL.md`, plus its
`SKILL-MECHANICS.md` for frontmatter and the invocation choice) and review the
skill against it. Apply its levers (rewrite, then re-check) until the gate
passes:

- **frontmatter** — `name` matches the directory; `description` present;
- **invocation** — `disable-model-invocation: true` for pi-specific or
  explicitly-invoked skills; model-invocation only when the description is
  scoped tightly enough that other harnesses never fire it spuriously
  (SKILL-MECHANICS);
- **portability** — no machine-specific paths in the skill files (enforced by
  `scripts/skill-hygiene.test.mjs`): use `~`, environment variables, or
  repo-relative forms.

`writing-for-agents` stays a separate, vendored reference — reference it,
never copy its body into this branch (ADR-0008).

**Done when**: all three gate checks pass and the skill reads like the
`writing-for-agents` reference would have it.

## 3. New upstream source — register, pin, sync

A source this repo does not yet vendor needs a meta file and a sync entry.
The steps are manual and deliberate — a new source is a rare, curation-level
decision (ADR-0006), not a scripted one:

1. **Write `vendor/<name>.json`** — schema in `vendor/README.md`: `name`,
   `repo`, `url`, `pin` (the upstream HEAD the first sync merges against),
   `exclusions` (upstream paths this repo does not want, with reasons),
   `kind: manual-fork` when the sync must not manage it.
2. **Register the source in `scripts/vendor-sync.mjs` `SOURCES`** (the `const`
   at line ~47): `name`, `targetRoot`, `skillRoots` — copy the shape of an
   existing entry; `fixedSkillRoots` maps upstream paths to
   `skills/<source>/`. The sync refuses to run when meta is missing or
   invalid, so a missing file fails loudly.
3. **Sync and verify**: `node scripts/vendor-sync.mjs --dry-run`, then the
   real sync, then `node --test scripts/*.test.mjs` — the new skill's copies
   land under `skills/<source>/` and the suite passes.
4. **Keep the vendor docs truthful**: add the row to `vendor/README.md`
   `Sources` table — its "never to the script" line excludes this one-time
   SOURCES registration (a deliberate source addition, not a curation edit).

**Done when**: the new source's skills sit in `skills/<source>/`, the pin
records the merged base, the vendor docs name the source, and the script
suite passes.

## 4. Self-authored or loose file — place under `skills/self/`

1. Create `skills/self/<name>/SKILL.md` (+ helper files) with the gated
   content from step 2.
2. A fresh self-authored skill carries no upstream and no patch record
   (GLOSSARY: self-authored skills have no upstream; per-patch records cover
   deviations from upstream) — record nothing at `patches/` for a new skill.
3. Update the inventory docs that name the skill: the `README.md` layout
   table (and `README_zh-CN.md`), and `GLOSSARY.md` only when a new flow term
   appears.

**Done when**: the skill's copy is commit-ready under `skills/self/<name>/`
and the inventory docs name it.

## 5. Finish — the distribution proposal

End with the shared quartet, in order (shared rule 6): commit → push →
distribution (load `distribute.md`). The distribution run makes the new skill
live in the canonical store; the router's mandatory stray dry-run (zero
store-side strays) gates it. Nothing remote or destructive happens without
the user's go-ahead.

**Done when**: the proposal is made, and the user has approved (commit + push
+ distribution landed) or explicitly declined.

## Interaction note — which skill the human loads

A user who wants a new skill integrated loads `my-skills-maintenance` and
names the skill and its origin — the skill file itself is usage
documentation, not an integration plan, so loading it alone does not start
this branch. This branch is the one entry: any "add / integrate / bring in a
skill" request routes here first.
