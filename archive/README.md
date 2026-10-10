# archive/ — retired self skills, kept but not distributed

Soft-retirement home for `skills/self/` skills the maintainer no longer
maintains. Files stay in the repo (readable, greppable, restorable) but are
**not** distributed: the distribution chain (`npx skills add … -s '*'`) only
scans the `skills/` container, so anything outside it — `patches/`,
`archive/` — never reaches the canonical store. No extra mechanism is needed.

## Why this exists

Hard retirement (`git rm` + `npx skills remove <name>`, the retire branch of
`my-skills-maintenance`) removes the working-tree copy entirely. Archiving
keeps the copy for reference while giving up distribution — the middle path
between "maintained" and "gone".

## Rules

- Only skills previously under `skills/self/` land here; vendored skills are
  never archived (their upstream copy returns via vendor sync instead).
- A skill here must stay out of the canonical store: `npx skills add` does
  **not** prune, so after moving a skill here, run `npx skills remove <name>`
  on every store that already has it — a store copy left behind becomes a
  new stray and fails the next distribution gate.
- Frontmatter stays untouched: moving the skill back is just
  `git mv archive/<name> skills/self/<name>` plus a re-distribution.
- Store-side cleanup of the archived skill is skipped on environments the
  maintainer no longer distributes to — they show up as strays on the next
  distribution run there, settled then (known, accepted).

## Current contents

| Skill | Former path | Why archived |
|---|---|---|
| web-debug | `skills/self/web-debug` | Supabase-flavored frontend-debugging playbooks; current projects use custom auth, and the browser tooling's own skills cover the generic triage loop |
