---
name: no-comments
description: Audit the comments in a scope with an independent sub-agent, judge its findings, fix root causes, and encode claimed constraints.
disable-model-invocation: true
---

# No comments

Spawn `comment-sicko` for an independent pass, then judge its report and fix. Reviewer and fixer stay separate so the audit has a second pair of eyes.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base branch, default `main`, including the working tree.

## Steps

1. Snapshot first: `git add -A`. If a fix wrecks the tree, `git restore .` rolls it back to this snapshot, then rerun the audit. Covers the whole tree, not just the scope.
2. Run `subagent` once with `comment-sicko` and the scope in `task`, nothing else. The call is blocking: the full report arrives in one result, so no polling. Its rules live in `references/comment-rules.md` (canonical); the bundled `comment-sicko` role embeds the same text.
3. Judge the report against the diff:
   - Reject application-code edits, scope escapes, exception-protected deletions, misstated `MUST KILL` reasons, and flags that treat kept intentional code as guilty.
   - Reshape flags on surprises in our own code stay actionable; those comments are not restored.
   - A keep survives only with proof it is about something we cannot change. An ambiguous kill is not restored; a refuted or still-ambiguous keep is deleted.
   - Audit scoped lint and TypeScript suppressions the report missed. Correctness or safety suppressions stay actionable `MUST KILL`s.
   - A restored deletion needs an exact exception and scoped proof.
   - For a thin `IMPORTANT` or `do not remove` verdict, run `fact-finder` on its symbol (or read the symbol and its call sites yourself) before judging.
   - Rerun one rejected report with the failure named. Reject a second, report it open, and fail this run.
4. Fix trivial accepted flags directly: delete a dead path, drop a parameter, use the real API. When a fix needs a shape, consult `codebase-design` once for the accepted set and surrounding code, and stop at the sketch — it shapes, step 5 implements.
5. Implement the smallest root-cause fix in scope and remove every named workaround. If the root cause is out of scope, land the smallest in-scope fix and report the rest open. The fence stays where it is.
6. Constraint comments (`do not remove`, `do not change wording`, `talk to X before changing`) survive when they are about things we cannot change. Offer the cheapest encoding — type, runtime check, test, CI lint — and wait for approval: approved, encode then delete; otherwise delete, report the constraint open, and sketch the out-of-scope work.
7. Rerun the tests your fixes touch (steps 4–5), then report the deletion count, restored comments, reruns, design sketch, fixes, encoding offers, encodings, unenforced constraints, and other open work.

Prerequisite: a sub-agent tool. In pi, `pi-matt-subagent`'s `subagent` tool with the bundled `comment-sicko` and `fact-finder` roles.
