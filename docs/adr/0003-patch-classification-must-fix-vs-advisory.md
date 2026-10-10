# Patch classification: must-fix vs advisory

Status: accepted

Some upstream skills assume a bash environment and break on Windows PowerShell.
Patching every incompatibility would widen the upstream diff and turn every
vendor sync into a merge exercise, so we adopted a two-tier classification:
must-fix platform breakages — where a skill is unconditionally broken on
Windows — get patched into the consolidated copy and recorded as a patch
record (diff-verified); conditional or non-fatal environment issues are
recorded in `docs/advisory-notes.md` as advisory notes only and never patched
into the skill body (single home per map ticket #23; the notes lived in
`PATCHES.md`'s B-class section before the rehoming, and the A-class/B-class
labels were absorbed into the patch-record `verification` field at the map #18
migration).

**Considered Options**: patch every incompatibility (rejected: the upstream diff
grows and each sync becomes a manual-merge exercise); document everything and
patch nothing (rejected: must-fix skills stay broken on Windows).

**Consequences**: the upstream diff stays minimal, keeping vendor sync cheap;
B-class issues persist on Windows and need manual workarounds, which is why
`docs/advisory-notes.md` records them explicitly with a verification method
rather than leaving them implicit.
