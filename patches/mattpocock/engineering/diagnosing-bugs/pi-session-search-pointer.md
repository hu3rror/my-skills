---
id: diagnosing-bugs.pi-session-search-pointer
file: skills/mattpocock/engineering/diagnosing-bugs/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/diagnosing-bugs/SKILL.md
verification: diff
summary: >-
  2 lines added after the "When exploring the codebase..." paragraph (a blank line + the pointer line): past-session evidence search routes to the pi-session-search skill (UTF-8-safe, knows the JSONL structure, caps output) instead of ad-hoc grep/python; branches: bug happened in an earlier run, or behavior changed between runs.
origin: "PATCHES.md A-class row #27"
---

## Why

The pi-session-search skill is the dedicated, UTF-8-safe tool for past-session evidence; ad-hoc grep/python one-liners duplicated it worse.

## Diff

```diff
--- a/skills/engineering/diagnosing-bugs/SKILL.md
+++ b/skills/engineering/diagnosing-bugs/SKILL.md
@@ -9,6 +9,8 @@ A discipline for hard bugs. Skip phases only when explicitly justified.
 
 When exploring the codebase, read `GLOSSARY.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.
 
+When the bug's trail runs through past pi sessions (it happened in an earlier run, or a behavior changed between runs), search them with the `pi-session-search` skill instead of ad-hoc grep/python: it is UTF-8-safe, knows the JSONL structure, and caps output.
+
 ## Redact
 
 This skill has you show commands, outputs and captured artifacts. **Redact every secret first**: write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.
```
