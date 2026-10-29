---
id: setup-matt-pocock-skills.artifact-language-github
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-github.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
verification: diff
after: setup-matt-pocock-skills.quoted-assignee
summary: >-
  Resolve step: resolution comments are written in the repo's artifact language (AGENTS.md), not the conversation's — prevents language drift; the map pointer link is the full URL, since a `#n` fragment anchor is dead in an issue body. Stacked after quoted-assignee (its trailing context is this hunk's target line).
---

## Why

Conversation and artifacts have different languages; a resolution that follows the session's language drifts silently. An `#n` fragment anchor renders as a same-page link with no target, so clicking it does nothing.

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
@@ -47,4 +47,4 @@ Used by `/wayfinder`. The **map** is a single issue with **child** issues as tic
 - **Blocking**: see **Blocking** under Conventions.
 - **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (see **Count open blockers**, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
 - **Claim**: `gh issue edit <n> --add-assignee "@me"`, the session's first write. On Windows PowerShell the quotes are required; a bare `@me` is parsed as a splatting/array token. Prefer an explicit login if available.
-- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
+- **Resolve**: `gh issue comment <n> --body "<answer>"` — write it in the repo's **artifact language** (see AGENTS.md), not the conversation's. Then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far — the link is the **full URL**: a `#n` fragment anchor is dead in an issue body.
```