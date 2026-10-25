---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.
Also fetch the tickets this one blocks and that block it, and restate their titles — scope leaks to sibling tickets are the failure mode to prevent (e.g. implementing a sibling's seam inside this ticket). If a fetch fails (network, permissions), mark the scope assumption `[NEED-VERIFY]` instead of proceeding silently; verify it before committing.

Load the "tdd" skill (read its SKILL.md) where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, load the "no-comments" skill (read its SKILL.md), then load the "code-review" skill (read its SKILL.md) to review the work.

Commit your work to the current branch.
