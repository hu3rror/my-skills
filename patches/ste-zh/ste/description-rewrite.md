---
id: ste-zh.description-rewrite
file: skills/ste-zh/ste/SKILL.md
upstream:
  source: dualface/ste-zh
  path: SKILL.md
verification: diff
after: ste-zh.disable-model-invocation
summary: >-
  Compress the description from 459 to 267 chars, following the repo's
  write-release-notes style: single-language English, Use-when phrasing,
  trigger words preserved (/ste, 用 STE 规范输出, 按 ASD-STE100 汇报),
  no lifecycle prose. The skill is explicit-invocation-only, so the
  description no longer needs to carry the once-active-until-stopped
  explanation or the duplicated Chinese restatement.
---

## Why

Adoption follow-up (aligncheck): 459 chars is twice the repo's typical
description length (write-release-notes is ~200) and duplicates the same
message in English and Chinese. With `disable-model-invocation: true` the
description is no longer a routing text for automatic selection, so the
"Once active, applies to every reply…" lifecycle and the Chinese
restatement drop out; the trigger words stay so explicit requests still
resolve to this skill.

## Diff

```diff
--- a/SKILL.md
+++ b/SKILL.md
@@ -1,14 +1,11 @@
 ---
 disable-model-invocation: true
 name: ste
-description: >
-  Make the agent report results to the user by the ASD-STE100 (Simplified
-  Technical English) principles, in Chinese: key information first, one word one
-  meaning, one fact per sentence, fixed status words, honest verification
-  state, short sentences. Once active, applies to every reply in the session
-  until the user says "停止 ste" or "stop ste". 让 Agent 按 ASD-STE100
-  原则用中文向用户汇报结果. Trigger: "/ste", "用 STE 规范输出",
-  "按 ASD-STE100 汇报", "简化技术中文", "report in STE style".
+description: >-
+  Report results to the user in Simplified Technical Chinese per ASD-STE100
+  conventions: key information first, fixed status words, honest verification
+  state, short sentences. Use when the user asks for STE-style reporting, or
+  invokes /ste, 用 STE 规范输出, 按 ASD-STE100 汇报.
 ---
 
 # ste-zh：简化技术中文

```
