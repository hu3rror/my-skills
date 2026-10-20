---
name: comment-discipline
description: Write code that reads well without comments. Use when writing new code or editing existing code. Names, structures, and types carry the meaning first; comments state only the why — constraints, traps, and reasons a simpler alternative fails. For cleaning up existing comments, use the no-comments skill instead.
---

# Comment discipline

Write code a reader understands without prose.

1. Names, structure, and types explain the code first. Before writing a comment, look for a rename, an extraction, a type, or a rearchitecture that makes the comment unnecessary.
2. When a comment is genuinely needed, write the why — the constraint, the trap, the reason a simpler alternative fails — as the whole comment.
3. Facts and history live in git and the issue tracker, not in the file. A comment that describes what happened belongs there, not here.

## Boundary

Cleaning up comments in existing code is a different job: run the `no-comments` skill, which spawns comment-sicko for an independent audit and encodes constraints as type/runtime checks, tests, or CI lint.