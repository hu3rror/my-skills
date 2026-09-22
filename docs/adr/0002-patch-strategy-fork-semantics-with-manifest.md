# Patch strategy: fork semantics with a patch manifest

> [ZH] 决策：补丁直接落在仓库技能文件里（fork 语义），PATCHES.md 是偏差清单（source of truth），同步脚本跳过所列文件并标记手动合并；否决 .patch 文件方案。

Status: accepted

vercel-labs/skills has no overlay or patch mechanism, so adapting upstream
content had to happen somewhere persistent. We decided that patches live
directly in the repo's skill files (fork semantics) and that `PATCHES.md` is
the source of truth for every deviation, with the sync script skipping listed
files and reporting them as "upstream updated a patched file — merge manually".

**Considered Options**: `.patch` files with a post-apply step (rejected: the
repo would not ship the artifacts agents actually run); rely on the CLI's
absent overlay mechanism (not possible).

**Consequences**: diffing against upstream must show exactly the documented
patch lines; every patch entry must map to a real file in the repo. Extending
the same no-silent-clobber rule, vendor sync reports files removed upstream but
never deletes them — removal stays a manual `git rm` so a locally-authored file
that isn't yet attributed can't be silently lost.
