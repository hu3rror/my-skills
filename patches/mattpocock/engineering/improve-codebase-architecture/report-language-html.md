---
id: improve-codebase-architecture.report-language-html
file: skills/mattpocock/engineering/improve-codebase-architecture/HTML-REPORT.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/improve-codebase-architecture/HTML-REPORT.md
verification: diff
summary: >-
  2 replaced lines: the report scaffold lang="en" -> lang="{{report language}}", and the Tone paragraph rephrased from "Plain English" to plain prose in the conversation's language, glossary terms keeping their English form on first use with a parenthetical translation, no calque translation.
origin: "PATCHES.md A-class row #12"
---

## Why

The report language follows the user's conversation; the scaffold and the Tone guidance must say so, not hardcode English.

## Diff

```diff
--- a/skills/engineering/improve-codebase-architecture/HTML-REPORT.md
+++ b/skills/engineering/improve-codebase-architecture/HTML-REPORT.md
@@ -6,7 +6,7 @@ The architectural review is rendered as a single self-contained HTML file in the
 
 ```html
 <!doctype html>
-<html lang="en">
+<html lang="{{report language}}">
   <head>
     <meta charset="utf-8" />
     <title>Architecture review for {{repo name}}</title>
@@ -105,7 +105,7 @@ One larger card. Candidate name, one sentence on why, anchor link to its card. T
 
 ## Tone
 
-Plain English, concise, but the architectural nouns and verbs come straight from the `/codebase-design` skill. Concision is not an excuse to drift.
+Plain prose in the language of the conversation (English when the user writes English, Chinese when they write Chinese), concise, but the architectural nouns and verbs come straight from the `/codebase-design` skill. Glossary terms keep their English form on first use with a parenthetical translation into the report language; never calque-translate them. Concision is not an excuse to drift.
 
 **Use exactly:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.
 

```
