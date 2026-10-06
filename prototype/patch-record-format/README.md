# Patch record format — prototype (ticket #22)

Throwaway prototype answering: *what do the per-patch record files look like,
and where do they live?* **Decisions adopted by the maintainer 2026-10-06** —
all four format decisions and the three open-question recommendations below
are settled; this package is the primary-source capture on the throwaway
branch `prototype/patch-record-format`. The migration (map #18) folds the
validated decision into the real layout on main.

**Verified against the real pins**: `verify.mjs` reconstructs the two patched
mattpocock files from the records' unified-diff hunks via `git apply`, against
the pinned blobs (fetched into `scratch/`), and byte-compares to the repo's
working tree. Run: `node verify.mjs` → **ALL CHECKS PASS** (well-formedness +
byte-identical reconstruction + behavioral static asserts).

## Layout (proposed)

```
patches/
  <source>/                     # mirrors skills/<source>/ minus the skills/ root
    <category-path>/            # mirrors the target file's local path
      <slug>.md                 # one record per patch; sibling records = same file
```

- Records for `skills/mattpocock/engineering/wayfinder/SKILL.md` →
  `patches/mattpocock/engineering/wayfinder/*.md` (two siblings here).
- Self-authored behavioral records → `patches/self/` (no upstream, same tree).
- The `patches/**/*.md` glob **is** the manifest — records are self-describing,
  so no separate mapping file (deliberate divergence from pnpm, which needs a
  keyed registry because it applies patches imperatively by package@version;
  here each record carries its own target + pin resolution).

## Frontmatter schema (proposed)

```yaml
id: <source>.<slug>              # stable identity; survives renames
file: skills/<source>/...       # repo-relative target
upstream:                       # omitted for self-authored
  source: <owner>/<repo>        # pin resolved from per-source meta (#23); inline fallback during migration
  path: <upstream path in source tree>
  pin: <commit sha>             # inline ONLY during migration — see decisions Q1
verification: diff | behavioral
after: <other record id>        # only when the hunk's context is another record's output
summary: >-                     # what changed and why, in one paragraph
origin: PATCHES.md A-class row #N   # migration tracing only; new patches omit it
```

Body: prose (`## Why`) + one `## Diff` block. Diff-verified records carry a
**standard unified diff** (copy-paste from the merge work's `git diff`);
behavioral records carry `## Static assert` + `## Live check` instead.

**Records are LF.** The repo's gitattributes enforces `eol=lf` once files land;
the verifier LF-normalizes anyway, so a Windows editor can't break the check.

## The mechanical diff assertion — what CI computes

Per diff-verified record, CI:

1. Reads `file`, `upstream.source`/`path`; resolves the pin (meta first,
   inline fallback); fetches the pinned blob (`git show <pin>:<path>`, LF).
2. Groups records by `file`, topologically orders them (`after:` edges;
   missing/cyclic targets fail loudly).
3. **Reconstruction**: starts from the pinned blob, `git apply`s each record's
   `## Diff` hunk in topo order, asserts the result is **byte-identical to the
   local file** (LF-normalized).
4. Reports per-file pass/fail; a multi-patch file passes only when **all** its
   records are present and consistent.

Behavioral records are excluded from step 3; CI asserts frontmatter
well-formedness + `file` exists + the record's `## Static assert` grep
expectations, and flags the `## Live check` for a human re-run when touched.

Well-formedness checks (all machine, run first): `id` unique across the tree,
`file` exists in the repo, `verification` ∈ {diff, behavioral}, `after`
targets exist, diff records have exactly one unified-diff block, behavioral
records have none.

## Robustness — what the samples exercise, and what changed since v1

First pass stored hunks as custom `-`/`+` line pairs; the robustness review
replaced them with **standard unified diff + `git apply`**. Reasons, all
verified against real data during the review:

1. **New-file patches (row #10)**: row #10's claim includes 4 `references/`
   files **added** locally. Line pairs cannot express a new file; a standard
   `--- /dev/null` hunk can. The line-pair format would have failed the
   migration on row #10 alone.
2. **Context anchoring**: unified-diff context lines anchor a hunk even when
   nearby lines reflow; `git apply` is fuzz-tolerant and battle-tested (pnpm
   patch files are the same format). Line pairs match whole lines exactly and
   fail on ambiguity (duplicate lines).
3. **Authoring**: with line pairs the maintainer hand-authors the before/after;
   with unified diff the hunk **is** the merge work's `git diff` output —
   copy-paste, zero re-encoding.
4. **Adjacent changes must be one hunk**: `git apply` matches all hunks
   against the original file, so two per-pair hunks whose contexts include
   each other's results fail (observed + fixed in this prototype: the three
   ticket-type lines in wayfinder now emit as one merged hunk). A maintainer
   pasting real `git diff` output gets this for free — real diffs already
   merge adjacent changes.

**`after:` is rare and bounded**: of the 27 A-class rows, only 2 need it —
wayfinder #2 (same-line merge onto #25's rewrite) and research #1 (appended
lines anchored on #28's rewritten line). Chains grow only when more patches
stack on the same line; the verifier fails loudly on missing/cyclic targets.

**Behavioral records are an inherent floor**: 2/27, both self-authored — no
upstream to diff against. Static asserts give partial machine coverage; live
checks are a documented human re-run on touch. Any format faces this.

**Upstream churn is detected, not silent**: a re-pin or upstream reflow that
breaks a hunk fails the verifier at that record — the same merge work as
today's `git merge-file` procedure, but flagged by CI instead of prose
discipline.

## Maintenance cost model (per event)

| Event | Work | Who |
|---|---|---|
| New patch applied | paste the merge's diff hunk + ~6-line frontmatter | maintainer, minutes |
| Re-pin a source | 1 line in per-source meta + run verifier; broken hunks = today's merge work | maintainer + CI |
| Upstream reflows a patched file | verifier flags the record; update hunk context | maintainer + CI |
| New upstream source | `patches/<source>/` + meta entry; schema unchanged | maintainer |
| New file type (JSON/script/non-MD) | hunks are plain text; schema unchanged | maintainer |
| Binary deviation | out of scope (full-file fork, behavioral record); none today | — |
| CI wiring | `scripts/verify-patch-records.mjs` reusing vendor-sync's pin-fetch machinery (clone depth-1 + fetch pin + cat-file — already implemented there); wire into script-tests workflow | implementer, small |

## Decisions to settle (maintainer) — **all adopted**

1. **Location** — `patches/<source>/` at repo root, outside `skills/` trees.
   Confirmed against the CLI-facts research (#19): `npx skills` install copies
   and hashes **whole skill folders**, so records under `skills/*` would be
   distributed to the store. **Recommend: confirmed.**
2. **Format** — Markdown + YAML frontmatter; hunks as standard unified diff.
   Markdown keeps narrative + diff readable in review; records double as the
   manifest. JSON adds nothing for humans and forces prose into strings.
   **Recommend: confirmed.**
3. **The assertion** — per-file reconstruction (union of records applied to
   the pin via `git apply` → byte-equal to local), `after:` for merged lines,
   well-formedness checks first. **Recommend: confirmed.**
4. **Naming** — slug (mirror path + human slug); historical row numbers stay
   in `origin:` for the migration only. **Recommend: slug + `origin`.**

## Open questions — fact-grounded recommendations — **all adopted**

**Q1 — pin inline vs per-source meta.**
Facts: R1 confirms pins are per-source diff baselines the CLI cannot absorb;
ticket #23 proposes `vendor/<source>.json` (pinned commit, exclusions,
release repo); `vendor-sync.mjs` already consumes pins per source
(`parseUpstreamRefs`); 25 diff records × inline = 25 copies of one SHA, so a
re-pin touches 25 files.
**Recommend: pin lives in per-source meta; records carry `upstream.source` +
`upstream.path` only.** Sequencing: during migration (before #23 settles the
shape) records may carry inline `pin:` and the verifier resolves meta-first /
inline-fallback; end state after #23 = pins only in meta. Avoids a third pin
source (PATCHES.md → records → meta) and matches existing per-source pin
consumption.

**Q2 — behavioral records: `patches/self/` vs a separate bucket.**
Facts: both behavioral rows are self-authored (#7, #15); provenance is the
tree's only axis; `verification:` is already machine-readable — the "needs
human re-run" list is a *generated report*, not a layout axis; #23 rehomes
provenance prose separately.
**Recommend: `patches/self/`, same tree as diff records.** One axis only
(provenance); a future behavioral patch on an upstream file still lives under
`patches/<source>/`.

**Q3 — boilerplate `## Mechanical assertion` per record.**
Facts: 25 diff records × ~3 identical lines; only after:/sibling records have
record-specific notes; the generic rule can live once in `patches/README.md`.
**Recommend: drop the boilerplate from diff records**; keep only the short
blockquote in records that actually have after:/sibling specifics (as the
samples already do).

## Sample records (5 files)

| Prototype case | Record file | Point |
|---|---|---|
| Simple diff (wayfinder #2) | `patches/mattpocock/engineering/wayfinder/step5-push-note.md` | "one extended line" — but the line also carries #25's rewrite, so the record stores only its own clause and declares `after:` |
| Multi-patch single file (research #1+#28) | `patches/mattpocock/engineering/research/step3-repo-internal.md` + `pushed-completion.md` | two sibling records; #1's append anchors on #28's rewritten line (`after:`) |
| Behavioral (write-release-notes #7) | `patches/self/write-release-notes/windows-temp-path.md` | no upstream; `## Static assert` (CI greps) + `## Live check` (human re-run recipe) |
| (needed for byte-exact reconstruction) | `patches/mattpocock/engineering/wayfinder/load-skills-rewrite.md` (#25) | the `after:` target; 6-line rewrite emits as 4 merged/single hunks |
