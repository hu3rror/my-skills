---
id: improve-codebase-architecture.report-language-step2
file: skills/mattpocock/engineering/improve-codebase-architecture/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/improve-codebase-architecture/SKILL.md
verification: diff
summary: >-
  2 lines added in step 2: report language follows the user's conversation — glossary terms keep their English form on first use with a parenthetical translation (e.g. locality（局部性）); sub-agent exploration notes follow the same language.
origin: "PATCHES.md A-class row #13"
---

## Why

The HTML report should be written in the language the user is working in, with architecture glossary terms translated on first use rather than calque-translated.

## Diff

```diff
--- a/skills/engineering/improve-codebase-architecture/SKILL.md
+++ b/skills/engineering/improve-codebase-architecture/SKILL.md
@@ -36,6 +36,8 @@ Apply the **deletion test** to anything you suspect is shallow: would deleting i
 
 ### 2. Present candidates as an HTML report
 
+**Report language follows the user's conversation.** Write the report in the language the user is working in (English when they write English, Chinese when they write Chinese, etc.). Architecture glossary terms keep their English form on first use, followed by a parenthetical translation into the report language (e.g. *locality*（局部性）); afterwards use whichever reads more naturally. Sub-agent exploration notes follow the same language.
+
 Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user (`xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows) and tell them the absolute path.
 
 The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals: use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.
```
