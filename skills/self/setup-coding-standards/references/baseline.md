# Coding Standards

Rules for code written in this repository. Agent behavior rules live in `AGENTS.md`. Extend this file as the repo's conventions crystallize.

## Comments

- No comment by default: a comment is written only for a why that naming, structure, types, or splitting cannot express, and the writer must prove that first — "I feel it cannot be expressed" does not count.
- The code is the source of truth, a comment never is: when the two disagree, the code wins — fix the comment or delete it.
- Delete comments that restate the what, decorate, apologize, or have gone stale — when the why still holds, rewrite it — and comments that rot with time (version numbers, upstream sync status); a deletion is reported, not silent.
- Cleanup is limited to the code this change touches.
- Self-check: would a senior engineer keep this line? If the answer is no or hesitant, delete it.

## Error handling

- Handle errors, or propagate them with context (what failed, with what input); silently swallowing an error is a defect. Let tooling flag the mechanical forms (empty `catch`, ignored error returns).
- Errors surfaced to users never leak internals — stack traces, internal paths, queries, secrets. Return a generic message and log the detail.

## Resources

- Acquired resources (handles, connections, locks, temp files) are released on every path, including error paths; prefer scoped owners (`defer`, `with`, RAII, `Drop`) over manual release.

## Tests

- Behavior ships with a test that fails without it; a test that always passes is waste.

## Consistency

- Match the convention of the file you are editing; surrounding style settles style debates, not taste.

## Concurrency

- Shared mutable state has one owner or one synchronization mechanism; keep critical sections minimal, and never hold a lock across blocking work.

## Out of scope

- Updating or merging an existing standards file: the human decides what changes.
- Writing ADRs: rationale belongs in ADRs, and the doc points there.

<!-- end of baseline v3; repo-owned content below survives baseline updates -->
