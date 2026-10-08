---
id: handoff.temp-dir-portable
file: skills/mattpocock/productivity/handoff/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/handoff/SKILL.md
verification: diff
after: handoff.preamble-and-load-skills
summary: >-
  The handoff doc's save location rewritten: `$TMPDIR`, else `/tmp`, `%TEMP%` on
  Windows -> the OS temp directory with an explicit per-OS resolution
  (`$env:TEMP` on Windows; `$TMPDIR`, else `/tmp`, on Linux / WSL / macOS), plus
  the Windows-native-tool trap stated inline.
---

## Why

`$TMPDIR` is unset under Windows PowerShell and `/tmp` resolves to `C:\tmp\`
there, so a handoff written on Windows could land at the drive root instead of
the temp dir. Naming the per-OS variable keeps the doc in the temp dir on every
platform.

## Diff

```diff
--- a/skills/productivity/handoff/SKILL.md
+++ b/skills/productivity/handoff/SKILL.md
@@ -5,7 +5,7 @@ argument-hint: "What will the next session be used for?"
 disable-model-invocation: true
 ---
 
-Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows) - not the current workspace.
+Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the OS temp directory, resolved explicitly (`$env:TEMP` on Windows; `$TMPDIR`, else `/tmp`, on Linux / WSL / macOS) - not the current workspace. A bare `/tmp/...` path reaching a Windows-native tool (node, python, pi's `write`) resolves to `C:\tmp\...` instead, so pass the resolved absolute path on Windows.
 
 Open the document with a handover preamble addressed to the next agent, worded to force an alignment stop before any work:
 
```
