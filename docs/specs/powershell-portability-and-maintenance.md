# Spec: PowerShell Portability & Low-Cost Maintenance for Shared Skills

> Status: implemented
> Scope: `hu3rror/my-skills` aggregation repo + `~/.pi` Windows-side config

## Problem Statement

The user runs two pi instances: one on Windows (default shell is PowerShell
5.1/7) and one inside WSL (default shell is bash). Most of the 28 installed
skills come from upstream repositories — `mattpocock/skills` and
`yetone/kill-ai-slop` — plus self-authored skills, and are distributed via the
`npx skills` CLI (`vercel-labs/skills`) into a canonical `~/.agents/skills`
directory, with `~/.pi/agent/skills` containing junctions to it.

A full audit of every skill file found real PowerShell conflicts (4 must-fix
spots) plus conditional environment-dependent issues, and — critically — the
maintenance model is broken: editing `~/.agents/skills` directly is safe until
the next `npx skills update`, which re-downloads from the upstream source and
silently discards local edits. There is no version control on `~/.agents/skills`
and no patch layer in `vercel-labs/skills` (verified: it has `add`/`update`/
`remove`, no overlay/patch mechanism). The audit effort itself (~27 files, 4
scan passes) is currently a one-off cost with nothing persisted.

## Solution

Consolidate every shared skill into the self-owned aggregation repository
`hu3rror/my-skills`, organized by upstream
source into folders, imported from the current `~/.agents/skills` snapshot (which
already contains 4 deliberate local patches), fix the PowerShell conflicts in
the consolidated copies, record every patch in a `PATCHES.md` manifest, and add
a lightweight upstream-sync mechanism that skips patched files and flags them
for manual merge. Windows-side, move the two pi-specific skills
(`npm-release`, `pi-extension-sync`) out of `~/.pi` into the aggregation repo,
and weave a PowerShell-execution-environment constraint into the existing
`~/.pi/agent/AGENTS.md` structure (not as a standalone rule).

Distribution chain stays unchanged: `npx skills add hu3rror/my-skills -a pi universal -s '*' -g`
writes the canonical copy to `~/.agents/skills` and re-creates the pi junctions.

## User Stories

1. As a Windows pi user, I want the `wizard` skill's verification steps to work
   under PowerShell (or clearly state the Git Bash/WSL requirement), so that I
   can validate a generated wizard script on Windows.
2. As a Windows pi user, I want generated wizard scripts to carry an explicit
   "run with Git Bash/WSL on Windows" note, so that I do not try to run a bash
   script in PowerShell.
3. As a Windows pi user, I want the `diagnosing-bugs` HITL loop template to
   carry the same Windows runtime note, so that the fallback loop is runnable on
   this machine.
4. As a Windows pi user, I want the `npm-release` skill to write release-notes
   temp files under `$env:TEMP` instead of `/tmp`, so that `gh release create
   --notes-file` does not fail on Windows.
5. As a GitLab-tracker user, I want `glab issue update <n> --assignee "@me"` to
   show the quoted form plus the Windows PowerShell splatting warning, so that
   claiming tickets does not error out on this machine (parity with the GitHub
   tracker template, which already has this note).
6. As a GitLab-tracker user, I want the heredoc instruction replaced with a
   PowerShell-friendly way to pass multi-line descriptions, so that creating
   issues works on Windows.
7. As the maintainer, I want every shared skill consolidated into
   `hu3rror/my-skills` organized by source (`mattpocock/`, `kill-ai-slop/`,
   `self/`, `other/`), so that all skills live in one version-controlled
   repository.
8. As the maintainer, I want the repository imported from the current
   `~/.agents/skills` snapshot, so that the 4 existing local patches
   (research/wayfinder push notes, GitHub `"@me"` quoting, kill-ai-slop
   `disable-model-invocation`) are preserved as the baseline.
9. As the maintainer, I want a `PATCHES.md` manifest listing every patch
   (file / patch summary / upstream counterpart / verification method), so that
   no local adaptation is lost on the next upstream sync.
