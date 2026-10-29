---
id: ste-zh.disable-model-invocation
file: skills/ste-zh/ste/SKILL.md
upstream:
  source: dualface/ste-zh
  path: SKILL.md
verification: diff
summary: >-
  Frontmatter gains disable-model-invocation: true, so the report-standard
  skill only runs on explicit request (/ste, "用 STE 规范输出", …) and never
  gets auto-selected into sessions that carry their own fixed output formats
  (grilling rounds, why reports, code-review, de-slop templates). Same shape
  as the kill-ai-slop baseline patch.
---

## Why

The repo's convention (skill "风格类一律显式触发") and the decision Q3 of the
ste-zh adoption: 显式触发, never automatic. Upstream frontmatter had only
`name` + `description`, so pi's loader could auto-select it from its
trigger-phrase description and hijack every reply in the session.

## Diff

```diff
--- a/SKILL.md
+++ b/SKILL.md
@@ -1,4 +1,5 @@
 ---
+disable-model-invocation: true
 name: ste
 description: >
   Make the agent report results to the user by the ASD-STE100 (Simplified

```
