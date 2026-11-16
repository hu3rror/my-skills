---
id: ste-zh.agents-md-compat
file: skills/ste-zh/ste/SKILL.md
upstream:
  source: dualface/ste-zh
  path: SKILL.md
verification: diff
summary: >-
  New "与本仓库 AGENTS.md 的关系" section carrying the adoption's conflict
  rulings in-skill: an AGENTS.md rule that loads this skill for report replies
  counts as explicit activation (the skill then takes precedence), the
  [NEED-VERIFY] and [NEEDS MANUAL VERIFICATION] markers count as 未验证 (no
  rewrite of existing
  skills), and PR bodies / GitHub Release notes are file artifacts outside the
  skill's scope (decisions Q4/Q5 of the adoption).
---

## Why

The adoption needs one place stating precedence and the two compatibility
mappings. An AGENTS.md rule that loads this skill for report replies is the
activation mechanism; once active the skill body overrides project summaries,
so the core report rules live only here and need no mirror in AGENTS.md.
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
+- 项目 AGENTS.md 里的「任务类回复先加载本 skill」规则即显式激活；激活后以本文件为准，未激活时按 AGENTS.md 的规则写。
+- 兼容标记：`[NEED-VERIFY]` 与 `[NEEDS MANUAL VERIFICATION]` 视为「未验证」，不另作标记。
+- PR body 与 GitHub Release 正文属于写入项目的文件产物，不受本 skill 约束。
+
 ## 适用范围
 
 适用于 Agent 写给用户的全部文字：

```
