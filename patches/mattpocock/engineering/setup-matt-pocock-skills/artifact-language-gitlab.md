---
id: setup-matt-pocock-skills.artifact-language-gitlab
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
verification: diff
after: setup-matt-pocock-skills.windows-quoting
summary: >-
  Resolve step: resolution notes are written in the repo's artifact language (AGENTS.md), not the conversation's — prevents language drift; the map pointer link is the full URL, since a `#n` fragment anchor is dead in an issue note. Stacked after windows-quoting (its second hunk's trailing context is this hunk's target line).
---

## Why

Conversation and artifacts have different languages; a resolution that follows the session's language drifts silently. An `#n` fragment anchor renders as a same-page link with no target, so clicking it does nothing.

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
@@ -57,2 +57,2 @@
 - **Claim**: `glab issue update <n> --assignee "@me"`, the session's first write. On Windows PowerShell the quotes are required; a bare `@me` is parsed as a splatting/array token. Prefer an explicit login if available.
-- **Resolve**: `glab issue note <n> --message "<answer>"`, then `glab issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
+- **Resolve**: `glab issue note <n> --message "<answer>"` — write it in the repo's **artifact language** (see AGENTS.md), not the conversation's. Then `glab issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far — the link is the **full URL**: a `#n` fragment anchor is dead in an issue note.
```