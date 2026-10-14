# Branch: distribute — to the canonical store (or retire a skill)

Run the distribution chain that ships the aggregation repo into the canonical
skills store (`~/.agents/skills`), which pi and the other harnesses reading the
standard Agent Skills location consume directly. The chain owns the lock file
(`~/.agents/.skill-lock.json`); this branch never edits it by hand.

## 1. Gate: zero store-side strays

The mandatory stray check (router step 1) must read **zero** store-side
new/modified strays before a distribution — a distribution with a store-side
edit present clobbers it (an unrecovered edit written straight into the store).
Settle those via `stray-recovery.md` first.

Repo-side deviations are **not** a gate failure: a newer copy in the repo
(uncommitted worktree edits, or a committed change not yet distributed) shows
up as a modified stray because the dry-run compares against the worktree, but
it is exactly what this branch ships — commit and push it, then distribute;
the distribution overwriting the older store snapshot is the point, not a
clobber.

## 2. Distribute with the CLI pinned

The CLI version is **pinned** (decision, map #26): `npx skills` churns ~1–2
releases a week and silently drops unrecognised flags — the #2039 class: any
`-`-prefixed token that is not an exact known option is discarded (add
over-installs, remove no-ops) and the run exits 0, so an unpinned
write-heavy step is non-reproducible. The pinned command below is the
verified shape — space-form flags (`-s '*'`, never `--skill=*`) and known
tokens only — it does not trip #2039; the pin plus this shape guard the
chain against input variants (equals-form, misspelled flags) and version
drift.

```
npx skills@1.7.2 add hu3rror/my-skills -a universal -s '*' -g -y
```

**Current pin: 1.7.2** (bumped 2026-10-14 — changelog review found no new
bugs for this chain's usage; 1.7.2 fixes BOM frontmatter parsing, treats pi
as a universal agent, adds remove-by-source; #2039 remains unfixed in all
1.7.x). Bump deliberately when a needed behavior or fix lands — next
trigger: vercel-labs/skills#2086 merging — and verify with
`npx skills@<new> --version` first.

## 3. Verify

Confirm the canonical store and lock now match the repo — `npx skills ls` /
spot-check `~/.agents/skills`; after a content change, the lock's
`skillFolderHash` entries reflect the new copies.

## 4. Retiring a skill from the store

Deleting it from the repo is not enough: `npx skills add` does **not** prune the
canonical store (deleted-skill cleanup lives in `update`). Retire = `git rm` the
repo copy **and** `npx skills remove <name>` on the store side. Store writes wait
on the user's go-ahead (AGENTS.md).

**Verify the invocation before running it** — this CLI churns and its
non-interactive path fails silently: without the global scope flag, `remove`
reports "No skills found to remove" and exits 0 (observed). Check
`npx skills@<pinned> remove --help` for the current flag shape first; the
canonical store needs the global scope (`-g`, non-interactive `-y`).

## 5. Full store reset (clean reinstall from the repo)

For a drifted or suspect store:

1. Snapshot the current store (`npx skills ls` / `ls ~/.agents/skills`).
2. Remove everything: `npx skills@<pinned> remove -g --all -y`.
3. Re-add from the repo with the pinned CLI (section 2).
4. Verify: new store = snapshot minus retirements, and the stray dry-run reads
   `0 new stray, 0 modified stray`.

## Cross-branch touch

Retiring a repo skill means updating its patch record / GLOSSARY / README prose
first; a content change (new/modified skill in the repo) is what triggers a
distribution, so any branch that edits `skills/` ends by proposing one — gated
on zero strays here.