---
id: ste-zh.description-rewrite
file: skills/ste-zh/ste/SKILL.md
upstream:
  source: dualface/ste-zh
  path: SKILL.md
verification: diff
summary: >-
  Compress the description from 623 to 267 chars, following the repo's
  write-release-notes style: single-language English, Use-when phrasing,
  trigger words preserved (/ste, 用 STE 规范输出, 按 ASD-STE100 汇报),
  no lifecycle prose. The explicit-activation rule lives in the body's
  merged 生效与持续 section, not the loader, so the description drops the
  once-active-until-stopped explanation and the duplicated Chinese
  restatement.
---

## Why

The repo's typical description length is ~200 chars (write-release-notes);
the upstream's 623-char bilingual description is three times that and
duplicates the same message in English and Chinese. The compressed version
keeps the trigger words so explicit requests (/ste, 用 STE 规范输出, …)
still resolve to this skill; the lifecycle prose drops because upstream's
生效与持续 section (merged cleanly into the local copy) states the
explicit-activation rule at runtime; the Chinese restatement drops as a
duplicate.

## Diff

```diff
--- a/SKILL.md
+++ b/SKILL.md
@@ -1,15 +1,10 @@
 ---
 name: ste
-description: >
-  Make the agent report results to the user by the ASD-STE100 (Simplified
-  Technical English) principles, in Chinese: key information first, one word one
-  meaning, one fact per sentence, fixed status words, honest verification
-  state, short sentences. Use only when the user explicitly activates it; never
-  activate it automatically, including for task result reports. Once activated,
-  applies to every reply in the session until the user says "停止 ste" or
-  "stop ste". 让 Agent 按 ASD-STE100 原则用中文向用户汇报结果: 只在用户明确激活时使用,
-  不得自动使用, 任务结果汇报也不例外. Explicit activation: "/ste", "用 STE 规范输出",
-  "按 ASD-STE100 汇报", "简化技术中文", "report in STE style".
+description: >-
+  Report results to the user in Simplified Technical Chinese per ASD-STE100
+  conventions: key information first, fixed status words, honest verification
+  state, short sentences. Use when the user asks for STE-style reporting, or
+  invokes /ste, 用 STE 规范输出, 按 ASD-STE100 汇报.
 ---
 
 # ste-zh：简化技术中文
```