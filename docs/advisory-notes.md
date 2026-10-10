# Advisory notes — B-class platform issues (not patched into bodies)

Conditional, non-fatal environment issues on Windows: the affected skill file
stays as upstream ships it (or as self-authored), and the caveat is recorded
here instead of patched into the body — that is the B-class rule (ADR-0003).
These notes were rehomed from `PATCHES.md`'s "B-class advisory notes" section
(map ticket #23).

| # | Skill / file | Note | Upstream counterpart |
|---|---|---|---|
| 1 | `skills/self/npm-release/SKILL.md` (step 6) | `gh --json` + **jq** pipelines: jq is not installed by default on Windows — install it, or substitute `ConvertFrom-Json` / `Select-String` | self-authored |
| 2 | `skills/mattpocock/engineering/diagnosing-bugs/SKILL.md` (feedback-loop #2) | **curl** semantics: on PowerShell 5.1 `curl` is an alias for `Invoke-WebRequest`; on PowerShell 7+ use `curl.exe` for real curl. The "Curl / HTTP script" wording stays as-is | mattpocock/skills |
| 3 | `skills/kill-ai-slop/kill-ai-slop/references/detection.md` | **rg** (ripgrep) command examples: ripgrep is not installed by default on Windows — install it, or translate the patterns to `Select-String` | yetone/kill-ai-slop |
| 4 | `archive/web-debug/SKILL.md` (archived from `skills/self/web-debug`; keep the note if the skill returns) ("When *not* to reach for these tools") | "run it with `bash`" phrasing: bash is not a direct PowerShell command on Windows — invoke it explicitly via Git Bash/WSL (`bash.exe` / `wsl bash`) | self-authored (archived) |
| 5 | `docs/agents/issue-tracker.md` ("GitHub write hiccups") | gh write operations intermittently fail with `unexpected EOF` on the GraphQL POST (no proxy configured — transient network jitter, self-heals in minutes). Doc gives the recovery order: dedupe-check comments first (comment POST is not idempotent), backoff retry ×3, degrade to REST via `gh api --method POST --input -`, then hand the user the manual command — never blind-retry, which duplicates comments | self-authored |
| 6 | `docs/agents/issue-tracker.md` (PowerShell here-strings) | `@"` must be followed by a newline: inline content is a ParserError (verified — `$t = @"C:\...` fails). For multi-line strings containing Windows paths use a single-quoted string, `--%`, or write the file from Node | self-authored |
