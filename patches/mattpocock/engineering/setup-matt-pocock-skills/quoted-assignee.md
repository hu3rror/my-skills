---
id: setup-matt-pocock-skills.quoted-assignee
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-github.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
verification: diff
summary: >-
  Claim line: --add-assignee @me -> --add-assignee "@me" plus a Windows PowerShell splatting warning — the quotes are required; a bare @me is parsed as a splatting/array token.
origin: "PATCHES.md A-class row #3 (baseline)"
---

## Why

On Windows PowerShell a bare @me is parsed as a splatting/array token, so the documented claim command fails. The quoted form plus the warning make the GitHub tracker runnable on this machine.

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md
@@ -42,5 +46,5 @@ Used by `/wayfinder`. The **map** is a single issue with **child** issues as tic
 - **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
 - **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
 - **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
-- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
+- **Claim**: `gh issue edit <n> --add-assignee "@me"`, the session's first write. On Windows PowerShell the quotes are required; a bare `@me` is parsed as a splatting/array token. Prefer an explicit login if available.
 - **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

```
