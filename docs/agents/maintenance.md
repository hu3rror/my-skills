# my-skills maintenance guide

> The operational runbook for keeping this aggregation repo healthy. It is the
> single place a human or an agent looks up *how to verify* and *what to do* in
> each maintenance case. Companion pointers (single sources of truth) live
> elsewhere and are linked, not duplicated: the per-patch record format in
> `patches/README.md`, the measurable budget in `docs/maintenance-budget.md`,
> the issue-close conventions in `docs/agents/issue-tracker.md`, the design
> decisions in `docs/adr/`.
>
> You can drive all of this by hand with the commands below, or say to the agent
> “sync / recover strays / record this patch / check freshness / distribute” —
> the unified skill `my-skills-maintenance` executes the same procedures by
> branch, defaulting to read-only and proposing every write.

## 1. Health / verification — run these before you trust a state

One battery, fast and local, plus a machine-verification of the patch records:

```bash
# (a) full script suite: fixture tests + the maintenance-budget guard + skill hygiene
node --test scripts/*.test.mjs            # expect: all pass (85 tests)

# (b) patch-record verifier — the map-#18 acceptance: every diff record must
# reconstruct byte-identically from its pinned upstream blob. Needs network
# (clones upstream to fetch the pins).
node scripts/verify-patch-records.mjs     # expect: ALL CHECKS PASS, exit 0

# (c) the two dry-runs — the read-back gates after any maintenance
node scripts/vendor-sync.mjs --dry-run    # expect changed:false, no patchedDiffers/patchedRemoved/missing
node scripts/consolidate-strays.mjs       # expect 0 new stray, 0 modified stray
```

**When to run each**: `(a)` whenever any `scripts/` or `patches/` file changed;
`(b)` whenever a patch record was written, rewritten, or a `vendor/*.json` pin
changed; `(c)` at the end of every sync / recovery / pin-bump, before proposing
a commit. CI (`script-tests.yml`) already runs `(a)` and `(b)` on every push —
the local battery is for before-you-commit.

## 2. Maintenance procedures, by event

| Event | Procedure |
|---|---|
| **Upstream has changes** (the daily CI freshness check opened a `pending-update` issue) | Run `node scripts/vendor-sync.mjs --dry-run` and classify every item → `node scripts/vendor-sync.mjs` (real sync; never touches patched files, never deletes) → for each patched file upstream modified, `node scripts/vendor-sync.mjs merge` (writes only clean, patch-surviving merges) → bump the pin in `vendor/<source>.json` to the commit actually merged against → re-verify (battery above) → propose commit/push/close the pending-update issue. |
| **A patch is added / reshaped / adopted** | Write or update the record at `patches/<source>/` (format: `patches/README.md`; sibling records on one file use `after:` DAG), then `node scripts/verify-patch-records.mjs` is the one check. |
| **A local skill edit (stray) happened** | Run the stray dry-run before the next distribution; a modified stray is recovered only after its deviation is recorded as a per-patch record (record-first, ADR-0002) — the skill’s `stray-recovery` branch does this in order. |
| **Re-pin or add an exclusion for a source** | Edit `vendor/<source>.json` (single data home — data, not code). |
| **Add / retire a skill in the store** | `my-skills-maintenance` → `distribute` branch; CLI pinned (`npx skills@1.7.0`). Retiring = `git rm` the repo copy **and** `npx skills remove -g <name>` on the store (deleting from the repo alone does not prune the store). |
| **Raise the maintenance budget** | Bump `CODE_TESTS_BUDGET` in `scripts/maintenance-budget.test.mjs` **and** record date + reason in `docs/maintenance-budget.md` (ADR-0007) — a raise without documentation is a review finding. |

## 3. Common day-to-day CLI usage

```bash
# preview / real sync
node scripts/vendor-sync.mjs --dry-run
node scripts/vendor-sync.mjs

# three-way-merge patched files upstream changed
node scripts/vendor-sync.mjs merge

# stray recovery (dry-run default; apply one new stray)
node scripts/consolidate-strays.mjs
node scripts/consolidate-strays.mjs --apply <name> [--to self]

# distribute to the canonical store (~/.agents/skills) — version-pinned
npx skills@1.7.0 add hu3rror/my-skills -a universal -s '*' -g -y
```

## 4. Driving the unified skill instead

Invoke `my-skills-maintenance` with a plain request — “sync this repo”, “recover
strays”, “record this patch”, “check freshness”, “distribute / retire skill X”.
The router:
- always runs the read-only stray dry-run first;
- loads one of five disclosed branch references (`vendor-sync`, `stray-recovery`,
  `patch-record`, `freshness`, `distribute`) and executes it;
- proposes every remote/destructive write (git push, gh issue ops, store
  changes) and waits for your go-ahead.

## 5. Notes & honest gotchas

- **Store-side skill changes are never visible in the repo tree.** Retiring a
  skill to the store is a live `npx skills remove`; it cannot be committed. If
  you rely on a clean `consolidate-strays` report (`0 stray`), re-run the stray
  dry-run after any store change.
- **The live “human re-run” recipes in behavioral patch records** (`patches/self/`)
  are not CI-covered — the static asserts are, the live command re-runs are not.
  Re-run them when a behavioral record’s target file is edited.
- **Known feature gap (pre-existing, not from this migration):** ADR-0007’s
  decision describes vendor-sync auto-bumping pins on a clean sync; the script
  does not yet do so — pins are bumped manually per the vendor-sync procedure.
  Until then “one command + one check” is a target, not the current real (a
  clean sync is: sync → bump pin → dry-run reads `changed=false`).
- **Encoding:** this repo edits Chinese texts (README_zh-CN.md, ZH summaries).
  Use `zh-encoding` for any Unicode-safe read/write on Windows Git Bash.

---

## Related

- Record format spec: `patches/README.md`
- Budget numbers & bump rule: `docs/maintenance-budget.md`
- Close conventions: `docs/agents/issue-tracker.md`
- Design decisions: `docs/adr/`
- 中文版：`docs/agents/maintenance_zh-CN.md`