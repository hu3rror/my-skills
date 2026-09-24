---
name: setup-repo
description: "Run the one-shot per-repo setup: drive setup-matt-pocock-skills (issue tracker, triage labels, domain docs) then setup-coding-standards (CODING_STANDARDS.md) in a single run, with the maintainer's standard answers pre-filled and no re-asking on the default path."
disable-model-invocation: true
---

# Set up this repo in one run

One-run entry that makes a repo usable by the engineering skills. A thin orchestrator: it drives the two setup primitives in order and contains only order and routing facts — never restate their steps or copy their content.

## Standard answers (editable — this user's repos always pick these)

- **Issue tracker**: GitHub
- **Triage labels**: the default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)
- **Agent file**: edit the one that exists — `CLAUDE.md` if present, else `AGENTS.md`; never create the other
- **Domain docs**: single-context (`CONTEXT.md` + `docs/adr/` at the root) unless monorepo signals say otherwise

## Process

### 1. Explore

Run the `setup-matt-pocock-skills` exploration step: `git remote -v`, `AGENTS.md`/`CLAUDE.md` at the root, `CONTEXT.md`/`CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/`, `.scratch/`, monorepo signals, and whether the `triage` skill is installed.

### 2. Run `setup-matt-pocock-skills` with the defaults pre-filled

Follow its process, but apply the standard answers above instead of asking each section. Ask only when exploration evidence contradicts a default or evidence is missing, and lead each asked section with the recommended answer:

- Remote is GitLab → propose GitLab; no remote at all → offer GitHub / GitLab / local markdown / other.
- Only `CLAUDE.md` exists, or neither agent file exists → the agent-file choice needs the user.
- Monorepo signals present → offer the multi-context layout.
- `triage` not installed → skip its section silently.
- Prior output already exists in `docs/agents/` → confirm before re-running (a re-run is only needed to switch trackers).

Its own rule stands: never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa).

### 3. Then run `setup-coding-standards`

It writes `CODING_STANDARDS.md` at the repo root (the baseline verbatim, plus verified repo conventions). Its guardrail is inherited unchanged: if the repo already has a standards file, it stops and reports — write nothing.

### 4. One combined confirm, then write

Present a single draft covering everything: the `## Agent skills` block, the `docs/agents/*` files, and the `CODING_STANDARDS.md` content. Let the user edit before writing. Then write it all.

### 5. Done

Report what was written and where. The primitives remain available on their own when only part of the setup is wanted (e.g. `setup-matt-pocock-skills` alone for a throwaway repo).

## Out of scope

- Extending the `## Agent skills` block shape or adding sections the primitives don't write: the primitives are the single home for their outputs.
- Anything an existing standards file already covers: the human decides what changes.
