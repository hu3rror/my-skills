# Branch: patch record — write and verify one deviation

Record one deviation from upstream as one machine-verified record at
`patches/<source>/` (outside `skills/` — never scanned or distributed), so CI
can reconstruct the local file from the pinned blob + the record's hunks and
byte-compare. The format spec is [`patches/README.md`](../../../patches/README.md)
(the authoritative schema); this branch owns writing and verifying records.
Coverage: edge-case inventory D1–D10.

## 1. When to write or update a record

A deviation needs a record when:

- a **merge reshapes a patch** (vendor-sync branch): rewrite the record's
  `summary` / `## Diff` to the current hunks;
- a **modified stray is recovered** (stray-recovery branch): record-first,
  before the consolidated copy changes;
- an **adopted patch** (upstream took it): restate as behavioral or drop it;
- a **patch is dropped**: `git rm` the record (keep-or-drop, D6).

Write it at `patches/<source>/`, mirroring the target file's local path; sibling
records for the same file use `after:` edges for stacked hunks. Follow the
frontmatter schema + unified-diff shape in `patches/README.md`. Records are LF.

**Done when**: the record has `id` (unique), `file` (repo-relative), a valid
`verification`, `summary`, and — for a diff-verified record — exactly one
`## Diff` block that is a standard unified diff; a behavioral record carries
`## Static assert` + `## Live check` instead.

## 2. Verify mechanically

- `node scripts/verify-patch-records.mjs` — reconstructs pinned blob + each
  diff record's hunks (in `after:` order) via `git apply` and byte-compares to
  the local file; fails loudly on well-formedness errors, missing targets, or a
  mismatch. A multi-patch file passes only when all its records are present and
  consistent.
- `node --test scripts/*.test.mjs` — the script suite, including the verifier's
  offline tests.

**Done when**: the verifier prints `ALL CHECKS PASS` and the test suite is
green.

## 3. Lifecycle follows the keep-or-drop call

- **Dropped** → `git rm` the record and the file it protected if dropped too.
- **Kept** → restate as self-authored (`patches/self/`, behavioral) after
  rehoming the copy under `skills/self/`.

**Done when**: the record set matches the file set the sync must never
overwrite (the `file:` skip set), with nothing stale.

`vendor-sync`'s step 4 and the behavior records' `## Live check` recipes are
human-re-run; this verifier is the CI-covered assertion.