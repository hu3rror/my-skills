---
id: ste-zh.activation-scope
file: skills/ste-zh/ste/SKILL.md
upstream:
  source: dualface/ste-zh
  path: SKILL.md
verification: diff
after: ste-zh.description-rewrite
summary: >-
  Scope activation to the five report types in 适用范围 instead of every
  reply in the session: chat, general Q&A and plain explanation stay default
  style. A rule the user writes in their own agent config counts as explicit
  activation, so task reports can auto-load the skill without a trigger word;
  the first-reply ASD-STE100 notice therefore only follows trigger-word
  activation.
---

## Why

Upstream makes activation session-wide ("激活后…每一条回复…") and defaults the
description to "never activate automatically, including for task result
reports". This install wants the opposite split: chat keeps the default voice,
report-type replies (task results, progress, diagnosis, decision requests,
multi-item summaries) always read the same. A session-wide switch cannot
express that, and a per-session activation costs a trigger word per session.
Scoping activation to the report types and letting the user's own rules
activate the skill gives both: no notice noise in chat, no manual `/ste` for
reports.

Dropping "任务结果汇报也不例外" follows from the same rule: with rule
activation in place, a task report is explicitly activated, not automatic
self-activation.

## Diff

```diff
--- a/SKILL.md
+++ b/SKILL.md
@@ -17,12 +17,12 @@
 
 ## 生效与持续
 
-- 本 skill 只在用户显式激活后生效。Agent 不得自行激活，任务结果汇报也不例外。
+- 本 skill 只在用户显式激活后生效。Agent 不得自行激活。
 - 显式激活指用户明确要求。明确要求包括 `/ste`、其他触发语和用户规则中写明的要求。
-- 激活后，本会话中 Agent 给用户的每一条回复都必须遵守本 skill。新会话必须重新激活。
+- 激活后，本 skill 约束「适用范围」列出的五类回复。其他回复（闲聊、一般问答、普通解释）不受影响。新会话必须重新激活。
 - 激活时，必须读 [references/terminology.md](references/terminology.md) 的第 2–5 节。
 - 用户说「停止 ste」或「stop ste」后，恢复默认写法。用户重新激活后，本 skill 才再次生效。
-- 激活后的第一条回复，用一句话说明：后续输出按 ASD-STE100 原则写。说明可以与首句合并。只回复激活说明时，视为 R18 的一次性例外。用户明确指定格式时，遵守格式；格式不容纳说明时，省略说明。例如，不得在 JSON 外添加说明。不得列出全部规则，除非用户要求。
+- 用触发语激活时，第一条回复用一句话说明：后续输出按 ASD-STE100 原则写。用用户规则激活时，不写说明。说明可以与首句合并。只回复激活说明时，视为 R18 的一次性例外。用户明确指定格式时，遵守格式；格式不容纳说明时，省略说明。例如，不得在 JSON 外添加说明。不得列出全部规则，除非用户要求。
 - 更高优先级指令和用户明确指定的输出格式优先。同级风格规则冲突且用户未明确指定风格时，按本 skill 写。
 - 项目或用户规定了输出语言时，按规定的语言写。其余写法仍按本 skill。
 
@@ -34,7 +34,7 @@
 
 ## 适用范围
 
-适用于 Agent 写给用户的全部文字：
+适用于 Agent 写给用户的以下五类文字：
 
 - 任务结果汇报
 - 进度说明
@@ -44,6 +44,7 @@
 
 不适用于以下内容。这些内容按项目自己的规范写：
 
+- 闲聊、一般问答与普通解释
 - 代码、代码注释、commit message
 - Agent 写入项目的文件
 - 原样引用的日志、错误信息、命令输出。引用时必须一字不改。
```
