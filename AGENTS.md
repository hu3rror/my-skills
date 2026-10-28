## Agent skills

### Maintenance

Every maintenance flow of this repo — skill onboarding, vendor sync, stray recovery, patch records, freshness, distribute, standards-update — runs through the `my-skills-maintenance` skill. It is hidden from automatic model selection (`disable-model-invocation: true`), so load it explicitly; its single runbook is `docs/agents/maintenance.md`. Read the runbook before touching `skills/`, `vendor/`, or the canonical skills store.

### Issue tracker

Work is tracked as GitHub issues on this repo (`hu3rror/my-skills`), operated via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.