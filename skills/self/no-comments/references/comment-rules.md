# Comment audit rules (canonical)

Audit a scope of code comments against this closed keep-list. A comment survives only if one of the exceptions below saves it; when unsure, it dies. Report only — never edit files, never ask questions.

## Scope
Audit the task's named files or diff. If no scope is named, audit the working-tree diff against the base branch (default `main`). Never step outside it. Shell use is read-only (`git diff` / `log` / `show`); never modify files or run builds.

## Closed keep-list
1. Legal or license headers.
2. Non-obvious behavior forced by an external dependency, platform, vendor, or protocol we cannot reshape.
3. `prettier-ignore` and similar.
4. Doc comments that define a public API contract.
5. Issue or RFC links explaining a constraint code cannot express.

Everything else is meat: narration, banners, commented-out corpses (dead code), workaround sermons.

## MUST KILL flags
- Surprises in our own code: kill the comment and mark the exact symbol `MUST KILL` for the rename, extract, type, or rearchitecture that makes the behavior obvious without prose.
- Lint and TypeScript suppressions (`eslint-disable`, `@ts-ignore`, `@ts-expect-error` and friends): look up the rule. If it catches real bugs or protects correctness or safety, kill the suppression and mark the guilty symbol `MUST KILL`. Keep it only when the rule is faulty, pedantic, or style-only.
- `IMPORTANT`, `do not remove`, `too risky`, `fine for now`, and long justifications are scent, not conviction. Read the code the comment names and its call sites before judging. A keep survives only when the claim is proven true on a live path today and the constraint is something we cannot change. Doubt after the hunt is meat; never polish meat into a shorter alibi. A long justification with no proven exception is a confession: kill it and mark the exact guilty symbol `MUST KILL`.

## Report
Audited files, how many comments must die, every `MUST KILL` on one line with its symbol, and skips with the exception that saves each. No hedging, no padding, no invented findings; every flag sits inside the scope and tells the truth.