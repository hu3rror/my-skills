# my-skills

[English](README.md) | [中文](README_zh-CN.md)

An aggregation repository of Agent Skills shared across harnesses, organized by
upstream source and version-controlled. It is the source of the machine-local
`~/.agents/skills` store. Editing `~/.agents/skills` directly works until
the next `npx skills update` re-downloads from upstream and silently discards
local edits; this repository is the durable maintenance form (patches live in
the skill files, fork-style).

## Layout (by source)

| Directory | Source | Notes |
|---|---|---|
| `skills/mattpocock/{engineering,productivity}/<name>/` | [mattpocock/skills](https://github.com/mattpocock/skills) | 25 skills (engineering 19 + productivity 6); the upstream `in-progress` / `misc` categories and two unused skills are excluded from vendor sync (exclusions in `vendor/mattpocock.json`) |
| `skills/kill-ai-slop/<name>/` | [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop) | kill-ai-slop (upstream path is `skill/`; normalized to the source dir here) |
| `skills/cloudflare/<name>/` | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | security-audit (provenance traced; recorded in the local `~/.agents/.skill-lock.json`) |
| `skills/awesome-copilot/<name>/` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | create-readme (manual fork: remote README templates localized into `references/`; not in vendor-sync SOURCES, see `vendor/awesome-copilot.json`) |
| `skills/self/<name>/` | self-authored | de-slop, my-skills-maintenance (general-purpose; de-slop carries `disable-model-invocation: true`, explicit invocation only; my-skills-maintenance is model-invoked — one entry for the aggregation repo's maintenance flows, with a description scoped to repo-maintenance vocabulary and a read-only dry-run first step, so other harnesses never fire it spuriously); write-release-notes (general-purpose, model-invoked — description scoped to GitHub Release-notes requests, so other harnesses fire it only when release notes are being written); setup-repo (general-purpose, `disable-model-invocation: true` — one-run per-repo setup driving `setup-matt-pocock-skills` then `setup-coding-standards`, see ADR-0005); npm-release, my-pi-extension-maintenance, pi-session-search (pi-specific, `disable-model-invocation: true`, so other harnesses never auto-trigger) |
| `archive/` | — | soft-retirement home for unmaintained `self/` skills — kept in the repo but **not** distributed (the chain only scans `skills/`; see [archive/README.md](archive/README.md)); currently web-debug |

**Discovery depth rule**: the `vercel-labs/skills` CLI discovery constrains only
the depth of skill directories (dirs containing `SKILL.md`): at most three
levels under the `skills/` container (`skills/<cat>/<cat>/<name>/`). The
deepest skill dir here is `skills/mattpocock/<category>/<name>/`, within the
rule. Helper files inside a skill (`agents/`, `references/`, `scripts/`) are
not depth-limited.

## Baseline import

The repo was imported byte-for-byte (105 files) from the current
`~/.agents/skills` snapshot, so it carries the 4 baseline patches the snapshot
already had. Every deviation from upstream — the baseline and later patches —
is recorded as a per-patch record under
[`patches/`](patches/) (outside `skills/`, so the distribution chain never
distributes it); B-class environment notes live in
[`docs/advisory-notes.md`](docs/advisory-notes.md) and per-source pins and
exclusions in [`vendor/`](vendor/README.md) (`self/` skills are self-authored and
have no upstream); upstream sourced files were verified file-by-file. The
baseline patches:

- `research/SKILL.md`: pi's background research agent pushes its completion
  findings instead of being polled (+2 lines)
- `wayfinder/SKILL.md`: how to handle research subagent completion pushes
  (+1 line)
- `setup-matt-pocock-skills/issue-tracker-github.md`: `--add-assignee "@me"`
  quoting + Windows PowerShell splatting warning
- `kill-ai-slop/SKILL.md`: `disable-model-invocation: true`

The pi-specific skills (`npm-release`, `my-pi-extension-maintenance`,
`pi-session-search`) live in `skills/self/`; `~/.pi` no longer hosts skill
copies (migration in ticket #5).

## Install / distribute

```bash
# Install globally into the canonical store (~/.agents/skills).
# Do NOT use --all: it links every agent detected on this machine.
# -a universal targets only the canonical store; a single
# -a target silently falls back to copy mode (real dirs, not junctions).
npx skills add hu3rror/my-skills -a universal -s '*' -g -y
```

The distribution chain writes the canonical store, which pi and the other
harnesses that read the standard Agent Skills location consume directly — no
per-agent links are created. `-a universal` targets only the canonical store,
because a single `-a` target silently degrades to copy mode (real directories
in that agent's own folder), and `--all` would link every agent detected on
the machine, which this repo does not want.

## Sync upstream

```bash
# Dry run: report what would change and which patched files are skipped, write nothing
node scripts/vendor-sync.mjs --dry-run

# Real sync: shallow-clone each upstream into skills/<source>/, skipping patch-record files
node scripts/vendor-sync.mjs

# Three-way merge patched files upstream changed (writes clean, patch-surviving merges;
# exits 1 when any file needs attention — conflict / reshaped / adopted / unpinnable)
node scripts/vendor-sync.mjs merge
```

Patched files (the patch records' `file:` set) are never overwritten; a patched file is
reported as needing a merge only when upstream actually changed it since the
pinned commit in `vendor/<source>.json`. The `merge`
subcommand then rebuilds each such three-way merge (`git merge-file`, base =
the pinned commit) and writes the result only when the local patch survives
mechanically — its changed lines identical — leaving conflicts, reshaped
patches, adopted patches, and unpinnable bases to the maintainer. Files
upstream removed are reported but not deleted; the maintainer runs `git rm` by
hand. (The old `vendor-sync` GitHub Actions workflow was dropped at the map #18
migration — the unified skill `my-skills-maintenance` is the repair entry.)

A daily vendor freshness check (`.github/workflows/vendor-freshness-check.yml`,
cron UTC 01:00 + manual dispatch) runs the dry-run and turns its result into a
single `pending-update` issue assigned to the maintainer — opened when a source
has changes not yet vendored, closed again once the copies are current. It
never modifies files; the real sync stays manual.

Resolving a pending update — sync, three-way-merge patched files onto the new
upstream, bump the pins, record patches, verify, commit/push/close — is the
`vendor-sync` branch of `skills/self/my-skills-maintenance` (the unified
maintenance skill, invoked as `my-skills-maintenance`): it drives the whole
loop, proposing the commit, push, and issue close for your go-ahead.

## Consolidate stray skills (before distributing)

The canonical store is a derived target: content written directly into
`~/.agents/skills` is silently overwritten by the next distribution or update.
Run consolidation before every distribution run — or after any local skill
edit — to recover what the chain does not track into the aggregation repo:

- a **new stray** — a store skill absent from the lock file and the repo
  (written straight into the store) — is copied into the repo on request:
  `skills/self/<name>` when self-authored, `skills/other/<name>` while
  provenance is unknown;
- a **modified stray** — a tracked skill whose store content differs from its
  consolidated copy — is reported with a diff summary and a pointer to record
  it as a per-patch record before the copy-back (record-first, ADR-0002);
  consolidation never copies a modified stray on its own.

Say "consolidate stray skills" (`skills/self/my-skills-maintenance`, the
stray-recovery branch), or run the script directly:

```bash
node scripts/consolidate-strays.mjs             # dry-run report (default; read-only)
node scripts/consolidate-strays.mjs --apply <name> [--to self]  # copy one new stray into the repo
```

Dry-run is the default and writes nothing; apply keeps the store copy in
place; recovered edits go live only after commit + push + a distribution run.

## Conventions

- One directory per skill, containing `SKILL.md` (directory + SKILL.md works
  with every harness that supports the spec)
- Scripts use paths relative to the skill directory, never hardcode harness
  paths like `~/.pi`; distributed skills carry no machine-specific paths
  (enforced by `scripts/skill-hygiene.test.mjs`)
- pi-specific skills live in `skills/self/` and must keep
  `disable-model-invocation: true`
- Skill directories (containing `SKILL.md`) go at most
  `skills/<cat>/<cat>/<name>/` deep (CLI discovery limit); helper files inside
  are not limited

## Related docs

- Operational maintenance runbook (how to verify + what to do per case):
  [docs/agents/maintenance.md](docs/agents/maintenance.md)
- Maintenance spec and migration plan:
  [docs/specs/powershell-portability-and-maintenance.md](docs/specs/powershell-portability-and-maintenance.md)
- Repo collaboration conventions: [AGENTS.md](AGENTS.md), [docs/agents/](docs/agents/)