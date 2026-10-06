---
name: my-skills-vendor-sync
description: "Vendor-sync maintenance for the my-skills aggregation repo: resolve pending updates — sync, three-way-merge patched files, bump the pins in vendor/<source>.json, verify the copies are current, propose commit/push/issue-close."
disable-model-invocation: true
---

# Vendor-sync maintenance

The upstream leg of the aggregation repo (GLOSSARY.md: **vendor sync**): bring every source's **consolidated copies** back to **current** — matching upstream except the documented patches, with the **patch manifest** pins recording the true base — and get the pending-update issue closed. The freshness check detects; this skill maintains.

Two invariants (ADR-0002) shape every step: **patched files are never overwritten** — upstream changes enter a patched file only through a merge that preserves the local patch — and **files upstream removed are never deleted** without an explicit call.

## 1. Read the pending-update issue and dry-run

Confirm you are at the aggregation repo root (the git root owning `scripts/vendor-sync.mjs`); ask the user if it has moved.

- If a pending-update issue is open, read it (`gh issue list --state open --label pending-update` to find it, `gh issue view <n>` for the body — repo inferred from `git remote -v`). Its pending list is the freshness check's dry-run output; treat it as the plan, not the ground truth.
- Run `node scripts/vendor-sync.mjs --dry-run`; read the human block and the `VENDOR_SYNC_SUMMARY=` line.

Classify every pending item:
- **added / updated** — unpatched files the sync will copy;
- **removed upstream (kept local)** — unpatched files upstream deleted; the sync never deletes, the keep-or-drop call is the user's (step 3);
- **patched, upstream modified** — a patched file whose upstream moved since the pinned base: merge it (step 3);
- **patched, upstream removed** — upstream dropped a patched file: keep-or-drop call (step 3).

**Done when**: the dry run reported no source errors and every pending item has a class. If it reports nothing pending, there is no maintenance: say so, and if a pending-update issue is open anyway it is stale — close it per `docs/agents/issue-tracker.md` and stop.

## 2. Run the sync

`node scripts/vendor-sync.mjs` (real mode) copies added/updated files; it never touches patched files and never deletes. Confirm exit 0 and review `git status --porcelain` / `git diff --stat`: only the classified adds and updates — no patched file modified, no deletion.

**Done when**: the sync exited 0 and the diff is exactly the classified added/updated set.

## 3. Resolve the pending items

### Patched, upstream modified — three-way merge

Run the merge subcommand — it rebuilds each file's three-way merge (`git merge-file`: base = the pinned upstream blob, ours = the local copy, theirs = upstream HEAD), proves the patch survived mechanically (changed lines compared, not eyeballed), and writes the merged content only when it did:

```
node scripts/vendor-sync.mjs merge --dry-run   # preview: report only, write nothing
node scripts/vendor-sync.mjs merge             # write clean, patch-surviving merges
```

Node spawns git directly, so this runs from any shell — the old Git Bash/WSL block is gone. Read the per-file verdicts:

- **merged** — clean three-way, the patch survived (its changed lines are identical, only line numbers and context positions moved); the merged content was written over the consolidated copy. `git diff` the result and continue to step 4.
- **adopted** — upstream adopted the local patch (the copy already equals upstream HEAD); nothing was written. Restate the row in step 4: the patch is no longer a deviation, so its **Verification method** ("git diff shows exactly N lines") no longer holds.
- **conflict** — `git merge-file` exit 1. Nothing was written. Both sides and the marked merged content — plus `merged.diff3`, which also shows the base — are kept in the reported temp dir. Show the user the marked hunks (ours vs theirs) and the row; resolve with them — the genuine manual-merge case ADR-0002 anticipated.
- **reshaped** — clean merge but the re-applied patch's changed lines differ from the old patch's; not written. (A line-ending difference between blobs and the local file also lands here — a spurious mismatch, conservative; worth a glance before the manual review.) The temp dir holds both diffs (`base-ours.diff`, `theirs-merged.diff`); show them to the user with the row, since the **Patch summary** must be rewritten together with the merge (step 4).
- **no-pin** — the pinned commit is unfetchable (force-push or GC upstream). The script kept a local-vs-HEAD diff (`ours-vs-theirs.diff` in the reported temp dir); reconcile with the user by hand; the pin may need re-deriving.
- **error** — git failed mid-merge (e.g. `HEAD:<path>` unreadable or a non-conflict `merge-file` failure); nothing was written. The reported temp dir holds whatever evidence exists; diagnose before retrying.

The subcommand exits 1 when any file needs attention (conflict / reshaped / adopted / no-pin / error) — a stop-and-report signal — and 0 when every pending merge was written.

### Removed upstream — the keep-or-drop call

For every file the dry run lists as **removed upstream (kept local)** — patched or not — present the two options:

- **Drop**: `git rm` it. Deletion is destructive — get the user's explicit go; patched rows then leave the manifest (step 4).
- **Keep**: the content still earns its place with no upstream anymore — move it under `skills/self/<name>/` so the sync stops tracking it (it only walks the source roots) and restate it as self-authored in `PATCHES.md`.

**Done when**: every patched file is merged (or handed off as a conflict), every removed file has the user's keep-or-drop call, and nothing is left pending.

## 4. Update the patch manifest

`PATCHES.md` (A-class rows) and the pins in `vendor/<source>.json` are the record of every deviation (ADR-0002; pins rehomed per map ticket #23) — keep both truthful to the new state:

- **Bump the pins** — each source's pinned commit (the diff baseline) lives in `vendor/<source>.json`. Bump each source that moved to the commit the maintenance actually merged against: the **HEAD** the merge subcommand reported per source (`merged against <source> HEAD <sha>`) when files were merged, else `git ls-remote <url> HEAD` when only pins changed. Current pins are what makes the freshness check read patched files as current again.
- **Patch summaries** — if a merge reshaped a patch, rewrite the row's **Patch summary** and **Verification method** to describe what `git diff` now shows.
- **Removed rows** — drop rows for files the user dropped; restate as self-authored for files kept under `skills/self/`.

**Done when**: every pin matches the merged base and every row describes the current diff.

## 5. Verify the copies are current

- `node --test scripts/*.test.mjs` — the repo's only script guardrail (script-tests.yml); it must pass.
- Re-run `node scripts/vendor-sync.mjs --dry-run`: the summary must read `changed=false` with no `patchedDiffers`, `patchedRemoved`, or `removed` items — the exact state that lets the freshness check close the issue.

**Done when**: the tests pass and the dry run reports nothing pending.

## 6. Propose commit, push, close the issue

The git writes and the remote writes need the user's go-ahead — propose, and on confirmation:

1. **commit** — conventional message naming the sources: `vendor: sync <sources> and merge patched files`, or `vendor: refresh pins, copies current` when only the manifest changed;
2. **push**;
3. **close** the pending-update issue per `docs/agents/issue-tracker.md` — one write, `git status --porcelain` clean first, its EOF-recovery order if the close hiccups — with a report: what synced, which patches merged (and that they survived), the pin bumps, and the verification results.

If no issue was open, say so — the next freshness check run sees the copies current and stays silent.

**Done when**: the proposal has been made and the user has either approved and the commit, push, and issue close all landed (`git status --porcelain` empty, the pending-update issue closed), or explicitly declined.
