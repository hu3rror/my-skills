# my-skills maintenance guide

The single maintenance runbook for this aggregation repo. **For any
maintenance flow, invoke the skill `my-skills-maintenance`** — it picks the
right branch, starts
read-only, and proposes every write before anything happens. Hand the commands
below if you'd rather drive it directly.

Single sources of truth are linked, never duplicated: record format
`patches/README.md`, budget `docs/maintenance-budget.md`, issue-close
conventions `docs/agents/issue-tracker.md`, design decisions in `docs/adr/`.

## Scope

`my-skills-maintenance` is the **one entry for the repo's maintenance flows**
(seven branches). It replaced `consolidate-strays` + `my-skills-vendor-sync`.
It is **not** a replacement for every skill: writing a skill loads the separate
reference skill `writing-for-agents`, and the everyday skills (web, debug,
release notes, …) are untouched.

## 1. Usage — say a line, get the branch

| You say | Branch | What happens | Done when |
|---|---|---|---|
| “sync this repo” / “resolve the pending update” | vendor-sync | dry-run classify → sync → three-way-merge patched files → bump pins → verify | dry-run reads `changed=false`; pending issue closed |
| “recover strays” / “consolidate” | stray-recovery | scan → adopt new strays → record-first the modified ones | `0 new stray, 0 modified stray` |
| “record this patch” | patch-record | write the record at `patches/<source>/` → verify | verifier `ALL CHECKS PASS` |
| “check freshness” / close a stale pending issue | freshness | read + re-derive the pending state; close a stale one | accurate, current pending picture |
| “distribute” / “retire a skill” | distribute | pinned `npx skills@<pinned>` add/remove against the store (version lives in the distribute branch of `my-skills-maintenance`) | store + lock match the repo |
| “integrate / add / bring in a new skill” | onboarding | classify where the skill sits → gate content on `writing-for-agents` → new-source registration or `skills/self/` placement → propose distribution | skill copy commit-ready; gate passes |
| “roll a baseline upgrade into consumer `CODING_STANDARDS.md` files” | standards-update | stamp-classify each target file → compose baseline region + old lower half → show diff → write per repo | every candidate upgraded or declined; byte-identity checks pass |

Every branch: run the read-only stray dry-run first (except standards-update,
which touches neither `skills/` nor the store); end by proposing
commit → push → issue-close/distribution; nothing remote or destructive without
your go-ahead.

## 2. Verify

```bash
node --test scripts/*.test.mjs            # expect: all pass
node scripts/verify-patch-records.mjs     # expect: ALL CHECKS PASS (network)
node scripts/vendor-sync.mjs --dry-run    # expect: changed:false, nothing pending
node scripts/consolidate-strays.mjs       # expect: 0 new stray, 0 modified stray
```

CI (`script-tests.yml`) already runs the first two on every push — the local
battery is the before-you-commit check. Run it after touching `scripts/`,
`patches/`, `vendor/*.json`, or any `skills/` content.

## 3. Notes

- **Store-side changes are live, never in the repo tree.** A skill retire is a
  real `npx skills remove`; re-run the stray dry-run after any store change.
- **Behavioral records’ “live re-run” recipes are not CI-covered** — only their
  static asserts are.
- **Bumping the budget** is deliberate: raise `CODE_TESTS_BUDGET` **and**
  document date + reason in `docs/maintenance-budget.md` (ADR‑0007).
- **Auto pin‑bump on a clean sync is a known gap** (ADR‑0007’s target, not yet
  in the code): today pins are bumped manually per the sync branch.

## Related

- Record format: `patches/README.md` · Budget: `docs/maintenance-budget.md`
- Design decisions: `docs/adr/` · Close conventions: `docs/agents/issue-tracker.md`
- 中文版: `docs/agents/maintenance_zh-CN.md`