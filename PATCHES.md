# PATCHES.md — Patch manifest

Local adaptations applied to upstream skill files in this repo. The repo ships
the **patched** artifacts (fork semantics); this file is the source of truth for
every deviation from upstream. Sync automation must **skip every file listed
below** and report it as "upstream updated a patched file — merge manually".

## Upstream references

| Source | URL | Pinned commit (diff baseline) |
|---|---|---|
| mattpocock/skills | https://github.com/mattpocock/skills | `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` |
| yetone/kill-ai-slop | https://github.com/yetone/kill-ai-slop | `f6e2ae32b30443ec7bd0da4da971ee18d8f8ffcb` |

`skills/self/` skills are self-authored (no upstream); their counterpart is the
pre-consolidation home (`~/.pi/agent/skills/...` or the initial snapshot).

## A-class patches (applied, must-fix)

| # | Origin | File (repo-relative) | Patch summary | Upstream counterpart | Verification method |
|---|---|---|---|---|---|
| 1 | baseline | `skills/mattpocock/engineering/research/SKILL.md` | +2 lines appended: pi's background research agent **pushes** its completion (findings path) back to the caller — read the file when the push lands, don't poll | mattpocock/skills `skills/engineering/research/SKILL.md` | `git diff` vs pinned upstream shows exactly the 2 added lines |
| 2 | baseline | `skills/mattpocock/engineering/wayfinder/SKILL.md` | +1 line: "Fire the research subagents" step extended — completion arrives as a push; resume from the branch's checkpointed findings if the session ends first | mattpocock/skills `skills/engineering/wayfinder/SKILL.md` | `git diff` vs pinned upstream shows exactly the 1 extended line |
| 3 | baseline | `skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-github.md` | Claim line: `--add-assignee @me` → `--add-assignee "@me"` + Windows PowerShell splatting warning | mattpocock/skills `skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md` | `git diff` vs pinned upstream shows exactly the 1 replaced line |
| 4 | baseline | `skills/kill-ai-slop/kill-ai-slop/SKILL.md` | +1 line in frontmatter: `disable-model-invocation: true` (keep the slop-removal skill explicit-invocation-only) | yetone/kill-ai-slop `skill/SKILL.md` | `git diff` vs pinned upstream shows exactly the 1 added line |
| 5 | new | `skills/mattpocock/engineering/wizard/SKILL.md` | "Verify and hand off" gains a Windows branch: no blind `bash -n` / `chmod +x` — wslpath-converted WSL/Git Bash syntax check, `chmod +x` noted as a no-op on NTFS with `bash <script>` run instructions; body gains "On Windows, run the wizard with Git Bash or WSL" note | mattpocock/skills `skills/engineering/wizard/SKILL.md` | `git diff` vs pinned upstream shows exactly the added lines; `wsl bash -n "$(wsl wslpath -a 'C:/...')"` exits 0 on `template.sh` from PowerShell |
| 6 | new | `skills/mattpocock/engineering/diagnosing-bugs/SKILL.md` | HITL bash script item (feedback-loop #10) gains the same Windows runtime note: run `scripts/hitl-loop.template.sh` with Git Bash/WSL, PowerShell can't run it directly | mattpocock/skills `skills/engineering/diagnosing-bugs/SKILL.md` | `git diff` vs pinned upstream shows exactly the added sentence |
| 7 | new | `skills/self/npm-release/SKILL.md` | Release-notes temp path `/tmp/release-notes-vX.Y.Z.md` → `$env:TEMP\release-notes-vX.Y.Z.md` (step 7, incl. both `--notes-file` args) | self-authored; pre-consolidation copy at `~/.pi/agent/skills/npm-release/SKILL.md` | `gh release create --help` confirms `--notes-file`; `"$env:TEMP\release-notes-vX.Y.Z.md"` resolves via `Test-Path` under PowerShell [NEEDS MANUAL VERIFICATION: end-to-end `gh release create` run in ticket #7] |
| 8 | new | `skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md` | Claim line: `--assignee @me` → `--assignee "@me"` + PowerShell splatting warning (mirrors GitHub template); heredoc instruction replaced with a PowerShell here-string multi-line approach | mattpocock/skills `skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md` | `git diff` vs pinned upstream shows exactly the changed lines; `glab issue update 1 --assignee @me` → "Flag needs an argument", `--assignee "@me"` → passes parsing |

## B-class advisory notes (conditional environment issues — not patched into bodies)

| # | Skill / file | Note | Upstream counterpart |
|---|---|---|---|
| 1 | `skills/self/npm-release/SKILL.md` (step 6) | `gh --json` + **jq** pipelines: jq is not installed by default on Windows — install it, or substitute `ConvertFrom-Json` / `Select-String` | self-authored |
| 2 | `skills/mattpocock/engineering/diagnosing-bugs/SKILL.md` (feedback-loop #2) | **curl** semantics: on PowerShell 5.1 `curl` is an alias for `Invoke-WebRequest`; on PowerShell 7+ use `curl.exe` for real curl. The "Curl / HTTP script" wording stays as-is | mattpocock/skills |
| 3 | `skills/kill-ai-slop/kill-ai-slop/references/detection.md` | **rg** (ripgrep) command examples: ripgrep is not installed by default on Windows — install it, or translate the patterns to `Select-String` | yetone/kill-ai-slop |
| 4 | `skills/self/web-debug/SKILL.md` ("When *not* to reach for these tools") | "run it with `bash`" phrasing: bash is not a direct PowerShell command on Windows — invoke it explicitly via Git Bash/WSL (`bash.exe` / `wsl bash`) | self-authored |
