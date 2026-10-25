---
id: to-spec.publish-language
file: skills/mattpocock/engineering/to-spec/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/to-spec/SKILL.md
verification: diff
summary: >-
  Step 4 added: the spec body is written in English.
---

## Why

The spec issue is primary content published to an external tracker; the
language rule belongs to this skill so it fires exactly when it runs.

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
+Write the spec body in English.
```