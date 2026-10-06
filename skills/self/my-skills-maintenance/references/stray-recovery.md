# Branch: stray recovery — consolidation

Recover the canonical store's strays into the aggregation repo before the next
distribution chain run, so nothing unversioned is left for a distribution to
overwrite. Consolidation is non-destructive: the store copy stays in place, and
a recovered edit goes live in the store only after commit + push + a
distribution run. Coverage: edge-case inventory B1–B16.

## 1. Run the dry-run report

`node scripts/consolidate-strays.mjs` is the read-only stray check (also
the router's mandatory first step). Read the whole report; every store skill
classifies as **current** (content matches its consolidated copy), **new
stray** (with its proposed destination `skills/other/<name>`), or **modified
stray** (with a diff summary).

**Done when**: every skill has a class shown to the user.

## 2. Decide the adoption of each new stray

For each new stray, propose a destination and get the user's explicit call —
provenance is the user's judgement, not a guess:

- **self-authored** → `skills/self/<name>`;
- **provenance unknown** → `skills/other/<name>` (the default, until branded).

Apply is per-skill, idempotent (re-running is a no-op), never touches the
store, and refuses anything that is not a new stray:

```
node scripts/consolidate-strays.mjs --apply <name> [--to self]
```

A stray the user declines to adopt stays in the store untouched.

**Done when**: every new stray the user wants adopted has printed
`Applied new stray:` with the destination, and the rest were explicitly
declined.

## 3. Recover a modified stray: record first, then the copy

The script never copies a modified stray — recovery preserves a fixed order
(ADR-0002/0004): the deviation must be recorded **before** any consolidated
copy changes, because the vendor sync skip-set comes from the patch records and
would otherwise clobber the recovered edit on the next sync. The report prints
a diff summary plus a `patches/<source>/` pointer for the deviation.

1. **Write the patch record** — follow the `patch-record.md` branch (B9/B10):
   a diff-verified record for a vendored source, a behavioral record for a
   self/ copy, at `patches/<source>/`. The report's diff is the `summary` /
   `## Diff` material.
2. **Only after the record exists**, update the consolidated copy: overwrite
   each changed file the diff lists with its store version, keeping the
   relative path; files the store removed are left alone. The store copy stays
   in place.

A modified stray the user declines to recover is left alone.

**Done when**: the record is written and `node scripts/verify-patch-records.mjs`
passes, the consolidated copy reflects the store content, and the dry-run no
longer reports the skill as a modified stray.

## 4. Re-run the report

Re-run the dry-run (step 1). Every recovered skill must now read **current**;
anything still reading stray needs the corresponding step again, and nothing in
the store has changed — consolidation copies out of it, never into it.

**Done when**: the re-run reads `0 new stray, 0 modified stray`, or only the
strays the user explicitly declined.

## 5. Propose commit, push, and distribute — in that order

When anything was recovered, end by proposing the three steps — the git writes
and the distribution run need the user's go-ahead:

1. **commit** — the new consolidated copies and the patch record;
2. **push**;
3. **distribute** — run the distribution chain so the recovered content goes
   live in the store and the lock file records it (see `distribute.md`).

The distribution chain owns the lock file; consolidation never edits it. If the
report showed nothing to recover, say so — there is nothing to commit, push, or
distribute.