10. As the maintainer, I want the upstream-sync mechanism to skip files listed
    in `PATCHES.md` and report "upstream updated a patched file — merge
    manually", so that automation never silently overwrites a local patch.
11. As the maintainer, I want the sync runnable as a manually-triggered GitHub
    Actions workflow (no scheduled cron initially), matching the observed
    low upstream change frequency.
12. As the maintainer, I want `npm-release` and `pi-extension-sync` moved into
    the aggregation repo under `skills/self/`, so that pi-specific skills are
    managed in the same place (accepted consequence: they also become visible
    to other harnesses sharing `~/.agents/skills`, but keep
    `disable-model-invocation: true` so they never auto-trigger).
13. As the maintainer, I want the PowerShell execution-environment constraint
    woven into the existing `~/.pi/agent/AGENTS.md` structure (section 2,
    first bullet of "改动范围"), not appended as a standalone rule, so that it
    reads as part of the rule system.
14. As the maintainer, I want `security-audit`'s upstream provenance traced; if
    no source is found it lands under `skills/other/`, so that no skill is
    orphaned or mis-attributed.
15. As the maintainer, I want `npx skills add hu3rror/my-skills -a pi universal
    -s '*' -g` re-run after the migration so that the canonical `~/.agents/skills` and the
    `~/.pi/agent/skills` junctions reflect the new consolidated layout.
16. As the maintainer, I want the conditional (B-class) issues — jq dependency
    in `npm-release`, `curl` alias semantics in `diagnosing-bugs`, `rg` in
    `kill-ai-slop` references, the `bash` phrasing in `web-debug` — recorded in
    `PATCHES.md` as advisory notes, not patched into skill bodies, so that
    upstream diffs stay minimal.
17. As a WSL pi user, I want the fixes to never remove bash-first behavior, so
    that the WSL instance (which uses bash natively) is unaffected.
18. As the maintainer, I want a verification checklist run after
    re-distribution (junctions present, `npx skills list` shows all skills,
    each patched command works in PowerShell), so that "done" means verified.

## Implementation Decisions

- **Repository layout** must stay within the `vercel-labs/skills` discovery
  depth (≤3 levels: `skills/<name>/`, `skills/<cat>/<name>/`,
  `skills/<cat>/<cat>/<name>/`). Adopted layout: `skills/mattpocock/<category>/<name>/`
  (preserving upstream `engineering|productivity|in-progress` categories),
  `skills/kill-ai-slop/<name>/`, `skills/self/<name>/`, `skills/other/<name>/`.
  Full-repo `git subtree` of upstream is rejected: it would produce a 4-level
  path that the discovery rule cannot see.
- **Baseline**: import from the current `~/.agents/skills` snapshot (not from
  upstream), because it already carries the 4 deliberate patches.
- **Patch strategy**: patches live directly in the repository's skill files
  (fork semantics); `PATCHES.md` is the source of truth for what is patched.
  Sync automation reads it to skip-and-flag. No `.patch` files, no post-apply
  step — the repo contains the patched artifacts the agents actually run.
- **Sync mechanism**: a small vendor script (Node or PowerShell, runnable
  locally and in CI) that shallow-clones each upstream, syncs into
  `skills/<source>/...`, skips `PATCHES.md`-listed files (reporting them as
  manual-merge required), and emits a summary. Wrapped in a manually-triggered
  GitHub Actions workflow.
- **Must-fix patches (A-class)**, applied to the consolidated copies:
  1. `wizard`: verification section gains a Windows branch (no `bash -n` /
     `chmod +x` blind run); body gains a "Windows: run with Git Bash/WSL" note.
     Script structure untouched; no `.ps1` duplicate implementation.
  2. `diagnosing-bugs`: same Windows runtime note for the HITL template; the
     "Curl / HTTP script" wording stays but the PowerShell-alias caveat goes to
     `PATCHES.md`.
  3. `npm-release`: temp file path `/tmp/...` → `$env:TEMP\...`.
  4. `setup-matt-pocock-skills` GitLab template: `--assignee "@me"` quoted +
     PowerShell splatting warning (mirror the GitHub template); heredoc
     instruction replaced with a PowerShell-friendly multi-line approach.
