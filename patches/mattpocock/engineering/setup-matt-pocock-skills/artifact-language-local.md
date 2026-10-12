---
id: setup-matt-pocock-skills.artifact-language-local
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-local.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md
verification: diff
summary: >-
  Resolve step: the answer is written in the repo's artifact language (AGENTS.md), not the conversation's — prevents language drift; the map pointer links to a real target (relative path or URL), since a `#n` fragment anchor is dead in rendered markdown.
---

## Why

Conversation and artifacts have different languages; a resolution that follows the session's language drifts silently. An `#n` fragment anchor has no target element in rendered markdown, so the link does nothing.

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md
@@ -29,2 +29,2 @@
 - **Claim**: set `Status: claimed` and save before any work.
-- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
+- **Resolve**: write the answer — in the repo's **artifact language** (see AGENTS.md), not the conversation's — under an `## Answer` heading; set `Status: resolved`; then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md` — the link is a **real target** (relative path or URL): a `#n` fragment anchor is dead in rendered markdown.
```
