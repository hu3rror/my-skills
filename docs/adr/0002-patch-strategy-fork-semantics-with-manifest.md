# Patch strategy: fork semantics with per-patch records

Status: accepted

vercel-labs/skills has no overlay or patch mechanism, so adapting upstream
content had to happen somewhere persistent. We decided that patches live
directly in the repo's skill files (fork semantics) and that the per-patch
records at `patches/<source>/` are the source of truth for every deviation
(the `patches/**/*.md` glob is the manifest — format map ticket #22). The sync
script skips the files the records name and reports them as "upstream updated
a patched file — merge manually"; the record verifier
(`scripts/verify-patch-records.mjs`) re-derives every diff-verified record
against its pinned upstream blob and byte-compares the reconstruction to the
local copy, so a record that no longer matches the shipped artifact fails
loudly instead of silently drifting.

**Considered Options**: `.patch` files with a post-apply step (rejected: the
repo would not ship the artifacts agents actually run); rely on the CLI's
absent overlay mechanism (not possible); accept-drift prose manifest (rejected:
unverifiable — superseded by the machine-verified records at the #18
migration).

**Consequences**: diffing against upstream must show exactly the documented
patch lines — enforced by the verifier, not by prose — and every record's
`file:` must map to a real present file in the repo (the sync skip-set guard
refuses when one is missing). Extending the same no-silent-clobber rule, vendor
sync reports files removed upstream but never deletes them — removal stays a
manual `git rm` so a locally-authored file that isn't yet attributed can't be
silently lost.