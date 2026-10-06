---
id: ask-matt.setup-repo-precondition
file: skills/mattpocock/engineering/ask-matt/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/ask-matt/SKILL.md
verification: diff
summary: >-
  Precondition paragraph replaced: routes setup to /setup-repo (drives /setup-matt-pocock-skills then /setup-coding-standards, standard answers pre-filled; primitives stay available for partial setup) — supports the self-authored composite skills/self/setup-repo.
origin: "PATCHES.md A-class row #9"
---

## Why

The self-authored setup-repo composite orchestrates both setup primitives; the precondition must point there so a fresh repo gets the whole setup, with the primitives still available for partial runs.

## Diff

```diff
--- a/skills/engineering/ask-matt/SKILL.md
+++ b/skills/engineering/ask-matt/SKILL.md
@@ -93,4 +93,4 @@

 ## Precondition

-**`/setup-matt-pocock-skills`**: run before your first engineering flow to configure the issue tracker, triage labels, and doc layout the other skills assume. Custom issue trackers also work.
+**`/setup-repo`**: run before your first engineering flow to configure the issue tracker, triage labels, doc layout, and coding standards the other skills assume — it drives `/setup-matt-pocock-skills` then `/setup-coding-standards`, with your standard answers pre-filled; the primitives stay available when you want only part of the setup. Custom issue trackers also work.

```
