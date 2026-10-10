# The maintenance flow locates the aggregation repo through a machine-local pointer, never an assumption

Status: accepted

The maintenance chain derives its repo root from the working directory and
script locations (`node scripts/...` in the skill body; `DEFAULT_REPO =
resolve(SCRIPT_DIR, "..")` / `ROOT = resolve(dirname(import.meta.url), "..")`
in the scripts). That is correct only while the operator is physically inside
the aggregation repo — pi opened anywhere else, or a copy of the script
outside the repo, and the flow silently classifies, syncs, or merges against a
wrong target (issue-tracker `$TEMP` note and the `.agents/.skill-lock.json`
precedent show machine-local state belongs outside the store, not inside it).

## Decision

1. **The repo anchor**: `~/.agents/.my-skills-repo`, sibling of the canonical
   skills store and its lock file — machine-local state outside the
   distributed skill, never installed by `npx skills add`. Content: the
   aggregation repo root, one line.
2. **The skill procedure** (`skills/self/my-skills-maintenance#Locate the
   repo`): shared rule 1 reads the repo anchor, verifies it (directory exists +
   origin ends with `/my-skills` + owns `scripts/vendor-sync.mjs`), and binds
   `$REPO` for every command. Missing or stale → ask the user (new location,
   or re-clone from GitHub) and write the answer back, one line. The flow
   never assumes the working directory is the repo.
3. **The script backstop** (`scripts/repo-guard.mjs`, shared and imported by
   the three root-deriving scripts): shape (has `scripts/vendor-sync.mjs` +
   `skills/`) and identity (`git remote get-url origin` ends with
   `my-skills`) checks; `consolidate-strays` guards its script-relative
   default only when `--repo` is not given (fixtures pass `--repo`),
   `vendor-sync` and `verify-patch-records` guard module-level and exit 1 with
   a clean message when run from a copy outside the repo. A wrong target fails
   loudly, never silently.

## Considered Options

- **Pointer inside the distributed skill folder** (the original proposal):
  rejected — `npx skills add` copies the whole folder to every machine, so a
  machine path would broadcast; `skill-hygiene.test.mjs` forbids machine paths
  in `skills/`; and the store copy is a derived target whose local edits the
  next update silently clobbers (GLOSSARY: canonical skills store).
- **Environment variable as single source** (`MY_SKILLS_REPO`): rejected — a
  second stateful fact the user must configure on every machine, for a value
  the scripts already derive from their own location; the repo anchor is
  skill-written, so it self-heals through the ask step.
- **Pure probe chain (cwd → env → ask), no file**: rejected — with pi opened
  outside the repo, the flow would ask the user where the repo is on every
  run; the repo anchor persists the answer between sessions.
- **Auto-clone to a cache dir to make location irrelevant**: rejected —
  maintenance writes (patch records, consolidated copies) must land in the
  working repo; a cache copy would diverge from it.

## Consequences

- The maintenance skill works from any pi working directory; the first-run
  cost is one question to the user, afterwards the repo anchor answers.
- A moved or deleted repo surfaces as a loud refusal (`not the my-skills
  aggregation repo` + pointer hint), never as a mis-targeted classification.
- Machine-local state stays outside the distributed content and the derived
  store, matching the `.skill-lock.json` precedent (installer writing into
  `~/.agents/` is user-approved by design).
- Cost: one new shared module + tests, guarded script entries, and a
  documented maintenance-budget bump (code+tests ceiling raised to include
  the guard); the scripts re-verify identity on every run (one `git` spawn).