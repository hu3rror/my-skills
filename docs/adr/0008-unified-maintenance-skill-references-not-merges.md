# One unified maintenance skill that references, not absorbs, its sources

> [ZH] 决策：本聚合仓库的维护入口收敛为单一技能 `skills/self/my-skills-maintenance`——router + 五条已披露分支（vendor-sync / stray-recovery / patch-record / freshness / distribute），不是 router+子技能；退役 `consolidate-strays` 与 `my-skills-vendor-sync`。#18 out-of-scope：`writing-for-agents` 仍是独立的上游参考技能，my-skills-maintenance **只加载它、不并入它**（避免复制导致双份、并保住 retro/ask-matt 指向它的补丁引用）。

Status: accepted

Map #18 succeeded the two explicit-invocation maintenance skills
(`consolidate-strays`, `my-skills-vendor-sync`) with one discoverable entry that
serves every maintenance flow of this aggregation repo, decided in #26. The
question was *shape*, not *whether*: one router with disclosed references vs.
the router + primitive-skills pattern `setup-repo` established (ADR-0005).

## Decision

A single model-invoked skill `skills/self/my-skills-maintenance/`: its
frontmatter description is the model's one trigger (scoped to the repo's
maintenance vocabulary), and its **five branches are disclosed references**
(`references/{vendor-sync,stray-recovery,patch-record,freshness,distribute}.md`),
loaded only when the router's classification fires them. Shared rules (repo
locate, propose-before-write, verify-then-report, GLOSSARY vocabulary, and the
mandatory read-only stray dry-run) live once in the router, not restated per
branch. The two old skills are retired via `git rm` + store-side `npx skills
remove`.

**The reference question.** `writing-for-agents` stays a separate, vendored
reference skill (`skills/mattpocock/productivity/writing-for-agents`). The
unified skill **loads it as a reference** when the task is writing or editing
skill content (router shared rule 4) — it does **not** absorb or copy its
body. Per map #18's out-of-scope note: moving `writing-for-agents` out of
`skills/` would break the patch records/patch pointers `retro` and `ask-matt`
carry that point at it; and folding its content into the unified skill would
create a second home for a vendored skill's body that diverges on upstream
updates (the same reason ADR-0005 rejected absorbing the setup primitives).

## Considered Options

- **Router + primitive sub-skills** (five discoverable skills, ADR-0005's
  pattern): rejected — reintroduces five always-loaded descriptions for
  repo-local procedure text one skill owns (the discoverable-skill sprawl the
  redesign collapses). setup-repo delegates because its primitives are
  separately useful and vendored; these branches are not.
- **Absorb `writing-for-agents` into the unified router**: rejected — breaks
  `retro`/`ask-matt`'s patched pointers to it, and copies a vendored body into
  a second home that diverges on upstream updates. Reference, not merge.
- **No single entry** (keep the two named skills): rejected — piles cognitive
  load on the human, the problem the router cures.

## Consequences

- One discoverable skill stands for all five maintenance flows; a wrongly-fired
  run proposes, never executes (first step is a read-only dry-run, every write
  waits on the user).
- `writing-for-agents` remains the single source of truth for drafting
  skill/agent docs; loading, not merging, keeps `retro`/`ask-matt` patch
  pointers intact and avoids a diverging copy.
- The five branches compose in order, never in parallel (e.g. vendor-sync →
  distribute), each ending in the same commit → push → issue-close /
  distribution proposal.
- New source-of-truth caveat: the reference relationship is a build-in
  behaviour of the router's shared rules, not a separate doc — the router
  `SKILL.md` is where the "load `writing-for-agents` first" rule lives.