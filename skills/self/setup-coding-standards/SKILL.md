---
name: setup-coding-standards
description: "Write CODING_STANDARDS.md at the repo root when it has none: the baseline plus the repo's conventions verified from code. An existing standards file is left untouched."
disable-model-invocation: true
---

# Initialize the repo's coding standards

## Steps

1. **Find the repo root.** Run `git rev-parse --show-toplevel` from the cwd; if the repo has no git root, use the cwd. Done when one root path is chosen.

2. **Check for an existing standards file.** Look at the root for `CODING_STANDARDS.md` and near-variants (`coding-standards.md`, case variants). If one exists: stop, report its path, write nothing. Done when existence is decided.

3. **Compose the file.** Read `references/baseline.md` (in this skill's directory) and copy it verbatim as the file's lead; do not rename or restructure its headings. The baseline ends with a marker comment — repo conventions go below that marker, never above it. Then append the repo's conventions you verified from the code as it is now: evidence-cited, nothing invented, and no empty headings. A comment is not evidence — a convention a comment claims must be checked against the code it describes, or dropped. Skip conventions that merely restate what the repo's tooling already enforces — the formatter, linter, or type checker is the single source for those. If you hold no verified conventions, the file is the baseline alone. Done when the baseline part matches `references/baseline.md` exactly, every appended line sits below the marker and is verified from the code, and no section is empty.

4. **Write it** to the repo root. Read it back and confirm the content matches what you composed. Done when the file exists and matches.

5. **Report:** the path, what was written (baseline only, or baseline plus which conventions), and that extending the file is a one-place edit: new rules are added here, keeping a single home for each rule.

