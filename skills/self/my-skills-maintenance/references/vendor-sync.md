# Branch: vendor sync — resolve pending updates

Bring every source's **consolidated copies** back to **current** — matching
upstream except the documented patch records, with the pins recording the true
base — and get the pending-update issue closed. The freshness check detects;
this branch maintains. Coverage: edge-case inventory A1–A28.

Two invariants (ADR-0002) shape every step: **patched files are never
overwritten** — upstream changes enter a patched file only through a merge that
preserves the local patch — and **files upstream removed are never deleted**
without an explicit call.

## 1. Read the pending-update issue and dry-run

- If a pending-update issue is open, read it (`gh issue list --state open
  --label pending-update` to find it, `gh issue view <n>` for the body — repo
  inferred from `git remote -v`). Its pending list is the freshness check's
  dry-run output; treat it as the plan, not the ground truth.
- Run `node scripts/vendor-sync.mjs --dry-run`; read the human block and the
  `VENDOR_SYNC_SUMMARY=` line.

Classify every pending item:
- **added / updated** — unpatched files the sync will copy;
- **removed upstream (kept local)** — unpatched files upstream deleted; the
  sync never deletes, the keep-or-drop call is the user's (step 3);
- **patched, upstream modified** — a patched file whose upstream moved since
  the pinned base: merge it (step 3);
- **patched, upstream removed** — upstream dropped a patched file: keep-or-drop
  call (step 3).

**Done when**: the dry run reported no source errors and every pending item has
a class. If it reports nothing pending, there is no maintenance: say so, and if
a pending-update issue is open anyway it is stale — the close is owned by
`freshness.md` step 3; follow it, then stop.

## 2. Run the sync

`node scripts/vendor-sync.mjs` (real mode) copies added/updated files; it never
touches patched files and never deletes. Confirm exit 0 and review
`git status --porcelain` / `git diff --stat`: only the classified adds and
updates — no patched file modified, no deletion.

**Done when**: the sync exited 0 and the diff is exactly the classified
added/updated set.

## 3. Resolve the pending items

### Patched, upstream modified — three-way merge

Run the merge subcommand — it rebuilds each file's three-way merge
(`git merge-file`: base = the pinned upstream blob, ours = the local copy,
theirs = upstream HEAD), proves the patch survived mechanically (changed lines
compared, not eyeballed), and writes the merged content only when it did:

```
node scripts/vendor-sync.mjs merge --dry-run   # preview: report only, write nothing
node scripts/vendor-sync.mjs merge             # write clean, patch-surviving merges
```

Node spawns git directly, so this runs from any shell. Read the per-file
verdicts (also in `MERGE_SUMMARY=`):

- **merged** — clean three-way, the patch survived (its changed lines are
  identical, only line numbers and context positions moved); the merged content
  was written. `git diff` the result and continue to step 4.
- **adopted** — upstream adopted the local patch (the copy already equals
  upstream HEAD); nothing was written. Restate the record in step 4 via
  `patch-record.md`: the patch is no longer a deviation, so a diff-verified
  record no longer holds.
- **conflict** — `git merge-file` exit 1. Nothing was written. Both sides and
  the marked merged content (`merged.diff3`, base view included) are in the
  reported temp dir. Show the user the marked hunks (ours vs theirs) and the
  record; resolve with them.
- **reshaped** — clean merge but the re-applied patch's changed lines differ
  from the old patch's; not written. The temp dir holds both diffs
  (`base-ours.diff`, `theirs-merged.diff`); show them with the record, since the
  record's `summary` must be rewritten together with the merge (step 4).
- **no-pin** — the pinned commit is unfetchable (force-push or GC upstream);
  the script kept a local-vs-HEAD diff (`ours-vs-theirs.diff`); reconcile by
  hand; the pin may need re-deriving.
- **error** — git failed mid-merge; nothing was written; diagnose from the temp
  dir before retrying.

The subcommand exits 1 when any file needs attention (conflict / reshaped /
adopted / no-pin / error) — the stop-and-report signal — and 0 when every
pending merge was written.

### Removed upstream — the keep-or-drop call

For every file the dry run lists as **removed upstream (kept local)** — patched
or not — present the two options:

- **Drop**: `git rm` it. Deletion is destructive — get the user's explicit go;
  then `git rm` the patch record (step 4 via `patch-record.md`).
- **Keep**: the content still earns its place with no upstream anymore — move
  it under `skills/self/<name>/` so the sync stops tracking it (it only walks
  the source roots) and restate it as a self-authored record.

**Done when**: every patched file is merged (or handed off as a conflict),
every removed file has the user's keep-or-drop call, and nothing is left
pending.

## 4. Keep the records and pins truthful

The patch records (`patches/`) and the pins in `vendor/<source>.json` are the
record of every deviation (ADR-0002; pins rehomed per map ticket #23) — keep
both aligned to the new state:

- **Bump the pins** — each source's pinned commit lives in
  `vendor/<source>.json`. Bump each source that moved to the commit the
  maintenance actually merged against: the **HEAD** the merge subcommand
  reported per source (`merged against <source> HEAD <sha>`) when files were
  merged, else `git ls-remote <url> HEAD` when only pins changed. Current pins
  are what make the freshness check read patched files as current again.
- **Patch records** — follow `patch-record.md`: a reshaped merge rewrites the
  record's `summary` / `verification`; an adopted patch is restated
  (`verification: behavioral` or dropped); a dropped file gets its record
  removed.

**Done when**: every pin matches the merged base and every record describes the
current diff.

## 5. Verify the copies are current

- `node --test scripts/*.test.mjs` — the repo's script suite (script-tests.yml);
  it must pass.
- `node scripts/verify-patch-records.mjs` — every patch record reconstructs
  byte-identically against its pin.
- Re-run `node scripts/vendor-sync.mjs --dry-run`: the summary must read
  `changed=false` with no `patchedDiffers`, `patchedRemoved`, or `removed`
  items — the exact state that lets the freshness check close the issue.

**Done when**: the tests, the verifier, and the dry run all pass with nothing
pending.

## 6. Propose commit, push, close the issue

The git and remote writes need the user's go-ahead — propose, and on
confirmation:

1. **commit** — conventional message naming the sources (`vendor: sync
   <sources> and merge patched files`, or `vendor: refresh pins, copies
   current`);
2. **push**;
3. **close** the pending-update issue per `docs/agents/issue-tracker.md` — one
   write, `git status --porcelain` clean first, its EOF-recovery order if the
   close hiccups — with a report: what synced, which patches merged (and that
   they survived), the pin bumps, and the verification results.

If no issue was open, say so — the next freshness check run sees the copies
current and stays silent.

**Done when**: the proposal has been made and the user has either approved and
commit + push + close all landed (`git status --porcelain` empty, the
pending-update issue closed), or explicitly declined.