---
id: triage.load-skills-invocation
file: skills/mattpocock/engineering/triage/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/triage/SKILL.md
verification: diff
summary: >-
  Invocation line rewritten: "Call the Skill tool twice" -> "Load two skills in order, grilling then domain-modeling (read each SKILL.md and follow it)" — same pi Skill-tool rationale; 1 line replaced.
---

## Why

pi has no Skill tool; the invocation must say how this runtime actually loads skills, in order.

## Diff

```diff
--- a/skills/engineering/triage/SKILL.md
+++ b/skills/engineering/triage/SKILL.md
@@ -74,5 +74,5 @@
 3. **Verify the claim.** Before any grilling, check that the claim holds up. For a bug, reproduce it from the reporter's steps. For a PR, confirm the diff does what it claims: check it out, run the relevant tests or commands. Report what happened: confirmed (with code path), failed, or insufficient detail (a strong `needs-info` signal). A confirmed verification makes a much stronger agent brief.
 
-4. **Grill (if needed).** If the request needs fleshing out, call the Skill tool twice, for "grilling" and "domain-modeling", and grill it into shape a round of questions at a time, sharpening domain terms and updating `GLOSSARY.md`/ADRs inline as decisions land.
+4. **Grill (if needed).** If the request needs fleshing out, load two skills in order, "grilling" then "domain-modeling" (read each SKILL.md and follow it), and grill it into shape a round of questions at a time, sharpening domain terms and updating `GLOSSARY.md`/ADRs inline as decisions land.
 
 5. **Apply the outcome:**
```
