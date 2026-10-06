---
id: research.pushed-completion
file: skills/mattpocock/engineering/research/SKILL.md
upstream:
  source: mattpocock/skills
  path: skills/engineering/research/SKILL.md
  pin: 4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d
verification: diff
after: research.step3-repo-internal
summary: >-
  2 lines appended after step 3 (a blank line + the pushed-completion sentence):
  the agent's completion is pushed back as a notification carrying the findings
  path — read it when the push lands, don't poll, and don't plan around reading
  it at a fixed time.
origin: PATCHES.md A-class row #1 (baseline)
---

## Why

Same mechanism as the wayfinder push note: research completion is **pushed**,
so an agent must not poll or assume a fixed read time.

## Diff

> The `-` side is the **intermediate** state after `research.step3-repo-internal`
> (the rewritten step-3 line): this record's appended lines sit immediately after
> the line that record replaces, so it applies on top via `after`.

```diff
--- a/skills/engineering/research/SKILL.md
+++ b/skills/engineering/research/SKILL.md
@@ -11,2 +11,4 @@
 2. Write the findings to a single Markdown file, citing each claim's source.
-3. Save it inside the repo's working tree, where the repo already keeps such notes: match the existing convention, and if there is none, pick a repo-relative location (e.g. `docs/research-<slug>.md` or next to the topic it concerns) and state it. The findings path must resolve inside the repo — check with `git rev-parse --show-toplevel` — so the file is a committed artifact of the work it informs.
+3. Save it inside the repo's working tree, where the repo already keeps such notes: match the existing convention, and if there is none, pick a repo-relative location (e.g. `docs/research-<slug>.md` or next to the topic it concerns) and state it. The findings path must resolve inside the repo — check with `git rev-parse --show-toplevel` — so the file is a committed artifact of the work it informs.
+
+The agent's completion is **pushed** back to you: when it finishes (or fails, or is stopped), a notification arrives in your context carrying the findings path. Read the file when the push lands — don't poll for it, and don't plan around reading it at a fixed time.
```

