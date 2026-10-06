# Research R2: fork/merge tooling for single-repo multi-source vendoring

**Method note**: the background research subagent truncated twice before producing its final document (both runs hit their session cap during the verification round, see logs `pi-research-UMUR2d` / `pi-research-W7NE9x`). The charting session completed this bounded survey directly against primary sources (git-scm book, pnpm docs + source, GitHub API for maintenance status). All claims below cite the source fetched.

**Shape under study**: one git repo vendors multiple upstream skill repos into per-source trees (`skills/<source>/`), each upstream pinned to a commit, local patches on some files; today the repo hand-rolls `git clone --depth 1` per source and `git merge-file` three-way merges (base=pinned upstream, ours=local patched copy, theirs=upstream HEAD), with the merge procedure documented in a skill body.

---

## 1. `git subtree` — not a fit for this shape

**Verified pattern** (Pro Git, "Advanced Merging — Subtree Merging", git-scm.com/book/en/v2/Git-Tools-Advanced-Merging): add the upstream as a remote, fetch, check out its branch, graft it into a subdirectory with `git read-tree --prefix=<prefix>/ -u <branch>`, then later pull upstream changes with `git merge --squash -s recursive -Xsubtree=<prefix> <branch>`.

**Documented drawbacks** (same source, verbatim): subtree merging is "a bit more complex and easier to make mistakes in reintegrating changes or accidentally pushing a branch into an unrelated repository"; and to compare the vendored subtree against the upstream branch you must use `git diff-tree -p <branch>` — the normal `git diff` doesn't see it. The pattern keeps long-lived branches with *unrelated histories* per source.

**Applicability to this repo**: 3–4 sources → 3–4 subtree branches + read-tree prefixes + squash merges. Crucially, subtree does **not** remove the patch-protection problem: when upstream changes a locally patched file, `-Xsubtree` still conflicts on that file and the merge work is identical to today's `merge-file` three-way — only the mechanics change. Unpatched files merge cleanly, which the current script already achieves by simple copy. Subtree replaces the copy mechanics with grafted-history machinery while adding the documented failure modes (reintegration mistakes, accidental pushes) and a different diff surface.

**Verdict**: adds significant machinery to solve a problem the repo already solves with a small script, and does not touch the actual pain (patch-record prose discipline). Not recommended.

## 2. Fork-as-git (per-source history) — cost > benefit

**Precedent verified**: the same Pro Git chapter demonstrates that branches with completely unrelated histories are legal and supported in one repo, and `read-tree` grafts one into a subdirectory — this is the substrate a fork-as-git approach would build on.

**What native merges would buy**: `git merge` per source instead of scripted copy + `merge-file`. But the repo's current model already does git-native single-file three-way merges *on demand* (`git merge-file` is itself the documented Git tool for manual file re-merge — verified in the same chapter: "the little-known `git merge-file` command", `git merge-file -p ours.common.theirs`). The merge *mechanics* are not the pain; the pain is the patch-manifest prose discipline (PATCHES.md rows + prose verification methods), which the redesign fixes with per-patch record files + machine diff assertions — orthogonal to where the merge runs.

**Cost**: three grafted histories in one repo, branch hygiene, `-Xsubtree`/squash subtlety, the documented "easier to make mistakes" failure mode, and a permanently different diff surface for the patched files the records must assert against (the current "diff vs pin" check would need to become "diff vs grafted upstream branch").

**Verdict**: small benefit, high machinery cost. Not recommended; kept in ticket "Merge mechanics decision" only as a discussed-and-rejected option.

## 3. Tooling status — nothing beats the script subcommand; pnpm's record shape is the model to borrow

Maintenance status verified via GitHub API (`pushed_at` / `archived`):

- **git-vendor** (brettlangdon/git-vendor): unmaintained — last push **2022-02-27**; it is a git-subtree wrapper, so inherits Q1's problems.
- **git-subrepo** (ingydotnet/git-subrepo): maintained — pushed **2026-02-09**; `.gitrepo` files + per-subtree refs, one-command `git subrepo pull`. Same complexity class as subtree (grafted histories); a fit only if the repo were willing to carry that machinery.
- **kpt** (kptdev/kpt): not archived, pushed **2026-10-01** — but K8s/KRM-YAML scoped (Kptfile `upstream`/`upstreamLock` with exact commit SHAs + 3-way merge strategies). Wrong domain for text skill files.
- **vendir** (carvel-dev/vendir): maintained, pushed **2026-09-29** — git ref pins + lockfile, but K8s/YAML manifests domain. Wrong domain.
- **pnpm patch** — the transferable model (verified from pnpm.io `pnpm patch` / `patch-commit` docs + `patchCommit.ts` source): `pnpm patch <pkg>` prepares an edit directory; `pnpm patch-commit <path>` generates **one patch file** under a `patches/` dir and registers a **machine-readable mapping** in the manifest (`patchedDependencies`: key `pkg@version` → relative patch path), with exact-version > range > name-only priority; since v11, patch application failures hard-error. The record shape — one patch file per deviation + a machine-readable manifest mapping keyed by version — is exactly the granularity the redesign wants. The *application* model differs: pnpm applies patch files at install, which is the ".patch + post-apply" model ADR-0002 rejected (this repo ships the patched artifacts agents actually run — fork semantics). **Borrow the record/manifest shape for the record-format ticket; keep fork semantics.**

## Bottom line for "Merge mechanics decision"

- The script-subcommand option (merge steps move out of the skill body into `vendor-sync`/a standalone script) is the right call: `git merge-file` is the documented native tool, nothing in the survey replaces the per-file three-way, and subtree/fork-as-git add machinery without touching the real pain (manifest discipline).
- The pnpm-style record shape (one file per patch + machine-readable mapping) is the design template for the patch-record-format ticket, with fork semantics retained (patches live in the shipped files, records describe them).

**Confidence**: High for the Pro Git subtree/merge-file material and the pnpm model (primary docs + source fetched directly); Medium for git-subrepo (API push-date only, not README mechanics); High for maintenance statuses (GitHub API).
