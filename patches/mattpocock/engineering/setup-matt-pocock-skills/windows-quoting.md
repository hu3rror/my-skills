---
id: setup-matt-pocock-skills.windows-quoting
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
verification: diff
summary: >-
  Two Windows fixes: the create-issue heredoc instruction replaced with a PowerShell here-string multi-line approach (a bash heredoc doesn't work from PowerShell), and the claim line --assignee @me -> --assignee "@me" with the same splatting warning as the GitHub template.
origin: "PATCHES.md A-class row #8"
---

## Why

Mirrors the GitHub tracker template: --assignee needs quotes under PowerShell, and the heredoc for multi-line descriptions is bash-only. Both were verified against glab's parsing behavior.

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
@@ -4,7 +4,15 @@ Issues and specs for this repo live as GitLab issues. Use the [`glab`](https://g
 
 ## Conventions
 
-- **Create an issue**: `glab issue create --title "..." --description "..."`. Use a heredoc for multi-line descriptions. Pass `--description -` to open an editor.
+- **Create an issue**: `glab issue create --title "..." --description "..."`. For multi-line descriptions on Windows PowerShell, build the body as a here-string and pass the variable (a bash heredoc doesn't work from PowerShell); `--description -` opens an editor instead:
+
+  ```powershell
+  $description = @"
+  <line one>
+  <line two>
+  "@
+  glab issue create --title "Issue title" --description $description
+  ```
 - **Read an issue**: `glab issue view <number> --comments`. Use `-F json` for machine-readable output.
 - **List issues**: `glab issue list -O json` with appropriate `--label` filters.
 - **Comment on an issue**: `glab issue note <number> --message "..."`. GitLab calls comments "notes".
@@ -42,5 +54,5 @@ Used by `/wayfinder`. The **map** is a single issue with **child** issues as tic
 - **Child ticket**: an issue carrying `Part of #<map>` at the top of its description and labels `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
 - **Blocking**: GitLab's **native blocking link**, the canonical, UI-visible representation. Add it with the `/blocked_by #<n>` quick action, posted as a note (`glab issue note <child> --message "/blocked_by #<blocker>"`). Native blocking links are a Premium/Ultimate feature; on the free tier (or where unavailable) fall back to a `Blocked by: #<n>, #<n>` line at the top of the description. A ticket is unblocked when every blocker is closed.
 - **Frontier query**: `glab issue list -O json` scoped to the map's children, drop any with an open blocker: a native `blocked_by` link to an open issue (`glab api projects/:id/issues/<child-iid>/links`), or an open issue in the `Blocked by` line, or an assignee; first in map order wins.
-- **Claim**: `glab issue update <n> --assignee @me`, the session's first write.
+- **Claim**: `glab issue update <n> --assignee "@me"`, the session's first write. On Windows PowerShell the quotes are required; a bare `@me` is parsed as a splatting/array token. Prefer an explicit login if available.
 - **Resolve**: `glab issue note <n> --message "<answer>"`, then `glab issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

```
