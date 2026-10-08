---
id: retro.pi-session-search-pointer
file: skills/mattpocock/engineering/retro/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/retro/SKILL.md
verification: diff
summary: >-
  Step 2 gains a session-log search pointer: "searching through session logs on this machine" extended -> "— use the pi-session-search skill (UTF-8-safe query over ~/.pi/agent/sessions JSONL; supersedes ad-hoc grep/python one-liners)"; 1 line extended.
origin: "PATCHES.md A-class row #26"
---

## Why

Past-session evidence is a first-class source for retros; the dedicated pi-session-search skill supersedes ad-hoc grep/python.

## Diff

```diff
--- a/skills/engineering/retro/SKILL.md
+++ b/skills/engineering/retro/SKILL.md
@@ -12,4 +12,4 @@

-2. Read the primary sources for the session the user specifies. This may mean searching through session logs on this machine. If the user doesn't specify a session, default to the current one.
+2. Read the primary sources for the session the user specifies. This may mean searching through session logs on this machine — use the `pi-session-search` skill (UTF-8-safe query over `~/.pi/agent/sessions` JSONL; supersedes ad-hoc grep/python one-liners). If the user doesn't specify a session, default to the current one.

 3. Look for candidates for improvement in these categories.

```