- **Advisory-only (B-class)**, recorded in `PATCHES.md`, not patched into
  bodies: jq availability for `gh --json` pipelines, `curl` alias semantics on
  PS 5.1 vs `curl.exe` on PS 7, `rg` not installed by default on Windows,
  `web-debug`'s "run it with `bash`" line.
- **Windows config**: `npm-release` and `pi-extension-sync` move to
  `skills/self/`; `~/.pi` drops them (`git rm` the tracked `npm-release`,
  delete the untracked `pi-extension-sync`), `.gitignore` whitelist updated;
  `~/.pi/agent/AGENTS.md` section 2 gains the environment constraint as its
  first bullet (draft in Further Notes).
- **AGENTS.md constraint placement**: section 2 ("改动范围"), first bullet —
  "本机 shell 是 Windows PowerShell（5.1/7），WSL 里的 pi 才用 bash；执行
  skill/文档中的 bash 或 Unix 命令前先转译为 PowerShell 等效；bash 专属脚本
  经 `bash.exe`/`wsl.exe` 显式调用；平台差异清单以 my-skills 仓库
  `PATCHES.md` 为准。"

## Testing Decisions

- **What makes a good test here**: end-to-end over the distribution chain, plus
  per-command checks on the exact patched commands under PowerShell. A passing
  scan is not the same as a command that runs.
- **Modules tested**:
  - Distribution: `npx skills add hu3rror/my-skills -a pi universal -s '*' -g`
    succeeds; `npx
    skills list` shows all 27+ skills; `~/.pi/agent/skills/*` junctions point at
    `~/.agents/skills/*`; `npm-release`/`pi-extension-sync` no longer exist as
    real dirs under `~/.pi/agent/skills`.
  - Patched commands: wizard verification alternatives run under PowerShell;
    `gh release create --notes-file "$env:TEMP\..."` runs; `glab issue update
    <n> --assignee "@me"` (dry-run/help-level) does not hit the splatting
    error; `npm-stage` doc commands unchanged.
  - Patch manifest: every entry in `PATCHES.md` maps to a real file in the
    repo; diff against upstream shows exactly the documented patch lines.
- **Prior art**: the existing `@me` fix in
  `setup-matt-pocock-skills/issue-tracker-github.md` and the `Select-String`
  usage in `npm-release` are the in-repo precedent for the double-platform
  annotation style.

## Out of Scope

- Rewriting `wizard`/`hitl-loop` as `.ps1` dual implementations (environment
  layer absorbs this: Git Bash/WSL already installed).
- Altering upstream skill semantics — platform adaptation only.
- Scheduled/automated upstream sync (manual-trigger workflow only, for now).
- Migrating `context7-docs` (installed via npm package, no conflicts found).
- Touching the WSL pi configuration (bash is natively compatible).
- Publishing to an external issue tracker: spec lives in this repo; a
  `ready-for-agent` triage label is not applicable until a tracker is
  configured for this repository.

## Further Notes

- **Existing snapshot patches (4) to preserve as baseline**:
  `research/SKILL.md` (+2 lines, pi push mechanism), `wayfinder/SKILL.md` (+1
  line, pi research push), `setup-matt-pocock-skills/issue-tracker-github.md`
  (`"@me"` + PowerShell warning), `kill-ai-slop/SKILL.md`
  (`disable-model-invocation: true`).
- **Upstream provenance status**: `mattpocock/skills` and
  `yetone/kill-ai-slop` confirmed live; `security-audit` provenance
  unconfirmed — place under `skills/other/` pending trace.
