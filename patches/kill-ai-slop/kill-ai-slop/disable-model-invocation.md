---
id: kill-ai-slop.disable-model-invocation
file: skills/kill-ai-slop/kill-ai-slop/SKILL.md
upstream:
  source: yetone/kill-ai-slop
  path: skill/SKILL.md
verification: diff
summary: >-
  Frontmatter gains disable-model-invocation: true (keep the slop-removal skill explicit-invocation-only) and the description is rewritten to stay under the skill loader's 1024-char limit — the tells catalogue is compressed to representative examples with a references/taxonomy.md pointer, plus a de-slop disambiguation sentence (plain-text editing outside a codebase -> de-slop).
origin: "PATCHES.md A-class row #4 (baseline)"
---

## Why

The upstream description was over the loader's 1024-char limit and the skill should only run on explicit request; the rewrite compresses the catalogue and disambiguates from de-slop.

## Diff

```diff
--- a/skill/SKILL.md
+++ b/skill/SKILL.md
@@ -1,22 +1,17 @@
 ---
+disable-model-invocation: true
 name: kill-ai-slop
 description: >-
   Find and remove AI slop — the generic, machine-default visual and copy tics of
   vibe-coded products — from a web project. Use when the user asks to "kill AI
   slop", "de-slop", "remove the AI look", "make this not look AI-generated", or
-  clean up a landing page / UI / docs that feels templated. Detects and fixes
-  the catalogue of tells: indigo→violet gradients, gradient-clip headlines, the
-  default semantic palette, one-hue status boxes, atmospheric gradients,
-  serif-italic emphasis, highlighted keywords, AI copywriting voice ("not just
-  X — it's Y"), emoji everywhere, glowing status dots, wobbling spinners,
-  colored-left-border
-  callouts, pastel icon tiles, glassmorphism, over-rounding, oversized shadows,
-  borders that die at corners, badge & pill spam, AI-drawn SVG icons, kickers
-  over every heading, flat type
-  hierarchies, invented stat rows, 01/02/03 section
-  markers, cards nested in cards, the default Inter/Space Grotesk look, and
-  more. Works on HTML/CSS, React/Vue/Svelte/Astro, Tailwind, PHP, and Markdown
-  copy.
+  clean up a landing page / UI / docs that feels templated. Fixes the catalogue
+  of tells — gradient/glow defaults, glassmorphism, badge & pill spam, pastel
+  tiles, AI-drawn icons, AI copywriting voice ("not just X — it's Y"), emoji
+  everywhere, and more — see `references/taxonomy.md` for the full list. Works
+  on HTML/CSS, React/Vue/Svelte/Astro, Tailwind, PHP, and Markdown copy. For
+  plain-text editing of Chinese or English writing outside a codebase, use
+  `de-slop` instead.
 ---
 
 # Kill AI Slop

```
