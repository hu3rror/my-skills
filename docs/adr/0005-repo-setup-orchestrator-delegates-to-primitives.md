# Repo setup is a thin self-authored orchestrator that delegates to the setup primitives

> [ZH] 决策：仓库级 setup 由自创薄编排器 `skills/self/setup-repo` 承担——它按序委托 `setup-matt-pocock-skills`（预填标准答案：GitHub + 默认 triage labels + 现存 agent 文件）和 `setup-coding-standards`（`CODING_STANDARDS.md`），只含顺序/路由事实、绝不复制内容；`ask-matt` 的 Precondition 以 A-class patch 指向它；否决把自创内容折进 vendored skill。

Status: accepted

The user runs per-repo setup with the same three answers every time (GitHub
issue tracker, default triage labels, the existing AGENTS/CLAUDE file) and
wants it done in one run, without re-answering. `CODING_STANDARDS.md` was
already a first-class artifact of the flow map — `code-review`'s Standards axis
reads it and `retro` maintains it — but nothing created it as part of setup. We
decided the one-run entry is a self-authored thin orchestrator
(`skills/self/setup-repo`, `disable-model-invocation: true`) that delegates to
the two setup primitives in order, pre-filling the standard answers and asking
only when exploration evidence contradicts a default. The vendored router
`ask-matt` gets its Precondition patched (PATCHES.md A-class) to point at the
composite.

**Considered Options**: fold the coding-standards init into the vendored
`setup-matt-pocock-skills` (rejected: a whole self-authored section welded into
an upstream file means a manual merge on every upstream update, permanent
freshness-check noise, and a provenance muddle — the self-authored baseline
would ship under mattpocock provenance); chain the two primitives through
`ask-matt` text alone (rejected: no named one-shot entry, relies on the agent
following routing text; still adopted as the routing patch); a composite that
absorbs both primitives' content (rejected: creates a second home for the
vendored flow content that diverges on upstream updates).

**Consequences**: the vendored `ask-matt` now references a self/ skill —
cross-tree coupling, mitigated by the PATCHES.md row and the CONTEXT.md
"Repo setup" term so the reference cannot rot silently; `ask-matt` joins the
patched-file set, adding manual-merge flags whenever upstream churns it (it is
the most frequently-changing file in the collection — the dominant recurring
cost); the primitives stay independently runnable and single-homed; upstream
drift in a vendored primitive flows through the composite automatically, and
`setup-coding-standards`' guardrail (existing standards file → stop and report)
is inherited unchanged.
