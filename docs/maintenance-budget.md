# Maintenance budget

> The measurable answer to ticket #27 — *what maintenance cost baseline must
> the new system meet?* (ticket title: "Maintenance cost baseline and
> complexity budget"). Scope: map ticket #18 — "Redesign skill management:
> one unified skill, machine-verified patch records". Decision record:
> ADR-0007. Term: **maintenance budget** (GLOSSARY). Enforced by:
> `scripts/maintenance-budget.test.mjs` (runs in the existing script-tests CI
> job — no new workflow).

Status: accepted (2026-10-06). Baseline measured at commit `7c0c3a4`.

This is the measurable answer to ticket #27's question — *what maintenance
cost baseline must the new system meet?* The redesign must prove it against
these numbers at migration, not against a feeling.

## Baseline measurements

### Scripts: code + tests (the complexity budget's core)

Measured with `wc -l` at `7c0c3a4`, reproduced exactly by the guard test
(`scripts/maintenance-budget.test.mjs`, which counts `\n` per file — wc -l
parity, CRLF-robust):

| File | Lines | Role |
|---|---|---|
| `consolidate-strays.mjs` | 565 | code |
| `consolidate-strays.test.mjs` | 846 | tests |
| `skill-hygiene.test.mjs` | 60 | tests |
| `vendor-freshness-check.mjs` | 209 | code |
| `vendor-sync-merge.test.mjs` | 352 | tests |
| `vendor-sync.mjs` | 797 | code |
| `vendor-sync.test.mjs` | 230 | tests |
| **Total** | **3059** | code 1571 + tests 1488 |

### Migration re-measurement (2026-10-06)

At the map #18 migration the 3059 baseline grew to **4101** (the guard's
measured total). The delta is entirely the new mechanism the migration ships,
already present in `scripts/`:

| File | Line-count delta over 3059 | Role |
|---|---|---|
| `verify-patch-records.mjs` | 466 | code — the patch-record verifier (machine-verified records) |
| `verify-patch-records.test.mjs` | 544 | tests — the verifier's offline suite |
| `consolidate-strays.mjs` / `.test.mjs` | +1 / −1 → 566 / 845 | row-template block → per-patch-record pointer |
| `vendor-sync.mjs` | +32 → 829 | skip-set reads records' `file:`; exports the verifier's clone/cat-file |

This growth is deliberate and documented per the bump rule: the per-patch
machine-verified record mechanism and its verifier are the point of the
redesign, and this re-measured ceiling bounds them (code+tests **≤ 4101**, CI
jobs budget unchanged).

**Reconciliation with the 2350 cited in #27.** 2350 was the charting-day
measure (commit `8bdc964`, 2026-10-06). The +709 delta is entirely
already-landed new-mechanism prep, so the budget re-bases to today's measure
and the intent holds: the new mechanism must not be larger than the mechanism
it replaces, including the prep that already serves it.

- #23 rehoming (`c9715dd`): `vendor-sync.mjs` 482 → 797 (+315), `vendor-sync.test.mjs` 188 → 230 (+42);
- #24 merge subcommand (`4db8749`): `vendor-sync-merge.test.mjs` (+352).

**Budget rule**: total script lines (code + tests) ≤ **5155** (re-measured at
the 2026-10-06 migration, formerly 3059 — see the re-measurement note above;
raised from 4101 on 2026-10-07 for the ADR-0009 repo-location guard, from
4327 on 2026-10-12 for the overlapping-hunk guard, and from 4407 on
2026-10-19 for the patch-manifest HTML report, from 5115 on 2026-10-22 for the defaultLock XDG lock-path fix, and from 5144 on 2026-10-29 for the ste-zh onboarding — see the notes below).
Bumping it is a **deliberate, documented act** (date + reason here and in the
guard).

### Repo-location guard (ADR-0009, 2026-10-07)

Budget raised to **4327** (+226 over 4101) for the repo-location guard:
`scripts/repo-guard.mjs` + `repo-guard.test.mjs` (the shared shape+identity
check the maintenance scripts derive their root from) and the guard wiring in
`consolidate-strays.mjs` / `vendor-sync.mjs` / `verify-patch-records.mjs` +
one CLI test in `consolidate-strays.test.mjs`. Recorded per the bump rule
(value raised in the guard test; date + reason here).

