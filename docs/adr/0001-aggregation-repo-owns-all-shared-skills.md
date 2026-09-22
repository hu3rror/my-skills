# The aggregation repo owns all shared skills

> [ZH] 决策：全部共享技能收进聚合仓库作为唯一内容源；canonical skills store 是派生产物、从不直接编辑；`~/.pi` 只含 junction、不再托管技能副本；分发链的源固定指向聚合仓库。

Status: accepted

Skills used to be installed from upstream sources directly into the canonical
skills store, which has no version control and no patch layer, so local edits
were silently lost on the next update. We decided that every shared skill lives
version-controlled in the aggregation repo, organized by upstream source; the
canonical skills store is a derived target installed from it; the pi config
(`~/.pi`) hosts no skill copies (junctions only); and the distribution chain's
source stays pinned to the aggregation repo so future updates flow through the
patched copies.

**Considered Options**: keep hosting the two pi-specific skills in `~/.pi`
(rejected: no version control, breaks the single-home model); edit
`~/.agents/skills` directly (rejected: no patch layer, clobbered on update).

**Consequences**: pi-specific skills become visible to other harnesses sharing
the canonical store — mitigated by keeping `disable-model-invocation: true`.
