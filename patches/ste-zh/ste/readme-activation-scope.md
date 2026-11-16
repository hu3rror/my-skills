---
id: ste-zh.readme-activation-scope
file: skills/ste-zh/ste/README.md
upstream:
  source: dualface/ste-zh
  path: README.md
verification: diff
summary: >-
  Keep the README's activation statements consistent with the scoped
  activation in SKILL.md: the skill covers report-type replies, chat stays
  default, and a rule written in the user's agent config counts as explicit
  activation.
---

## Why

The README states the old semantics twice ("任务结果汇报也不会自动使用",
"Agent 给用户的全部回复都按本规范组织"). With the skill-level scope change
those sentences describe behaviour the skill no longer has, and the README
ships with the skill folder, so downstream installs would read a
self-contradicting document. The 注意事项 bullet on 全局常驻 already matches
the new behaviour and stays untouched.

## Diff

```diff
--- a/README.md
+++ b/README.md
@@ -4,7 +4,7 @@
 
 一个面向 AI Agent 的任务汇报规范 skill。借鉴航空与工业界严谨的 **ASD-STE100**（Simplified Technical English，简化技术英语）原则，约束 Agent 用清晰、严密且无歧义的中文汇报工作结果。
 
-Agent 的日常汇报常常过程冗长、推测含糊，或者漏掉关键的验证证据。显式激活 `ste-zh` 后，Agent 将遵循受控中文规范进行汇报：**关键信息先行、实证说话、状态固定、一目了然**。未激活时，任何回复都不受影响。
+Agent 的日常汇报常常过程冗长、推测含糊，或者漏掉关键的验证证据。显式激活 `ste-zh` 后，Agent 的汇报类回复将遵循受控中文规范进行汇报：**关键信息先行、实证说话、状态固定、一目了然**。闲聊与一般问答不受影响。
 
 > 💡 本 skill 仅规范 Agent 向用户汇报与讨论时的表达方式，绝不影响项目代码、注释、Commit 信息及生成的文件内容。
 
@@ -111,13 +111,13 @@
 
 ## 使用方式
 
-本 skill 只在显式激活后生效，任务结果汇报也不会自动使用。在对话中输入以下任意指令，即可激活本 skill：
+本 skill 只在显式激活后生效。在 Agent 的用户规则里写明「汇报按 ste 写」，算显式激活；在对话中输入以下任意指令，也可激活本 skill：
 
 - `/ste`
 - 「用 STE 规范输出」
 - 「按 ASD-STE100 汇报」
 
-激活后，当前会话中 Agent 给用户的全部回复都按本规范组织。新会话必须重新激活。如需退出，发送「停止 ste」或「stop ste」即可。
+激活后，当前会话中 Agent 给用户的汇报类回复按本规范组织，范围见 `SKILL.md` 的「适用范围」。新会话必须重新激活。如需退出，发送「停止 ste」或「stop ste」即可。
 
 > 更高优先级指令和用户明确指定的输出格式优先。同级风格规则冲突且用户未明确指定风格时，按本 skill 写。
 
```
