# Shared Skills

The version-controlled single home of every shared agent skill, organized by upstream source. Owns the distribution chain into the machine-local canonical skills store and the patch record for every deviation from upstream.

## Distribution & Ownership

**Aggregation repo**:
The version-controlled home of all shared skills, organized by upstream source; the only content source for the distribution chain.
_Avoid_: skills store (confused with the canonical skills store), my-skills (this repo's proper name, not the concept), upstream (reserved for the external vendored sources)

**Repo anchor** (仓库锚点):
The machine-local record of where the aggregation repo lives (`~/.agents/.my-skills-repo`, one line), read at the start of every maintenance run so the flow never assumes the working directory is the repo; rewritten only when the user reports a relocation or re-clones (ADR-0009).
_Avoid_: repo path (the value, not the mechanism), pointer file (implementation name)

**Consolidated copy**:
A skill's file as it lives in the aggregation repo — the middle copy between the upstream original and the canonical-store copy, and the one that carries patches.
_Avoid_: copy (too generic), patched copy (used but undefined)

**Canonical skills store**:
The machine-local runtime directory (`~/.agents/skills`) that `npx skills` installs into from the aggregation repo. A derived distribution target — never edited directly, because the next update silently clobbers local edits.
_Avoid_: canonical source, canonical copies (reserve "canonical" for this store)

**Distribution chain**:
The pipeline `npx skills add <aggregation repo> -a universal -s '*' -g` → canonical skills store (`~/.agents/skills`), which pi and the other harnesses that read the standard Agent Skills location consume directly. `-a universal` targets only the canonical store: a single `-a <agent>` argument flips the CLI into copy mode (writing real skill directories into that agent's own folder) and `--all` would link every agent detected on the machine. Works only while the aggregation repo stays the single configured source.
_Avoid_: install (a single hop, not the chain)

**Vendor sync**:
The upstream leg of the skill flow, opposite the distribution chain: the script (`scripts/vendor-sync.mjs`) that pulls upstream skills into the aggregation repo's consolidated copies, and whose `merge` subcommand rebuilds the three-way merge for patched files upstream changed since their pinned base.
_Avoid_: sync script (too generic)

**Junction**:
The link type a per-agent installer (e.g. `npx skills -a <agent>`) writes into an agent-specific skills folder (such as `~/.claude/skills`) to expose canonical-store skills without copying. Not used by this repo's distribution chain, which installs to the canonical store directly so every harness reading the standard location sees the same content.
_Avoid_: symlink (a different Windows mechanism), pi skills (ambiguous with pi-specific skill)

**Upstream**:
An external skill source vendored into the repo (mattpocock/skills, yetone/kill-ai-slop, cloudflare). Never consumed directly by the distribution chain. Provenance — the traced attribution of a skill to its upstream (`~/.agents/.skill-lock.json`) — decides the source directory; unattributed skills wait under `skills/other/`.
_Avoid_: source (too generic)

**pi-specific skill**:
A skill owned by this user's pi workflows (`npm-release`, `my-pi-extension-maintenance`, `pi-session-search`); lives under `skills/self/` and must keep `disable-model-invocation: true` so other harnesses sharing the canonical store never auto-trigger it. Self-authored skills not owned by pi workflows are general-purpose (`de-slop`, `my-skills-maintenance`, `setup-repo`, `write-release-notes`); model-invocation is allowed when the description is scoped tightly enough that other harnesses never fire it spuriously.
_Avoid_: pi skill (drops the other-harness visibility consequence)

**Archived skill** (归档技能):
A self-authored skill moved from `skills/self/` to `archive/` (outside `skills/`): still version-controlled and readable in the repo, but no longer distributed to the canonical store — the soft-retirement middle path between maintained and hard-retired (`git rm`). The distribution chain only scans `skills/`, so the archive is skipped with no extra mechanism; the store-side copy must be removed with `npx skills remove` (add never prunes).
_Avoid_: retired skill (hard deletion, no working-tree copy)

## Skill flows

**Repo setup** (仓库级 setup):
The single-run entry that makes a repo usable by the engineering skills, composed as one thin orchestrator (`skills/self/setup-repo`, `disable-model-invocation: true`) driving two setup primitives back-to-back: `setup-matt-pocock-skills` (issue tracker, triage labels, domain docs — with the maintainer's standard answers pre-filled: GitHub, default triage labels, the existing AGENTS/CLAUDE file) and then `setup-coding-standards` (`CODING_STANDARDS.md`). The composite delegates, never copies content — each primitive keeps its own single home, so upstream drift in a vendored primitive flows through automatically.
_Avoid_: setup flow (generic), repo configuration (ambiguous with config files)

## Output language

**Primary content** (主内容):
The single human-facing deliverable of a publishing skill that carries the Chinese summary on personal repos — the PR body (`pr`) or the spec issue (`to-spec`). Derived work items (tickets, sub-issues, follow-ups) are not primary content and get no summary.
_Avoid_: main content (vague), spec issue (names one deliverable, not the concept), parent issue (parentage is not the discriminator — a parent issue gets no summary)

## Update detection

**Vendor freshness check**:
The periodic inspection that determines whether an upstream source has content not yet present in its consolidated copy. Reports rather than modifies: findings land in a pending-update issue, never in changed files.
_Avoid_: update check, update watcher

**Pending update**:
A state in which an upstream source's current content differs from its consolidated copy — new or changed files, files upstream removed (kept for review), or a patched file that upstream modified.
_Avoid_: update, diff

**Pending-update issue**:
The GitHub issue that records a pending update for the maintainer to act on. Open while the update is pending; closed by the freshness check once the copies are current again.
_Avoid_: notification issue, alert

## Stray recovery

**Stray skill** (游离技能):
A skill present in the canonical skills store that the distribution chain does not track, or whose content differs from the aggregation repo's consolidated copy. A new stray was written directly into the store; a modified stray is a local edit to a tracked copy that the next update or distribution would overwrite. Both are recovered by consolidation: recovery copies a store-side edit back into the repo, while a newer repo-side copy is a pending distribution — committed and pushed, never recovered.
_Avoid_: orphan (reserved for unattributed upstream provenance), loose skill

**Consolidation** (回收):
The action of copying a stray skill into the aggregation repo — `skills/self/` for self-authored content, `skills/other/` while provenance is unknown — and, for a modified vendored skill, recording the deviation as a per-patch record at `patches/<source>/` so vendor sync never overwrites it (record-first; the recovered edit goes live only after commit + push + a distribution run). Runs before the next distribution, never after.
_Avoid_: write-back, sync back (imply a copy direction the store does not own)

## Patches

**patch record** (补丁记录):
A per-patch, machine-verified record of one deviation from upstream, at
`patches/<source>/` (format: map ticket #22). Each carries frontmatter (`id`,
`file`, `upstream`/`pin` resolved via `vendor/<source>.json`, `verification`,
`after:` for stacked hunks) plus, for diff-verified records, the unified-diff
hunks `scripts/verify-patch-records.mjs` re-applies to the pinned upstream
blob and byte-compares to the local copy; behavioral records (self-authored,
no upstream baseline) carry static asserts + a human re-run recipe instead.
The `patches/**/*.md` glob is the manifest; the former `PATCHES.md` table's
concerns were rehomed here and to `vendor/` / `docs/advisory-notes.md` at the
map #18 migration.
_Avoid_: patch list, changelog, patch file (a `.patch` artifact the repo does
not ship)
**Snapshot import**:
The one-time act of importing the repo byte-identical from the canonical-store snapshot, which carried the four baseline patches into the repo as its baseline.
_Avoid_: seeding, seed source (the gardening metaphor; import is the operation)

**Baseline patch**:
A patch carried into the repo by the snapshot import (four: research/wayfinder push notes, quoted `@me`, kill-ai-slop `disable-model-invocation`).

**A-class patch**:
A must-fix platform patch applied to a consolidated copy. The set is not counted here: `patches/**/*.md` (minus its README) is the manifest, and the three platform rows it started from are in `docs/patch-baseline.md`.

**B-class advisory note**:
A conditional environment issue recorded in `docs/advisory-notes.md`, not patched into the skill body. The table there is the list.

## Maintenance budget

**Maintenance budget** (维护成本预算):
The measurable upper bound on the redesign's maintenance machinery (map #18 / ticket #27): scripts code + tests stay within the measured baseline, CI jobs are not increased, and common-case per-operation steps only decrease — vendor sync and local skill edit each one command + one check. The measured numbers and the bump rule live in `docs/maintenance-budget.md`, enforced by `scripts/maintenance-budget.test.mjs` in the existing script-tests job (ADR-0007); raising a bound is a deliberate act recorded there.
_Avoid_: complexity budget (narrower — the size sub-limit only), cost ceiling (unmeasured)
