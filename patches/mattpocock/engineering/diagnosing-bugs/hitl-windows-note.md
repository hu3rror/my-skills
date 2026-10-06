---
id: diagnosing-bugs.hitl-windows-note
file: skills/mattpocock/engineering/diagnosing-bugs/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/diagnosing-bugs/SKILL.md
verification: diff
summary: >-
  HITL bash script item (feedback-loop #10) gains the same Windows runtime note as wizard: run scripts/hitl-loop.template.sh with Git Bash/WSL, PowerShell can't run it directly.
origin: "PATCHES.md A-class row #6"
---

## Why

The HITL fallback loop is a bash script; on Windows it must be invoked via Git Bash or WSL, or the last-resort loop is un-runnable.

## Diff

```diff
--- a/skills/engineering/diagnosing-bugs/SKILL.md
+++ b/skills/engineering/diagnosing-bugs/SKILL.md
@@ -32,7 +34,7 @@ Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give
 7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
 8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
 9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
-10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.
+10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you. On Windows, run it with Git Bash or WSL — it's a bash script and PowerShell can't run it directly (`bash scripts/hitl-loop.template.sh` from Git Bash, or `wsl bash "$(wsl wslpath -a 'C:/path/to/hitl-loop.template.sh')"` from PowerShell).
 
 Build the right feedback loop, and the bug is 90% fixed.
 

```
