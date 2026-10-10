---
name: setup-repo
description: "Run the one-shot per-repo setup: drive setup-matt-pocock-skills (issue tracker, triage labels, domain docs) then setup-coding-standards, standard answers pre-filled, no re-asking."
disable-model-invocation: true
---

# Set up this repo in one run

One-run entry that makes a repo usable by the engineering skills. A thin orchestrator: it drives the two setup primitives in order and contains only order and routing facts — never restate their steps or copy their content.

## Standard answers (editable — this user's repos always pick these)

- **Issue tracker**: GitHub
- **Empty repo (no remote, may not even be a git repo)**: create a GitHub **private** repo from the current directory first, so the GitHub default still holds (step 2)
- **Triage labels**: the default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)
- **Agent file**: edit the one that exists — `CLAUDE.md` if present, else `AGENTS.md`; never create the other
- **Domain docs**: single-context (`GLOSSARY.md` + `docs/adr/` at the root) unless monorepo signals say otherwise

## Process

### 1. Explore

Run the `setup-matt-pocock-skills` exploration step: `git remote -v`, `AGENTS.md`/`CLAUDE.md` at the root, `GLOSSARY.md`/`GLOSSARY-MAP.md`, `docs/adr/`, `docs/agents/`, `.scratch/`, monorepo signals, and whether the `triage` skill is installed.

### 2. Ensure a remote when the repo has none

When exploration found no remote at all (`git remote -v` empty), create the remote before the tracker setup:

1. If the directory is not yet a git repo, `git init`.
2. If there is no commit yet (an empty directory has nothing to push), create a minimal initial commit first — a one-line `README.md` or `.gitignore` — because `git push` with no commits fails (`src refspec HEAD does not match any`); pushing after the remote exists would leave a created-but-empty remote behind.
3. Create the repo: `gh repo create <dir-name> --private --source=. --push`. New GitHub repos enable Issues by default — no extra flag. The remote defaults to the directory name.
4. On failure (`gh` unauthenticated, network, name clash): fall back to asking — offer GitHub / GitLab / local markdown / other.

The remote exists before `setup-matt-pocock-skills` runs, so its Section A finds a GitHub remote and proposes GitHub; its "local markdown for repos without a remote" fallback never fires.

### 3. Run `setup-matt-pocock-skills` with the defaults pre-filled

Follow its process, but apply the standard answers above instead of asking each section. Ask only when exploration evidence contradicts a default or evidence is missing, and lead each asked section with the recommended answer:

- Remote is GitLab → propose GitLab; no remote at all → step 2 already created a GitHub private repo — the GitHub default holds.
- Only `CLAUDE.md` exists, or neither agent file exists → the agent-file choice needs the user.
- Monorepo signals present → offer the multi-context layout.
- `triage` not installed → skip its section silently.
- Prior output already exists in `docs/agents/` → confirm before re-running (a re-run is only needed to switch trackers).

Its own rule stands: never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa).

### 4. Then run `setup-coding-standards`

It writes `CODING_STANDARDS.md` at the repo root (the baseline verbatim, plus verified repo conventions). Its guardrail is inherited unchanged: if the repo already has a standards file, it stops and reports — write nothing.

### 5. One combined confirm, then write

Present a single draft covering everything: the `## Agent skills` block, the `docs/agents/*` files, and the `CODING_STANDARDS.md` content. Let the user edit before writing. Then write it all.

### 6. Done

Report what was written and where. The primitives remain available on their own when only part of the setup is wanted (e.g. `setup-matt-pocock-skills` alone for a throwaway repo).

## Out of scope

- Extending the `## Agent skills` block shape or adding sections the primitives don't write: the primitives are the single home for their outputs.
- Anything an existing standards file already covers: the human decides what changes.
