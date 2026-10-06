---
name: my-skills-maintenance
description: >-
  Maintain the my-skills aggregation repo — vendor sync, stray recovery, patch
  records, freshness, and distribution to the canonical skills store. One entry;
  the branch is picked from the request. Use when the user asks to sync or update
  vendored skills, recover or consolidate stray skills, resolve a pending-update
  issue, record a patch deviation, check vendor freshness, or distribute skills
  to the store. Every run starts with the read-only stray dry-run; all remote or
  destructive writes (git push, gh issue ops, store changes) wait on the user's
  go-ahead.
---

# my-skills maintenance — one entry for the aggregation repo

The single entry for every maintenance flow of this aggregation repo (GLOSSARY:
**vendor sync**, **stray recovery**, **patch records**, **freshness**,
**distribution chain**). One discoverable skill, five branches — each branch's
procedure lives in a disclosed reference loaded only when that branch fires.
This skill replaces `consolidate-strays` and `my-skills-vendor-sync`; those two
are retired when this lands (map #18 migration).

**This file is a prototype skeleton (ticket #26).** The router's own steps are
real; the `references/` files are outlines whose full prose lands with the
follow-up ticket (map #18 "unified skill's full branch content").

## Shared rules — every branch

1. **Locate the repo**: confirm you are at the aggregation repo root (the git
   root owning `scripts/vendor-sync.mjs`); ask the user if it has moved.
2. **Propose before you write**: every git write, gh issue op, and store change
   is proposed to the user and waits for explicit go-ahead (AGENTS.md safety
   valves). The default run is read-only.
3. **Verify, then report**: script tests (`node --test scripts/*.test.mjs`) and
   a fresh dry-run are the verification levers; `git status --porcelain` clean
   before any issue op (docs/agents/issue-tracker.md).
4. **Editing skill content?** Load `writing-for-agents` first (it is the
   reference for drafting skill content), then run the branch.
5. **Vocabulary**: name concepts with the GLOSSARY terms (`consolidated copy`,
   `pending update`, `distribution chain`, …), never drifted synonyms.

## Always run first — the stray check

Every run starts with the mandatory stray dry-run (map #25: on-demand store
drift detection — the only guard for the distribution clobber window; no local
scheduled task):

```
node scripts/consolidate-strays.mjs
```

Read the whole report (default is a read-only dry-run): every store skill
classifies as **current**, **new stray**, or **modified stray**.

- Any stray → load [`references/stray-recovery.md`](references/stray-recovery.md)
  and settle it (adopt, recover, or explicitly decline) before doing anything
  else — nothing proceeds past a stray, because the next distribution would
  clobber it.
- Zero strays → proceed to the requested branch.

## Pick a branch

| The request is about… | Load |
|---|---|
| resolving a pending update — sync, three-way merge patched files, bump pins | [`references/vendor-sync.md`](references/vendor-sync.md) |
| consolidating or recovering stray skills | [`references/stray-recovery.md`](references/stray-recovery.md) |
| recording a patch deviation | [`references/patch-record.md`](references/patch-record.md) |
| checking freshness / reading or closing a pending-update issue | [`references/freshness.md`](references/freshness.md) |
| distributing to the canonical store (or retiring a skill) | [`references/distribute.md`](references/distribute.md) |

If the request spans branches (e.g. "sync and then distribute"), run the
branches in order — vendor-sync → distribute — never in parallel.

## Done

When the branch's completion criterion is met, propose the finishing steps
(commit / push / issue close / distribution, per branch) and stop for the
user's go-ahead. Nothing remote or destructive happens without it.
