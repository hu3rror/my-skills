---
id: to-spec.publish-language
file: skills/mattpocock/engineering/to-spec/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/to-spec/SKILL.md
verification: diff
summary: >-
  Step 4 added: the spec body is written in English, and for a personal repo
  (remote owner matches `gh api user --jq .login`; treated as external when
  unconfirmed) one separate comment with a `## Chinese Summary
  (non-authoritative)` section is posted on the spec issue — the primary
  content only, never on sub-issues or follow-ups.
---

## Why

The spec issue is primary content published to an external tracker; the
language and personal-repo summary rules belong to this skill so they fire
exactly when it runs, and the "primary content only" boundary keeps sub-issues
and follow-ups free of annotation noise.

## Diff

```diff
--- a/skills/engineering/to-spec/SKILL.md
+++ b/skills/engineering/to-spec/SKILL.md
@@ -73,3 +73,7 @@
 Any further notes about the feature.
 
 </spec-template>
+
+### 4. Publish language
+
+Write the spec body in English. For a personal repo (remote owner matches `gh api user --jq .login`; treat as external when it can't be confirmed), post one separate comment on the spec issue — the primary content — with a `## Chinese Summary (non-authoritative)` section summarizing the key points. A summary belongs to the spec issue alone; never add it to sub-issues or follow-ups.
```