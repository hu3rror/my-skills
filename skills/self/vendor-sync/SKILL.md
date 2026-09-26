---
name: vendor-sync
description: "Resolve vendor pending updates in the my-skills aggregation repo: dry-run and run the sync, three-way-merge patched files onto the new upstream base, bump the PATCHES.md pins, verify the copies are current, then propose commit, push, and pending-update issue close. Use when the user says to sync vendor skills, resolve a pending-update issue, merge upstream skill changes, or the vendor freshness check flagged a pending update."
---

# Vendor-sync maintenance

The upstream leg of the aggregation repo (CONTEXT.md: **vendor sync**): bring every source's **consolidated copies** back to **current** — matching upstream except the documented patches, with the **patch manifest** pins recording the true base — and get the pending-update issue closed. The freshness check detects; this skill maintains.

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

Rebuild each file's merge in a temp dir. Run this block from **Git Bash or WSL** (PowerShell cannot `mktemp`/redirect reliably; the repo's Windows-runtime pattern). Per source, gather the clone URL (the `SOURCES` array in `scripts/vendor-sync.mjs`), the pinned commit (the **Upstream references** table in `PATCHES.md`), and each row's **Upstream counterpart** (the file's path inside the upstream repo):

```
tmp=$(mktemp -d)
git clone --quiet --depth 1 <url> "$tmp/src"
git -C "$tmp/src" fetch --quiet --depth 1 origin <pinned-commit>   # GitHub serves the SHA
```

For the file — `base` = pinned upstream, `ours` = the local consolidated copy, `theirs` = upstream HEAD:

```
git -C "$tmp/src" show <pinned-commit>:<upstream-path> > "$tmp/base"
git -C "$tmp/src" show HEAD:<upstream-path> > "$tmp/theirs"
cp <local patched file> "$tmp/ours"
git merge-file -p "$tmp/ours" "$tmp/base" "$tmp/theirs" > "$tmp/merged"   # exit 0 clean, 1 conflict
```

- **Clean** (exit 0). First the adopted-patch case: `cmp "$tmp/ours" "$tmp/theirs"` — equal means upstream adopted the local patch, the copy is already the final content; write nothing, note it, and restate the row in step 4 (the patch is no longer a deviation, so the **Verification method** "git diff shows exactly N lines" no longer holds). Otherwise prove the patch survived **mechanically**, not by eye: the re-applied patch's changed lines must equal the old patch's, only line numbers and context positions may move — extract and compare them:
  ```
  git diff --no-index "$tmp/base" "$tmp/ours"    | awk '/^[-+]/ && !/^[-+]{3}/ { print substr($0,2) }' > "$tmp/old.patch"
  git diff --no-index "$tmp/theirs" "$tmp/merged" | awk '/^[-+]/ && !/^[-+]{3}/ { print substr($0,2) }' > "$tmp/new.patch"
  cmp "$tmp/old.patch" "$tmp/new.patch"
  ```
  `cmp` exit 0 → write the merged content over the consolidated copy. Mismatch → treat as a reshaped patch (a line-ending difference between blobs and the local file also lands here — a spurious mismatch, conservative; worth a glance before the manual review): do not write; show the user both diffs and the row, since the **Patch summary** must be rewritten together with the merge (step 4).
- **Conflict** (exit 1). Do not write. Show the user the marked hunks (ours vs theirs; add `--diff3` for the base too) and the row; resolve with them — the genuine manual-merge case ADR-0002 anticipated. The temp files keep both sides.
- **Pin unfetchable** (the `fetch` failed — force-push or GC upstream). Fall back to a by-hand merge: show `git diff --no-index <local copy> <theirs>` and reconcile with the user; the pin may need re-deriving.

### Removed upstream — the keep-or-drop call

For every file the dry run lists as **removed upstream (kept local)** — patched or not — present the two options:

- **Drop**: `git rm` it. Deletion is destructive — get the user's explicit go; patched rows then leave the manifest (step 4).
- **Keep**: the content still earns its place with no upstream anymore — move it under `skills/self/<name>/` so the sync stops tracking it (it only walks the source roots) and restate it as self-authored in `PATCHES.md`.

**Done when**: every patched file is merged (or handed off as a conflict), every removed file has the user's keep-or-drop call, and nothing is left pending.

## 4. Update the patch manifest

`PATCHES.md` is the single home of every deviation (ADR-0002) — keep it truthful to the new state:

- **Bump the pins** — the **Upstream references** table records each source's pinned commit (the diff baseline). Bump each source that moved to the commit the maintenance actually merged against: step 3's clone HEAD (`git -C "$tmp/src" rev-parse HEAD`) when files were merged, else `git ls-remote <url> HEAD`. Current pins are what makes the freshness check read patched files as current again.
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
