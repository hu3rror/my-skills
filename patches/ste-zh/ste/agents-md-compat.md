---
id: ste-zh.agents-md-compat
file: skills/ste-zh/ste/SKILL.md
upstream:
  source: dualface/ste-zh
  path: SKILL.md
verification: diff
after: ste-zh.disable-model-invocation
summary: >-
  New "与本仓库 AGENTS.md 的关系" section carrying the adoption's conflict
  rulings in-skill: AGENTS.md already holds the core report rules (this skill
  supplements templates/glossary/self-check), the [NEED-VERIFY] and
  [NEEDS MANUAL VERIFICATION] markers count as 未验证 (no rewrite of existing
  skills), and PR bodies / GitHub Release notes are file artifacts outside the
  skill's scope (decisions Q4/Q5 of the adoption).
---

## Why

The adoption blend (AGENTS.md core rules permanent + full skill on explicit
request) needs a place that states the precedence and the two compatibility
mappings, scoped inside the skill so a future session seeing this file knows
the rulings without re-deriving them.

## Diff

```diff
--- a/SKILL.md
+++ b/SKILL.md
@@ -28,6 +28,12 @@
 - 更高优先级指令和用户明确指定的输出格式优先。同级风格规则冲突且用户未明确指定风格时，按本 skill 写。
 - 项目或用户规定了输出语言时，按规定的语言写。其余写法仍按本 skill。
 
+## 与本仓库 AGENTS.md 的关系
+
+- 本仓库 AGENTS.md 已含本 skill 的核心汇报规则（状态词表、未验证/未确认区分、按回复类型定首句、证据定位、选项化决策）。未激活本 skill 时，按 AGENTS.md 的规则写；激活后，本文件为准。
+- 兼容标记：`[NEED-VERIFY]` 与 `[NEEDS MANUAL VERIFICATION]` 视为「未验证」，不另作标记。
+- PR body 与 GitHub Release 正文属于写入项目的文件产物，不受本 skill 约束。
+
 ## 适用范围
 
 适用于 Agent 写给用户的全部文字：

```
