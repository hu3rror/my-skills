# Branch: vendor sync (resolve pending updates)

**Skeleton — full prose lands with the follow-up ticket.** The steps below are
the outline carried over from `my-skills-vendor-sync` (retired at migration);
the three-way merge mechanics already live in `scripts/vendor-sync.mjs` (map
#24). Coverage: edge-case inventory A1–A28.

## Purpose

Bring every source's **consolidated copies** back to **current** — matching
upstream except the documented patches, with the pins recording the true base —
and get the pending-update issue closed. The freshness check detects; this
branch maintains.

## Steps (outline)

1. **Read the pending-update issue and dry-run.** Find the open issue
   (`gh issue list --state open --label pending-update`), view its body; run
   `node scripts/vendor-sync.mjs --dry-run`; classify every pending item
   (added / updated / removed kept-local / patched-upstream-modified /
   patched-upstream-removed). Nothing pending + open issue anyway → this is the
   stale case — the close is owned by `freshness.md` step 3; follow it, then
   stop. (C4, C7)
2. **Run the sync** (`node scripts/vendor-sync.mjs`, real mode). It copies
   added/updated files, never touches patched files, never deletes. (A1, A5, A8)
3. **Resolve the pending items.**
   - Patched + upstream modified → `node scripts/vendor-sync.mjs merge` —
     verdicts merged / adopted / conflict / reshaped / no-pin / error; the
     patch-survival proof is mechanical. (A10–A16)
   - Removed upstream → the keep-or-drop call is the user's; drop = `git rm`,
     keep = rehome to `skills/self/` + restate. (A8, A9)
4. **Keep the record truthful.** Bump each source's pin in
   `vendor/<source>.json` to the commit actually merged against; a reshaped
   patch gets its patch record's `summary` / `verification` rewritten
   (patch-record branch); adopted patches are restated. (A19, D4, D8)
5. **Verify.** `node --test scripts/*.test.mjs`; re-run the dry-run — it must
   read `changed=false` with nothing pending (the state that lets the freshness
   check close the issue). (A28, C5)
6. **Make the finishing proposal** — the router's shared rule 6 quartet
   (commit → push → issue close), the close being the one-write stale/completed
   close per docs/agents/issue-tracker.md, `git status --porcelain` clean first.

## Cross-branch touches

- Modified stray with a vendor source (B9) routes through this branch's pin
  logic via the patch record — see `stray-recovery.md`.
- A patch record written or rewritten here must pass the patch-record verifier.
