---
id: handoff.at-mention-quoting
file: skills/mattpocock/productivity/handoff/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/productivity/handoff/SKILL.md
verification: diff
after: handoff.temp-dir-portable
summary: >-
  New paragraph: report the document path back to the user as a copy-paste-ready pi `@` mention — quoted `@"C:/..."` form, because pi's prompt editor's `@` fuzzy-completion popup clobbers unquoted paths on Enter; plus the bare forward-slash form for CLI launches. Stacked after temp-dir-portable (its rewritten first paragraph is this hunk's context).
---

## Why

An unquoted `@` path pasted into pi's prompt editor opens the file-completion popup and Enter applies the top suggestion instead of the typed path, silently losing the handoff path. The quoted form ends the token at the closing quote so the path survives verbatim; CLI launches take the bare form because the shell strips quoting before pi parses `@file` args.

## Diff

```diff
--- a/skills/productivity/handoff/SKILL.md
+++ b/skills/productivity/handoff/SKILL.md
@@ -8,3 +8,9 @@
 Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the OS temp directory, resolved explicitly (`$env:TEMP` on Windows; `$TMPDIR`, else `/tmp`, on Linux / WSL / macOS) - not the current workspace. A bare `/tmp/...` path reaching a Windows-native tool (node, python, pi's `write`) resolves to `C:\tmp\...` instead, so pass the resolved absolute path on Windows.
 
+Report the document's path back to the user as a copy-paste-ready pi `@` mention: one leading `@`, the absolute path with forward slashes, wrapped in double quotes, and nothing else on that line. Example: `@"C:/path/to/handoff-xyz.md"` on Windows (the `%TEMP%` directory, e.g. under `AppData/Local/Temp`); `@"/tmp/handoff-xyz.md"` elsewhere.
+
+The quotes are load-bearing, not decoration: in pi's prompt editor, `@` opens a fuzzy file-completion popup, and pressing Enter while it is open applies the popup's top suggestion instead of sending. An unquoted or backslash-slashed Windows path after `@` becomes one long completion token that the popup clobbers on Enter. The quoted form (`@"..."`) ends the token at the closing quote, so no popup ever opens and the pasted path survives verbatim. Keep the closing quote last on its line - a `.` or `/` after it starts a new completion prefix.
+
+Also give the bare forward-slash path (e.g. `C:/path/to/handoff-xyz.md`) for CLI launches: start pi with `pi @C:/path/to/handoff-xyz.md`. The shell strips its own quoting before pi parses `@file` args, so quote marks there break resolution.
+
 Open the document with a handover preamble addressed to the next agent, worded to force an alignment stop before any work:
```