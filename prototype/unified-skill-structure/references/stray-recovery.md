# Branch: stray recovery (consolidation)

**Skeleton — full prose lands with the follow-up ticket.** The steps below are
the outline carried over from `consolidate-strays` (retired at migration).
Coverage: edge-case inventory B1–B16.

## Purpose

Recover the canonical store's strays into the aggregation repo before the next
distribution chain run, so nothing unversioned is left for a distribution to
overwrite. Consolidation is non-destructive: the store copy stays in place; a
recovered edit goes live in the store only after commit + push + a distribution
run. (B14, B15)

## Steps (outline)

1. **Run the dry-run report** — `node scripts/consolidate-strays.mjs`
   (read-only by default): every store skill classifies as current / new stray
   / modified stray. (B1)
2. **Adopt each new stray** — destination is the user's explicit call:
   `skills/self/<name>` (self-authored) or `skills/other/<name>` (provenance
   unknown). Apply is per-skill, idempotent, never touches the store, refuses
   anything that is not a new stray. (B2–B8)
3. **Recover a modified stray — record first, then copy.** The deviation is
   recorded *before* the consolidated copy changes (ADR-0002/0004: the next
   sync would otherwise clobber the edit). In the redesigned mechanism the
   record is a per-patch record — load `patch-record.md` and write it at
   `patches/<source>/`, then overwrite the changed files with the store
   version. (B9, B10 — the row template's placeholders now live in the patch
   record's frontmatter)
4. **Re-run the report** — every recovered skill must read **current**; nothing
   in the store has changed. (B13, B16)
5. **Make the finishing proposal** — the router's shared rule 6 quartet
   (commit → push → distribution), the distribution gated on zero strays
   (distribute branch).

## Cross-branch touches

- A modified stray on a vendored skill with no upstream change = a new patch;
  the patch-record verifier must pass before the copy-back is safe.
- Line-ending-only drift (B12) reads current — no record needed.
