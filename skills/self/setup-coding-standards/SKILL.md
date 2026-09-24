---
name: setup-coding-standards
description: "Initialize the current repo's coding standards: create CODING_STANDARDS.md at the repo root with the baseline plus repo conventions already verified, and leave any existing standards file untouched."
disable-model-invocation: true
---

# Initialize the repo's coding standards

Create `CODING_STANDARDS.md` at the repo root of the current repository when it has none. The file records rules for code written in this repo: the **baseline** (written verbatim, below) plus the repo's own conventions you have already verified.

The **guardrail**: an existing standards file is the human's to change. If the repo already has one, stop and report it, writing nothing.

## Steps

1. **Find the repo root.** Run `git rev-parse --show-toplevel` from the cwd; if the repo has no git root, use the cwd. Done when one root path is chosen.

2. **Check for an existing standards file.** Look at the root for `CODING_STANDARDS.md` and near-variants (`coding-standards.md`, case variants). If one exists: stop, report its path, write nothing. Done when existence is decided.

3. **Compose the file.** Open with the baseline below, verbatim. Then append the repo's conventions you already hold from verified observation: evidence-cited, nothing invented, and no empty headings. If you hold no verified conventions, the file is the baseline alone. Done when every line is either baseline or evidence-cited, and no section is empty.

4. **Write it** to the repo root. Read it back and confirm the content matches what you composed. Done when the file exists and matches.

5. **Report:** the path, what was written (baseline only, or baseline plus which conventions), and that extending the file is a one-place edit: new rules are added here, keeping a single home for each rule.

## Baseline

Write verbatim:

# Coding Standards

Rules for code written in this repository. Agent behavior rules live in `AGENTS.md`; trade-off rationale and rejected alternatives live in ADRs. Extend this file as the repo's conventions crystallize.

## Comments

- Default to no comments. Let names and structure make the code self-explanatory.
- Write comments only for reasons the code itself cannot express: hidden constraints, counterintuitive behavior, historical pitfalls, and special compatibility requirements.
- Put trade-off rationale and rejected alternatives in ADRs, not in code comments.

## Out of scope

- Updating or merging an existing standards file: the human decides what changes.
- Writing ADRs: rationale belongs in ADRs, and the doc points there.
