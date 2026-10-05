# Excluded skills: manifest-declared curation, not code

> [ZH] 决策：从 vendor sync 排除的技能以数据形式记录在 PATCHES.md（"Excluded from vendor sync" 段），同步脚本解析该段并静默跳过；技能名不硬编码进脚本。否决硬编码谓词、include-list、藏深度三个方案。

Status: accepted

The aggregation repo curates what the distribution chain ships: 14 mattpocock
skills (the `in-progress` beta category, the uncurated `misc` category, and
`wizard`, `triage`, `to-questionnaire`) are not vendored. The mechanism that
expresses that curation needed a home, and it extends ADR-0002's single-home
principle: `PATCHES.md` is the source of truth for every deviation from
upstream, so the exclusion list lives there as a declarative section
("Excluded from vendor sync", upstream-repo-relative paths), parsed by the
vendor sync script and skipped silently during enumeration. Sync and the
freshness dry-run share the same enumeration, so an excluded path never
surfaces as a pending update.

**Considered Options**: a hardcoded exclusion predicate in the sync script
(rejected: skill names would live in code, splitting the deviation record
across two homes); an include-list model enumerating every kept skill (rejected:
it would freeze new upstream skills in kept categories out of the repo, breaking
vendor sync's auto-follow promise); hiding excluded skills deeper than the CLI
discovery depth (rejected: `--full-depth` still finds them, and it fights the
repo's documented depth rule).

**Consequences**: the kept categories stay scan-driven — new upstream skills
under engineering/productivity still flow in automatically, only excluded paths
are skipped. Curation edits are a PATCHES.md change, not a code change; the
section carries rationale and the recovery command (`npx skills add
mattpocock/skills --skill <name>`, space form — the equals form is silently
discarded by the CLI and falls back to a full install). Removal of the excluded
consolidated copies stays a manual `git rm`, per ADR-0002.
