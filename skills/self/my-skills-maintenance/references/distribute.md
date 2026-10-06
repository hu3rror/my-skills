# Branch: distribute — to the canonical store (or retire a skill)

Run the distribution chain that ships the aggregation repo into the canonical
skills store (`~/.agents/skills`), which pi and the other harnesses reading the
standard Agent Skills location consume directly. The chain owns the lock file
(`~/.agents/.skill-lock.json`); this branch never edits it by hand.

## 1. Gate: zero strays

The mandatory stray check (router step 1) must read **zero** new/modified
strays — a distribution with a stray present clobbers it. Any stray → settle
via `stray-recovery.md` first.

## 2. Distribute with the CLI pinned

The CLI version is **pinned** (decision, map #26): `npx skills` churns ~1–2
releases a week and has an open silent-drops class of bugs (#2039), so an
unpinned write-heavy step is non-reproducible.

```
npx skills@1.7.0 add hu3rror/my-skills -a universal -s '*' -g -y
```

Bump the version here deliberately when a needed behavior or fix lands; verify
with `npx skills@<new> --version` first.

## 3. Verify

Confirm the canonical store and lock now match the repo — `npx skills ls` /
spot-check `~/.agents/skills`; after a content change, the lock's
`skillFolderHash` entries reflect the new copies.

## 4. Retiring a skill from the store

Deleting it from the repo is not enough: `npx skills add` does **not** prune the
canonical store (deleted-skill cleanup lives in `update`). Retire = `git rm` the
repo copy **and** `npx skills remove <name>` on the store side (re-verify the
exact `remove` invocation at the time, per CLI churn). Store writes wait on the
user's go-ahead (AGENTS.md).

## Cross-branch touch

Retiring a repo skill means updating its patch record / GLOSSARY / README prose
first; a content change (new/modified skill in the repo) is what triggers a
distribution, so any branch that edits `skills/` ends by proposing one — gated
on zero strays here.