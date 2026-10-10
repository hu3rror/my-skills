# Maintenance budget: a measurable upper bound on the redesign

Status: accepted

## Context

Ticket #27 asks what maintenance cost baseline the redesigned skill-management
system (map #18) must meet — and demands the answer be a measurable upper
bound, "a number, not a feeling". Two common cases must become one command +
one check: (a) upstream moved with no patched files touched (sync + pin bump
in one command), (b) a local skill edit (record file + diff assertion in one
command). The rare case — upstream touched a patched file (merge) — is where
the attention budget concentrates and may stay manual/tooled, but must not be
the common path. The complexity budget: the new mechanism's code + tests must
stay within today's script line count, CI jobs must not increase, and
per-operation step counts must only decrease.

The ticket's cited baseline, "today's 2350 script lines", was exact on
charting day (commit `8bdc964`). By the time the sibling mechanism tickets
landed, the scripts measured 3059 at commit `7c0c3a4` — the +709 delta is
entirely the already-landed new-mechanism prep (#23 rehoming, #24 merge
subcommand). The budget re-bases to the current measure (per-file table and
the delta breakdown in `docs/maintenance-budget.md`): the mechanism the
redesign replaces includes the prep that already serves it, and the intent
("the new mechanism is not larger than the old") is unchanged.

## Decision

Adopt a maintenance budget with four rules, anchored at the 2026-10-06
measurement (commit `7c0c3a4`):

1. **Code + tests ≤ 3059 lines** — the total of `scripts/*.mjs` (code 1571)
   and `scripts/*.test.mjs` (tests 1488), counted as `\n` per file (wc -l
   parity, CRLF-robust).
2. **CI jobs ≤ 3** — today's count (one per workflow); #25 drops
   `vendor-sync.yml` at migration, so the post-migration surface is 2 and the
   rule anchors at the higher number. Jobs are counted as `runs-on:` lines
   per workflow, so a second job in an existing workflow trips the guard too.
3. **Common cases are one command + one check** — (a) sync + pin bump folded
   into `vendor-sync.mjs` real mode when nothing patched was touched,
   verified by a dry-run re-read (`changed=false`); (b) patch-record write +
   diff assertion as one step in the patch-record branch. Both land in the
   migration; the manual pin-bump step and the row+copy+re-verify loop
   disappear from the common paths.
4. **Rare case stays tooled/manual** — the #24 `merge` subcommand (three-way
   rebuild, byte-exact patch-survival proof, exit 1 when attention is needed).
   No budget is spent making it one-command; its cost is already inside the
   3059.

**Enforcement**: `scripts/maintenance-budget.test.mjs` asserts rules 1–2 and
prints the per-file table on every run — the CI log is the measurement record.
It is picked up by the existing script-tests job's glob
(`node --test scripts/*.test.mjs`), so no new workflow exists to enforce a
no-new-job rule. The guard excludes its own lines from the count — the meter
is not the mechanism. Bumping a constant is a deliberate act: the value
changes **and** `docs/maintenance-budget.md` records the date + reason. Rules
3–4 are procedure properties, not machine-assertable from the repo: verified
once at migration by the edge-case inventory trace (#28, all 62 ECs) plus the
unified skill's branch prose.

## Considered Options

- **No budget** (maintenance cost stays a judgement call): rejected. #27
  explicitly demands a measurable upper bound; without one, the redesign's
  cost cannot be reviewed against a standard.
- **Budget documented but not enforced**: rejected. The 2350 itself drifted
  by +709 lines in days; an unenforced number is a stale number.
- **Budget check as a new CI workflow/job**: rejected. It would violate the
  very "CI jobs not increased" rule it enforces. The check folds into the
  existing script-tests job instead.
- **A separate measurement script + doc, no test**: rejected. A measurement
  script adds lines to the budget it measures (self-referential); the guard
  test is both the meter and the assertion.
- **Metric choice**: script line count kept as the ticket's cited metric
  (wc -l parity, CRLF-robust `\n` count); CI surface asserted as job count
  (`runs-on:` per workflow); per-operation steps are procedure properties
  verified by the acceptance trace, not by a test.

## Consequences

- Future growth of the mechanism is a deliberate, documented decision — the
  guard trips with an actionable message naming the budget and the required
  doc update.
- The migration must land the unified mechanism under 3059 script lines with
  no new CI job and the two common cases at one command + one check; the #28
  edge-case trace is the acceptance gate for the step-count rules.
- The budget's single home for measurements and bump rationale is
  `docs/maintenance-budget.md` (extending ADR-0002's single-home principle);
  this ADR is the decision record; the guard's constants are data in code —
  bounded and reviewable because the values are the budget itself, not
  curation (the same rule ADR-0006 applies to vendor meta, in code the values
  are the budget, so they stay visible to the meter).
