# patches/ — per-patch records (the patch manifest)

One record per deviation from upstream, at `patches/<source>/` — outside
`skills/` trees, because `npx skills` install copies and hashes **whole skill
folders** and would distribute whatever lives under `skills/` to the canonical
store (R1 research, `docs/research-r1-skills-cli.md`). The `patches/**/*.md`
glob (minus this README) **is** the manifest: records are self-describing, so
there is no separate mapping file.

Format decision: map ticket #22 (primary-source prototype on branch
`prototype/patch-record-format`). The old `PATCHES.md` table was deleted at the
migration (map #18); every concern it held now has a single home — the records
below, the per-source pins in [`vendor/`](../vendor/README.md), and the B-class
advisories in [`docs/advisory-notes.md`](../docs/advisory-notes.md).

## Layout

```
patches/
  <source>/                     # mirrors skills/<source>/ minus the skills/ root
    <category-path>/            # mirrors the target file's local path
      <slug>.md                 # one record per patch; sibling records = same file
```

Examples: `patches/mattpocock/engineering/research/step3-repo-internal.md` and
`pushed-completion.md` are two sibling records for the two patches on
`skills/mattpocock/engineering/research/SKILL.md`.

## Frontmatter schema

| Field | Meaning |
|---|---|
| `id` | `<source>.<slug>` — stable identity; survives renames. Unique across the tree (verifier-enforced). |
| `file` | Repo-relative target file. Every `file:` across the tree is the sync script's skip set — never overwrite these. |
| `upstream` | `source` (`owner/repo`) + `path` (upstream-repo-relative). Omitted for self-authored records. Pins are **not** inline — they resolve from `vendor/<source>.json` by matching `repo` (map #23; one pin source only). |
| `verification` | `diff` (reconstructed against the pinned blob) or `behavioral` (self-authored, no upstream diff baseline). |
| `after` | Another record `id` — only when this record's hunk context is that record's **output** (stacked patches on the same line; the DAG is small — 2 of the 27 records migrated at map #18, and later records stack too, so the `after:` fields across `patches/**/*.md` are the live set). |
| `summary` | What changed and why, one paragraph. |
| `origin` | Migration tracing only (`PATCHES.md A-class row #N`); new records omit it. |

Diff-verified records carry one `## Diff` section with a **standard unified
diff** (the merge work's `git diff` output, `--- a/<upstream path>` headers;
new local files use `--- /dev/null`). Behavioral records carry `## Static
assert` + `## Live check (human re-run)` instead.

## Example record

A working modification record (the `artifact-language-*` records on
`issue-tracker-*.md` are the live set):

```yaml
---
id: setup-matt-pocock-skills.artifact-language-github
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-github.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
verification: diff
after: setup-matt-pocock-skills.quoted-assignee  # only when stacking
summary: >-
  One paragraph: what changed and why.
---

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
@@ -49,3 +49,9 @@
 - **Claim**: context line stating the record named by `after:` left it
-- **Resolve**: old line
+- **Resolve**: new line
+- **Next bullet**: context on both sides keeps the hunk anchored
```
```

Two traps that fail the byte reconstruction, both bitten for real:

- **Path form**: both `--- a/` and `+++ b/` name the **upstream path**
  (`skills/engineering/<skill>/…`), never the local layout
  (`skills/mattpocock/…`). The verifier lays the pinned blob at the upstream
  path and `git apply` targets the `b/` name there; a `b/` pointing at the
  local layout fails with `No such file or directory` (verified on
  `issue-tracker-*.md`, 2026-10; the retro records' `a/≠b/` shape still
  passes, so the mechanism isn't fully settled — new records use the `a/==b/`
  form).
- **Stacking**: when a hunk's context states a line another record on the same
  file changes, declare `after: <that record's id>` and write the context as
  that record's **output**. Ordering is otherwise by collection order, and a
  record applied too early breaks a sibling whose context it invalidates
  (`quoted-assignee` / `windows-quoting` trail with the pre-change Resolve
  line — the `artifact-language-*` records stack after them).
- **Edge context**: a hunk whose change sits at the very start or end of the
  block (no context on that side) is fragile (`git apply` can fail to locate
  it even when the context lines exist, e.g. a context + pure-insertion hunk
  on `handoff/SKILL.md` failed until the following line was added as trailing
  context). Give each change context on **both sides**; a pure insertion
  anchors on the line after the insertion point.

## The mechanical assertion

`scripts/verify-patch-records.mjs` (CI: the script-tests job) does, per
diff-verified record:

1. Resolve the pin from `vendor/<source>.json`; fetch the pinned upstream blob
   (clone + fetch — the same machinery `vendor-sync.mjs` uses).
2. Group records by `file`; order each group by its `after:` DAG (missing or
   cyclic targets fail loudly).
3. Reconstruct: pinned blob + each record's `## Diff` hunks via `git apply`, in
   DAG order → must be **byte-identical to the local file** (LF-normalized).
   A multi-patch file passes only when all its records are present and
   consistent. Files a diff creates (new-file hunks) are byte-compared too.
4. Well-formedness runs first (id unique, `file` exists, `verification` enum,
   `after` targets exist, exactly one unified-diff block per diff record,
   behavioral records carry ≥1 parseable `## Static assert` bullet).
5. Behavioral records: static asserts are the form
   `` - `path` contains [no] `needle` `` — a mis-typed bullet is a failure, not
   silently dropped coverage. The `## Live check` recipe is printed for a human
   re-run when the record's target file is edited.

`vendor-sync.mjs` reads the same `file:` set as its patched-file skip set and
refuses to run if any record is unparseable — the A6 guard ("no records /
missing file → refuse to sync") that used to protect the PATCHES.md table.

## Lifecycle

- **New patch** (a merge reshapes one, a modified stray is recovered, an
  upstream adoption restates one): write or update the record at
  `patches/<source>/`, then the verifier is the one check.
- **Keep-or-drop** (upstream removed a patched file, or the maintainer drops
  one): dropped → `git rm` the record; kept → restate as self-authored
  (`patches/self/`, behavioral) after rehoming the copy under `skills/self/`.
- **Re-pin** a source: one line in `vendor/<source>.json`; a broken hunk fails
  the verifier at that record (upstream churn is detected, not silent).

Records are LF (the repo's gitattributes enforces it; the verifier
LF-normalizes anyway).
