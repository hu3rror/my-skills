---
id: setup-matt-pocock-skills.temp-scratch-gitlab
file: skills/mattpocock/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
verification: diff
summary: >-
  "Closing tickets" section added to the generated tracker doc: git status
  must be clean before closing, probes run under the literal `$TEMP` path
  (never the repo root), and the Windows scratch-path trap is spelled out —
  Git Bash `/tmp` is `%TEMP%`, but Windows-native tools (node / python / the
  `write` tool) resolve `/tmp/...` to `C:\tmp\...`, one string two roots.
---

## Why

The scratch-path trap used to live only as a local patch on the generated
`docs/agents/issue-tracker.md`, so a re-run of setup (or any other repo) lost
it and Windows agents wrote probe files to `C:\tmp`. Seeding the knowledge in
the template makes every generated tracker carry the pointer.

## Diff

```diff
--- a/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
+++ b/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md
@@ -22,6 +22,10 @@
 
 Infer the repo from `git remote -v`; `glab` does this automatically when run inside a clone.
 
+## Closing tickets
+
+Before closing, `git status --porcelain` must be empty and **untracked files (`??`) count as dirty** — run probes/experiments under the literal `$TEMP` path, never the repo root. **On Windows with Git Bash, `/tmp` is `%TEMP%`, but Windows-native tools (node / python / the `write` tool) resolve `/tmp/...` to `C:\tmp\...` — one string, two roots.** Write the full `$TEMP` path explicitly in every scratch command and path argument.
+
 ## Merge requests as a triage surface
 
 **MRs as a request surface: no.** _(Set to `yes` if this repo treats external merge requests as feature requests; `/triage` reads this flag.)_
```
