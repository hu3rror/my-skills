# Excluded skills: manifest-declared curation, not code

Status: accepted

The aggregation repo curates what the distribution chain ships: 14 mattpocock
skills (the `in-progress` beta category, the uncurated `misc` category, and
`wizard`, `triage`, `to-questionnaire`) are not vendored. The mechanism that
expresses that curation needed a home, and it extends ADR-0002's single-home
principle: every deviation from upstream lives in one place, so the exclusion
list lives in the per-source meta (`vendor/<source>.json`, an `exclusions`
array of upstream-repo-relative paths plus rationale), parsed by the vendor
sync script and skipped silently during enumeration (map ticket #23; the list
lived in `PATCHES.md`'s "Excluded from vendor sync" section before the
rehoming). Sync and the freshness dry-run share the same enumeration, so an
excluded path never surfaces as a pending update.

**Considered Options**: a hardcoded exclusion predicate in the sync script
(rejected: skill names would live in code, splitting the deviation record
across two homes); an include-list model enumerating every kept skill (rejected:
it would freeze new upstream skills in kept categories out of the repo, breaking
vendor sync's auto-follow promise); hiding excluded skills deeper than the CLI
discovery depth (rejected: `--full-depth` still finds them, and it fights the
repo's documented depth rule).

**Consequences**: the kept categories stay scan-driven — new upstream skills
under engineering/productivity still flow in automatically, only excluded paths
are skipped. Curation edits are a vendor meta change (`vendor/<source>.json`),
not a code change; the meta carries rationale and the recovery command
(`npx skills add mattpocock/skills --skill <name>`, space form — the equals
form is silently discarded by the CLI and falls back to a full install).
Removal of the excluded consolidated copies stays a manual `git rm`, per
ADR-0002.
