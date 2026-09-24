---
name: consolidate-strays
description: "Consolidate stray skills: run the stray-skill consolidation dry-run report, copy a new stray into the aggregation repo (skills/self/ for self-authored content, skills/other/ while provenance is unknown), and record a modified stray as a PATCHES.md row before its consolidated copy changes. Use when the user asks to consolidate stray skills, recover strays, run the stray-skill consolidation report, or record a canonical-store deviation in the patch manifest."
---

# Consolidate stray skills

Recover the canonical skills store's strays into the aggregation repo before the next distribution chain run, so nothing unversioned is left for a distribution to overwrite:

- a **new stray** — a store skill the distribution chain does not track — becomes a versioned **consolidated copy**, under `skills/self/` when self-authored or `skills/other/` while provenance is unknown;
- a **modified stray** — a tracked skill whose store content differs from its consolidated copy — gets its deviation recorded in the **patch manifest** before the copy changes (ADR-0002).

Consolidation is non-destructive: the store copy stays in place, and a recovered edit goes live in the store only after commit + push + a distribution run.

## 1. Run the dry-run report

Locate the aggregation repo — the git repo owning `scripts/consolidate-strays.mjs`. If you are not already at its root, find it (e.g. `git -C <candidate> rev-parse --show-toplevel`, or search your usual checkout roots); ask the user if it has moved. From the repo root, run the script plain — it resolves the store, the pi junction farm, the lock file, and the repo root itself, so no flags are needed:

```
node scripts/consolidate-strays.mjs
```

The default mode is a dry-run: nothing is written or modified. Read the whole report; every skill is classified as **current** (content matches its consolidated copy — nothing to do), **new stray** (with its proposed destination `skills/other/<name>`), or **modified stray** (with a diff summary and a patch-manifest row template).

**Done when**: the report has been shown to the user and every skill has a class.

## 2. Decide the adoption of each new stray

For each new stray, propose a destination and get the user's explicit call — provenance is the user's judgement, not a guess:

- **self-authored**: the user or this agent wrote the skill → `skills/self/<name>`, the self-authored home;
- **provenance unknown** → `skills/other/<name>`, the unattributed home — the default, until attribution is traced.

Apply is per-skill, idempotent (re-running is a no-op), never touches the store, and refuses anything that is not a new stray:

```
node scripts/consolidate-strays.mjs --apply <name> [--to self]
```

A stray the user declines to adopt stays in the store untouched, preserving the try-before-adopt flow.

**Done when**: every new stray the user wants adopted has printed `Applied new stray:` with the line `  <name> (new-stray) -> skills/<home>/<name>`, and the rest were explicitly declined.

## 3. Recover a modified stray: patch-manifest row first, then the copy

The script never copies a modified stray — recovery preserves a fixed order (ADR-0002): the row must exist before any consolidated copy changes, because vendor sync skips files listed in the patch manifest and would otherwise clobber the recovered edit on the next sync. The report prints a row template for every modified stray; complete it, then update the copy:

1. **Complete the row template** the report printed into `PATCHES.md`, replacing every placeholder:
   - `<next #>` — the next free number in the A-class table;
   - `new` — already filled in the template (this is a new local edit);
   - the file path — from the template;
   - `<patch summary: see diff above>` — written from the diff lines, in the style of existing rows (e.g. "+2 lines appended: …");
   - `<upstream counterpart>` — the consolidated copy's tracked source, from the upstream references table in `PATCHES.md` (or "self-authored (no upstream)" per the `PATCHES.md` self paragraph);
   - `<verification method>` — a checkable statement, e.g. "git diff vs the pinned upstream shows exactly the changed lines".
2. **Only after the row exists**, update the consolidated copy: overwrite each changed file the diff lists with its store version, keeping the relative path; files the store removed are left alone. The store copy stays in place.

A modified stray the user declines to recover is left alone.

**Done when**: the row is filled with no placeholders, the consolidated copy reflects the store content, and the dry-run no longer reports the skill as a modified stray.

## 4. Verify the recovery, re-run the report

Re-run the dry-run (step 1). Every skill that was a stray must now read **current**; anything still reading stray needs the corresponding step again, and nothing in the store has changed — consolidation copies out of it, never into it.

**Done when**: the re-run reads `0 new stray, 0 modified stray`, or only the strays the user explicitly declined.

## 5. Propose commit, push, and distribute — in that order

When anything was recovered, end by proposing the three steps — the git writes and the distribution run need the user's go-ahead:

1. **commit** the recovery in the aggregation repo — the new consolidated copies and the completed patch row;
2. **push**;
3. **distribute** — run the distribution chain so the recovered content goes live in the store and the lock file records it:

```
npx skills add hu3rror/my-skills -a pi universal -s '*' -g -y
```

The distribution chain owns the lock file; consolidation never edits it. If the report showed nothing to recover, say so — there is nothing to commit, push, or distribute.