- **Discovery-rule constraint**: `skill/` (kill-ai-slop's container) is not in
  the CLI's standard container list; it was found via the recursive fallback.
  In the aggregation repo the consolidated path `skills/<source>/<name>/`
  is within the standard walk.
- **Distribution caveat**: re-running `npx skills update` after migration
  re-downloads from the configured source; keep the source pointed at
  `hu3rror/my-skills` so updates flow through the patched copies.
- **Revision (ticket #7 close-out, 2026-09-22)**: the operative distribution
  command is `npx skills add hu3rror/my-skills -a pi universal -s '*' -g`
  (US15, Solution, and the Testing Decisions above use this form; the earlier
  `--all -g` plan was superseded by observed CLI behavior). Observed CLI
  behavior: `--all` installs to every agent detected on the machine (junction
  sets were created under `~/.claude`, `~/.codebuddy`, `~/.roo`, `~/.trae`,
  `~/.zcode`, `~/.ona`, `~/.hermes`, `~/.autohand`, `~/.grok`), while a single
  `-a <agent>` argument flips the CLI into copy mode, writing real skill
  directories instead of junctions. Adding `universal` between them keeps
  symlink/junction mode and adds no links of its own (`~/.config/agents/skills`
  is never created; universal installs canonical-only). The mistaken agent
  junctions were pruned with `npx skills remove -g -y --all -a <agent>...`,
  leaving empty `skills` dirs behind which were then removed.
- **Revision (vendor freshness check, 2026-09-22)**: US11 and the Out-of-Scope
  "Scheduled/automated upstream sync (manual-trigger workflow only, for now)"
  are superseded for the detection half. `vendor-freshness-check.yml` (cron UTC
  01:00 + workflow_dispatch) runs `vendor-sync.mjs --dry-run` daily and
  opens/closes a `pending-update` issue assigned to the maintainer; the real
  sync remains manual (`vendor-sync.yml`, no cron) so patched-file manual-merge
  discipline is preserved. Rationale: upstream sources (mattpocock,
  kill-ai-slop, cloudflare) commit between releases, so a notification-only
  check is worth a scheduled run; it never writes files.
  push of `my-skills` (#1), `git rm` + directory removal + `.gitignore` +
  AGENTS.md edits on `~/.pi` (#8, #4), push of `~/.pi` (#1). The re-distribution
  step is local install only and needs no R1 confirmation.
- **AGENTS.md integration draft** (section 2, first bullet):
  `- **执行环境**：本机 shell 是 Windows PowerShell（5.1/7），WSL 里的 pi 才用
  bash。执行 skill/文档中的 bash 或 Unix 命令前，先转译为 PowerShell 等效；
  bash 专属脚本（wizard、hitl-loop 模板等）经 bash.exe/wsl.exe 显式调用，不设
  默认工具。平台差异清单以 my-skills 仓库 PATCHES.md 为准。`

## Chinese Summary (non-authoritative)

- 决策：全部公共技能并入自建聚合仓库 hu3rror/my-skills，按来源分目录，以本机快照为基线；修复 4 处 PowerShell 冲突，补丁全部记入 PATCHES.md。
- 理由：vercel-labs/skills 无补丁层，直接改 ~/.agents/skills 会被 npx skills update 覆盖；聚合仓库 + 补丁清单是可持续的维护形态。
- 影响：分发链不变（npx skills add → canonical + pi junction）；npm-release/pi-extension-sync 迁出 ~/.pi 进 skills/self/；AGENTS.md 第 2 节融入 PowerShell 执行环境约束。
- 风险：同步脚本若未按 PATCHES.md 跳过补丁文件会覆盖本地适配（已设计 skip+提醒）；security-audit 来源未溯源（暂归 other/）。
- 待定：上游同步 workflow 先手动触发，不设定时（2026-09-22 修订：检测半块改为每日 cron 的 vendor freshness check，只 dry-run + pending-update issue，不写文件；真实 sync 仍手动）；B 类条件性问题只入备忘不改正文。