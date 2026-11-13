---
id: security-audit.disable-model-invocation
file: skills/cloudflare/security-audit/SKILL.md
upstream:
  source: cloudflare/security-audit-skill
  path: skills/security-audit/SKILL.md
verification: diff
summary: >-
  Frontmatter gains `disable-model-invocation: true`, 1 line inserted in a
  single hunk: the skill becomes user-invoked only, so no harness auto-triggers
  a security review from a keyword match.
---

## Why

The description matches broad request shapes (security questions, focused
reviews, vulnerability research), so model-side selection can fire the skill
without the user asking for it. Explicit invocation keeps the full-audit
workflow — file creation, phase orchestration, sub-agents — behind a deliberate
call.

## Diff

```diff
--- a/skills/security-audit/SKILL.md
+++ b/skills/security-audit/SKILL.md
@@ -1,6 +1,7 @@
 ---
 name: security-audit
 description: Security guidance and vulnerability review for codebases, APIs, services, CLI tools, libraries, and daemons. Use for security questions, focused reviews, vulnerability research, security audits, or pen tests. Run the complete workflow only for explicit codebase audit or pen-test requests, full/comprehensive/end-to-end reviews, or requested report artifacts.
+disable-model-invocation: true
 ---
 
 # Security Audit
```
