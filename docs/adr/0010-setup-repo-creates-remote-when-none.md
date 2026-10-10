# setup-repo creates a GitHub remote when the repo has none

> [ZH] 决策：`setup-repo` 在探索发现完全无远程仓库时，先自动创建 GitHub 私有仓库（`gh repo create <目录名> --private --source=. --push`；目录无提交时先建最小初始提交），再照常委托 setup 原语；创建失败（gh 未认证 / 网络 / 重名）时降级回询问式。远程创建发生在委托 `setup-matt-pocock-skills` 之前，其 Section A 的"无 remote → local markdown"兜底永不触发；执行时仍按会话向用户确认。

Status: accepted

The maintainer's standard answer is GitHub for every repo (ADR-0005), but a
brand-new empty project has no remote — the default could not hold, and the
orchestrator's old reaction was to ask ("no remote at all → offer GitHub /
GitLab / local markdown / other"). We decided the orchestrator now creates the
missing remote itself: if `git remote -v` is empty, it `git init`s when needed,
guarantees at least one commit (an empty directory has nothing to push — `git
push` fails with `src refspec HEAD does not match any`), then runs
`gh repo create <dir-name> --private --source=. --push` (new GitHub repos
enable Issues by default — no extra flag; the remote name defaults to the
directory name). Creation failure — `gh` unauthenticated, network, name clash —
falls back to the previous ask. The remote exists before
`setup-matt-pocock-skills` runs, so the vendored primitive is untouched and its
Section A proposes GitHub normally.

**Considered Options**: keep the ask ("no remote → offer options"): rejected —
contradicts the no-re-asking principle; makes the common path (empty new
project, GitHub intent) interactive. Patch the vendored primitive to create the
remote itself: rejected — repo creation is a repo-level action, not
configuration, and editing a vendored file costs patch records and upstream-
drift noise (ADR-0005's reasoning). Skip the tracker on empty repos: rejected —
the issue tracker is a core setup output; the engineering skills would have no
work home.

**Consequences**: the orchestrator now performs a remote-writing action (repo
creation) — always executed only with the user's go-ahead per session. Empty-
directory setups gain an initial commit (README / .gitignore) as a side effect.
`setup-matt-pocock-skills`' "repos without a remote" branch stays as upstream
ships it — it still serves repos that never go through `setup-repo`.