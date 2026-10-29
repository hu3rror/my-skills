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
@@ -51,4 +51,4 @@ Used by `/wayfinder`. The **map** is a single issue with **child** issues as tic
 - **Blocking**: GitLab's **native blocking link**, the canonical, UI-visible representation. Add it with the `/blocked_by #<n>` quick action, posted as a note (`glab issue note <child> --message "/blocked_by #<blocker>"`). Native blocking links are a Premium/Ultimate feature; on the free tier (or where unavailable) fall back to a `Blocked by: #<n>, #<n>` line at the top of the description. A ticket is unblocked when every blocker is closed.
 - **Frontier query**: list the map's children with `glab api projects/:id/issues/<map>/links`, keeping open issues that carry a `wayfinder:<type>` label; drop any with an open blocker: a native `blocked_by` link to an open issue (`glab api projects/:id/issues/<child-iid>/links`), or an open issue in the `Blocked by` line, or an assignee; first in map order wins.
 - **Claim**: `glab issue update <n> --assignee "@me"`, the session's first write. On Windows PowerShell the quotes are required; a bare `@me` is parsed as a splatting/array token. Prefer an explicit login if available.
-- **Resolve**: `glab issue note <n> --message "<answer>"`, then `glab issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
+- **Resolve**: `glab issue note <n> --message "<answer>"` — write it in the repo's **artifact language** (see AGENTS.md), not the conversation's. Then `glab issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far — the link is the **full URL**: a `#n` fragment anchor is dead in an issue note.
```