# Patch classification: must-fix vs advisory

> [ZH] 决策：平台冲突分两级——A-class（技能在 Windows 上无条件不可用）落补丁到 consolidated copy；B-class（条件性/非致命环境问题）只在 PATCHES.md 记 advisory note、不改技能正文。理由是保持 upstream diff 最小，让 vendor sync 便宜。

Status: accepted

Some upstream skills assume a bash environment and break on Windows PowerShell.
Patching every incompatibility would widen the upstream diff and turn every
vendor sync into a merge exercise, so we adopted a two-tier classification:
A-class conflicts — where a skill is unconditionally broken on Windows — get
patched into the consolidated copy; B-class issues — conditional or non-fatal
environment problems — are recorded in `PATCHES.md` as advisory notes only and
never patched into the skill body.

**Considered Options**: patch every incompatibility (rejected: the upstream diff
grows and each sync becomes a manual-merge exercise); document everything and
patch nothing (rejected: must-fix skills stay broken on Windows).

**Consequences**: the upstream diff stays minimal, keeping vendor sync cheap;
B-class issues persist on Windows and need manual workarounds, which is why
`PATCHES.md` records them explicitly with a verification method rather than
leaving them implicit.
