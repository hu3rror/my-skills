---
id: improve-codebase-architecture.temp-dir-portable
file: skills/mattpocock/engineering/improve-codebase-architecture/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/improve-codebase-architecture/SKILL.md
verification: diff
after: improve-codebase-architecture.report-language-step2
summary: >-
  Step 2's temp-dir resolution rewritten: `$TMPDIR`, falling back to `/tmp` (or
  `%TEMP%` on Windows) -> an explicit per-OS resolution (`$env:TEMP` on
  Windows; `$TMPDIR`, else `/tmp`, on Linux / WSL / macOS), so the HTML report
  never lands in `C:\tmp\...`. Promoted from advisory note #7 to a body patch
  (ADR-0003 must-fix: it decides the report's own output path).
---

## Why

A bare `/tmp/...` path reaching a Windows-native tool resolves to `C:\tmp\...`,
so the report landed at the drive root; and `$TMPDIR` is unset on Windows, so
the old wording left the agent guessing between `/tmp` and `%TEMP%`. Naming the
per-OS variable removes the Windows trap and the Linux / WSL ambiguity at once.

## Diff

```diff
--- a/skills/engineering/improve-codebase-architecture/SKILL.md
+++ b/skills/engineering/improve-codebase-architecture/SKILL.md
@@ -38,7 +38,7 @@ Apply the **deletion test** to anything you suspect is shallow: would deleting i
 
 **Report language follows the user's conversation.** Write the report in the language the user is working in (English when they write English, Chinese when they write Chinese, etc.). Architecture glossary terms keep their English form on first use, followed by a parenthetical translation into the report language (e.g. *locality*（局部性）); afterwards use whichever reads more naturally. Sub-agent exploration notes follow the same language.
 
-Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows) and tell them the absolute path.
+Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir explicitly (`$env:TEMP` on Windows; `$TMPDIR`, else `/tmp`, on Linux / WSL / macOS), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows) and tell them the absolute path.
 
 The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals: use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.
 
```
