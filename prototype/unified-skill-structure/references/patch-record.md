# Branch: patch record

**Skeleton — full prose lands with the follow-up ticket.** The format below is
the settled prototype from ticket #22 (branch `prototype/patch-record-format`);
this branch owns *writing and verifying* records. Coverage: edge-case
inventory D1–D10.

## Purpose

Record one deviation from upstream as one machine-verified record at
`patches/<source>/` (outside `skills/` — never scanned or distributed, R1), so
CI can reconstruct the local file from the pinned blob + the record's hunks and
byte-compare. The `patches/**/*.md` glob is the manifest; `PATCHES.md` is
deleted once the migration lands (map #18).

## Record shape (from #22)

```
patches/
  <source>/                    # mirrors skills/<source>/ minus the skills/ root
    <category-path>/
      <slug>.md                # one record per patch; siblings = same file
```

Frontmatter: `id` (`<source>.<slug>`, stable), `file` (repo-relative target),
`upstream` (`source` / `path`; `pin` inline only as a migration fallback —
pins resolve from `vendor/<source>.json`), `verification: diff | behavioral`,
`after:` (only when the hunk's context is another record's output), `summary`,
`origin` (`PATCHES.md` row #N, migration tracing only). Diff-verified records
carry one **standard unified diff** block (copy-paste from the merge work's
`git diff`); behavioral records carry `## Static assert` + `## Live check`.
Records are LF. (D3, D5, D10)

## Steps (outline)

1. **When a deviation is applied** (a merge reshapes a patch, a modified stray
   is recovered, an upstream adoption restates one): write or update the record
   at `patches/<source>/`, grouped by file with `after:` edges for stacked
   hunks. (A16, D5)
2. **Verify mechanically** — the verifier (CI / `scripts/verify-patch-records.mjs`
   at migration) reconstructs the pinned blob + records' hunks via `git apply`
   and byte-compares to the local file; behavioral records assert statically and
   flag a human re-run. (D1–D4)
3. **Lifecycle follows the keep-or-drop call** — dropped → record removed;
   kept → restated self-authored. (D6–D8)
