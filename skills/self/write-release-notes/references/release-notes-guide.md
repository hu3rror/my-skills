# Release Notes 撰写指南

本指南是 write-release-notes 步骤 2 的分类写法参考:素材怎么找、分类模板、以及"只有 Full Changelog 一行"这种反模式要怎么避免。

## 素材来源(按优先级)

1. `git log <上一个 tag>..HEAD --oneline` —— 最基础的素材,先拿到完整提交列表再动笔,不要边读边写导致分类前后不一致。
2. 若提交遵循 Conventional Commits(`feat:` `fix:` `docs:` `chore:` `BREAKING CHANGE:` 等前缀),按前缀初步分类。
3. 若不遵循规范提交,逐条读 commit message,必要时 `git show <sha> --stat` 看改了哪些文件来判断类别,而不是把 commit 标题原样堆成列表。
4. 仓库走 PR 合并的话,`gh pr list --state merged --search "merged:>=<上次发布日期>"` 补充上下文——PR 描述通常比单条 commit message 更完整,里面常有"为什么改"和"怎么用"。
5. 涉及行为变更、破坏性变更、新增公开 API 的提交,去读一下 diff 本身,不要只看标题猜测影响范围。

## 结构模板

模板为**英文骨架**（发布说明用英文产出时直接照抄；中文仅作理解，不要抄入产出）。

```markdown
## Highlights
Say in one or two sentences what changed for the user — not which files changed.

## Features
- Each new capability, described from the user's viewpoint.

## Fixes
- What was broken and the symptom before the fix, so readers can judge whether they hit it.

## Docs / Chore
- Docs or toolchain changes that affect how the tool is used; drop or merge pure internal refactors with no user-visible effect.

## ⚠️ Breaking Changes
- Omit this section when nothing breaks; when present, always give the migration path — never just "the interface changed".

## Full Changelog
`https://github.com/<owner>/<repo>/compare/v0.5.0...v0.6.0`
```

各节中文要点（理解用，不抄）：

- **Highlights**：一两句话说清"这个版本对用户变了什么"，不是改了哪些代码。
- **Features**：每条从用户视角写效果，不是函数名/文件名堆砌。
- **Fixes**：写清之前症状，让读者判断"是不是我遇到的那个 bug"。
- **Docs / Chore**：影响使用方式的文档或工具链变更；纯内部重构、无用户可感知影响的可省略或合并成一行。
- **Breaking Changes**：没有破坏性变更就整节删掉；有则必须写清迁移方法，不能只说"接口变了"——桌面/CLI 软件面向最终用户写"怎么改"，不是写给调用方开发者。
- **Full Changelog**：保留 compare 链接，给想看完整 diff 的人。

Full Changelog 链接依然保留在最后——对想看完整 diff 的人有用,它是补充素材,而不是整篇发布说明。

空的分类直接整节删掉(比如这版没有 fix,就不要留一个"Fixes / 无"的空节占位)。

## 反模式(避免)

- **把"亮点"写成 commit message 拼接。** 用户看的是"这个版本对我有什么用",不是压缩过的 git log。
- **省略 Breaking Changes 的迁移步骤。** 只写"XX 的接口变了",用户不知道该怎么改自己的代码。
- **空分类留占位。** 没有 fix 就不要写"Fixes\n- 无"。
- **只看提交标题不看内容就分类。** 一条 `fix: update deps` 的 commit 里如果顺带改了公开 API 的默认值,标题会漏掉这个对用户有影响的部分。
