# Recover store strays by consolidation, not by redirecting pi's runtime

> [ZH] 决策：pi 运行时继续读 canonical skills store；store 里的游离技能（新建或魔改）在下次分发前由手动触发的 consolidation 机制复制进聚合仓库，魔改的 vendored 技能按 ADR-0002 记入 PATCHES.md。否决了把 pi 运行时重定向到聚合仓库等替代方案。

Status: accepted

## Context

Agent edits to skills land in the canonical skills store: pi reports skill locations at junction paths (`~/.pi/agent/skills/<name>` → `~/.agents/skills/<name>`), so a write through the reported path resolves into the store. The store is unversioned and the next distribution or update silently overwrites it. The aggregation repo is the only content source; the store is a derived target. Redirecting pi's runtime to read the aggregation repo directly would fix the write target, but carries costs (see Considered Options). We chose instead to keep the runtime as-is and recover the store's unversioned content after the fact.

## Decision

Keep pi reading the canonical skills store. Add a manual, on-demand consolidation mechanism that, before the next distribution, copies stray skills from the store into the aggregation repo:

- A **new stray** (a store skill the distribution chain does not track, e.g. written directly into `~/.pi/agent/skills/`) is copied to `skills/self/` when self-authored, or `skills/other/` while provenance is unknown.
- A **modified stray** (a tracked skill whose store content differs from its consolidated copy) is copied back into the consolidated copy and recorded as a `PATCHES.md` row per ADR-0002, so vendor sync never overwrites it.
- The store copy is left in place; consolidation never deletes from the store. Making the recovered edit live in the store requires commit + push + a re-run of the distribution chain.
- Trigger: a script (`scripts/consolidate-strays.mjs`) wrapped in a skill (`skills/self/consolidate-strays/`), invoked manually. No automatic triggering.

## Considered Options

- **Redirect pi's runtime to the aggregation repo** (user settings `skills` entry, precedence rank 2): rejected. It is an agent-settings change (R1-gated), produces a name-collision diagnostic for every adopted skill, makes pi run the uncommitted working tree, and suppressing the store copies to avoid the noise would hide trial-only skills from pi, breaking the trial flow.
- **Make the canonical skills store a junction view of the repo**: rejected. Requires junction surgery and retiring the distribution command for repo skills on machines that have a checkout, and the WSL instance has no repo checkout at all.
- **Route everything through the aggregation repo** (trials included): rejected. Changes the trial gesture from one `npx skills add` command to a copy-into-repo step and dirties the working tree during every trial.

## Consequences

- The store remains a legitimate place for unversioned, in-session edits; the loss window is bounded by the next distribution of that skill.
- Consolidation must run before any distribution or update, never after.
- PATCHES.md discipline extends to modified strays: a recovered edit to a vendored skill is only safe once its patch row exists.
- `~/.pi/agent/skills` junctions stay; they are distribution artifacts, not strays.