### Overlapping-hunk guard (2026-10-12)

Budget raised to **4407** (+80 over 4327) for the overlapping-hunk guard:
`verify-patch-records.mjs` gains `overlappingHunkRanges()` — a static
well-formedness check that fails a diff record whose adjacent hunks share a
context line (old-file ranges overlap), which `git apply` rejects with a
confusing per-file error (bitten on `implement.load-skills-invocation`,
2026-10-12; `patches/README.md` trap #4 documents the shape and the
merge-into-one-hunk rule). The +80 is the check, its offline test in
`verify-patch-records.test.mjs`, and the README trap entry. Recorded per the
bump rule (value raised in the guard test; date + reason here).

### Patch-manifest HTML report (2026-10-19)

Budget raised to **5115** (+708 over 4407) for the standalone patch-manifest
HTML report: `scripts/generate-patches-report.mjs` + `generate-patches-report.test.mjs`.
The generator parses every record in `patches/` (frontmatter + diff / static
asserts), orders siblings by `after:` topology, layers the working-tree state,
and emits a single self-contained HTML overview for humans to eyeball the
patch situation at a glance. It is wired into the maintenance skill's
`patch-record` branch (refresh after every record write/verify); the report
file itself is a regenerable artifact and is not committed (gitignored). The
test suite covers the three seams that would silently corrupt a report —
frontmatter/body parsing, `after:` ordering, and the summary statistics. The
+708 includes the code-review follow-up (+16): the ADR-0009 repo-location
guard, a git-failure marker that stops the report claiming "clean" when git
failed, and the header notes. Recorded per the bump rule (value raised in the
guard test; date + reason here).

### ste-zh onboarding (2026-10-29)

Budget raised to **5155** (+11 over 5144) for the ste-zh vendor onboarding:
`vendor-sync.mjs` gains the new-source registration (SOURCES entry, +7
lines) and a `.git` exclusion in `walkFiles` (+4 over the old two-line body).
The exclusion is required because ste-zh maps at its clone root (`upstream:
""`), so the shallow clone's `.git/` would otherwise be enumerated and copied
as skill files; the three prior sources all map at subdirectories and never hit
it. Recorded per the bump rule (value raised in the guard test; date + reason
here).

### defaultLock XDG lock-path fix (2026-10-22)

Budget raised to **5144** (+29 over 5115) for the XDG lock-path fix in
`consolidate-strays.mjs`: the default lock location now honours
`XDG_STATE_HOME` (mirroring the distribution CLI's `getSkillLockPath` —
`$XDG_STATE_HOME/skills/.skill-lock.json` when set, else `~/.agents/.skill-lock.json`),
so the stray check finds the lock on XDG-configured Linux/WSL machines where
the default previously misled with "lock file not found". The delta is the
`defaultLock()` branch (+4) and its two-branch unit test in
`consolidate-strays.test.mjs` (+25, incl. imports); the usage text and the
distribute-branch reference were synced without adding lines. Recorded per
the bump rule (value raised in the guard test; date + reason here).

### CI surface

| Workflow | Jobs | Fate |
|---|---|---|
| `script-tests.yml` | 1 (test) | stays — the guard test runs inside this job |
| `vendor-freshness-check.yml` | 1 (check) | stays (detection, per #25) |
| `vendor-sync.yml` | 1 (sync) | **dropped** at migration (#25) |

**Budget rule**: CI **jobs** ≤ **3** (today's count: one per workflow;
post-migration the surface is 2 once `vendor-sync.yml` is dropped — the rule
anchors at today's count, so the drop only widens headroom). The guard counts
`runs-on:` lines per workflow (every job has exactly one in this repo), so
adding a job to an existing workflow trips the guard exactly like a new
workflow would. New checks fold into the existing `script-tests` job; a new
job is a budget violation.

### Per-operation step counts (common cases)

Measured from today's skill procedures (`skills/self/my-skills-vendor-sync/`,
`skills/self/consolidate-strays/` — the two skills the unified skill replaces):

| Operation | Today | #27 target |
|---|---|---|
| Upstream moved, no patched files touched (vendor sync) | 6 steps (read issue + dry-run → sync → classify/keep-or-drop → manual pin bump → tests + dry-run re-verify → propose commit/push/close) | **1 command + 1 check** — sync with the pin bump folded in, verified by a dry-run re-read (`changed=false`) |
| Local skill edit (stray recovery) | 5 steps — 4+ per #27's framing (dry-run → decide adoption → pre-migration PATCHES row + copy-back → re-run report → propose commit/push/distribute; the ticket's "edit store → dry-run → PATCHES row → copy → re-verify" counts the same procedure from the store edit) | **1 command + 1 check** — write the patch record, then one diff assertion verifies it |

**Budget rule**: per-operation step counts only decrease; the two common cases
must be one command + one check. Step counts are a property of the skill
procedure (not machine-assertable from the repo) — verified at migration by
the edge-case inventory trace (#28, all 62 ECs) plus the branch prose in the
unified skill.

## Decisions (ticket #27's three Decide items)

1. **Common case (a) — upstream moved, no patched files touched.** One
   command + one check. Mechanism: `vendor-sync.mjs` real mode bumps the pins
   in `vendor/<source>.json` itself for sources that moved when nothing
   patched was touched (no merge needed); the check is the dry-run re-read
   reading `changed=false` with no `patchedDiffers` / `patchedRemoved` items.
   The manual pin-bump step (today's step 4) disappears from the common path.
   Lands in the migration's vendor-sync branch content + script behavior.

2. **Common case (b) — local skill edit.** One command + one check. Mechanism:
   the patch-record branch writes the per-patch record at
   `patches/<source>/` (#22 format) and the record-verify script asserts the
   diff in one step (the #26 capture lists `scripts/verify-patch-records.mjs`
   wiring as an open item). The record file replaces the pre-migration
   PATCHES-table row + copy-back + re-run-report loop.

3. **Rare case — upstream touched a patched file (merge).** This is where the
   attention budget concentrates; it stays tooled/manual and is *not* the
   common path. Already shaped by #24: the `merge` subcommand rebuilds the
   three-way merge, proves patch survival byte-exactly, and exits 1 when
   attention is needed (conflict / reshaped / adopted / no-pin / error), with
   the evidence kept in the reported temp dir. No budget is spent making it
   one-command; the budget spent is bounded (the subcommand already exists
   and its tests are inside the budget).

4. **Complexity budget.** Code+tests ≤ 5144 lines (4101 at the 2026-10-06
   migration, raised 2026-10-07 for the ADR-0009 repo-location guard,
   2026-10-12 for the overlapping-hunk guard, and 2026-10-19 for the
   patch-manifest HTML report, and 2026-10-22 for the defaultLock XDG lock-path fix — see the notes above),
   #25 drop), common-case step counts only decrease. Every rule above is
   either machine-enforced (guard test) or acceptance-traced at migration
   (step counts via #28). "Maintenance cost" is now a number that moves only
   by deliberate, documented decision.

## Enforcement and re-measuring

- `scripts/maintenance-budget.test.mjs` asserts both machine-verifiable
  budgets and prints the per-file table on every run — the CI log is itself
  the measurement record. It runs in the existing script-tests job
  (`node --test scripts/*.test.mjs` picks it up by glob; no workflow change).
- The guard excludes its own lines from the count — the meter is not the
  mechanism.
- **To grow the budget deliberately**: raise the constant in the guard AND
  record the date + reason here. A raised budget without a documented reason
  is a review finding.
- Step-count compliance is verified once at migration: the unified skill's
  branch prose must present the two common cases as one command + one check,
  and the #28 edge-case trace must pass item for item.

## What this ticket does not implement

The one-command mechanics themselves (auto pin bump, patch-record write +
verify one-command loop) are migration work, explicitly deferred in the map
#18 "Not yet specified" section; this baseline is the input that constrains
them. The mechanism must come in under this budget, not the other way around.
