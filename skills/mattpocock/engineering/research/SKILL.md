---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it inside the repo's working tree, where the repo already keeps such notes: match the existing convention, and if there is none, pick a repo-relative location (e.g. `docs/research-<slug>.md` or next to the topic it concerns) and state it. The findings path must resolve inside the repo — check with `git rev-parse --show-toplevel` — so the file is a committed artifact of the work it informs.

The agent's completion is **pushed** back to you: when it finishes (or fails, or is stopped), a notification arrives in your context carrying the findings path. Read the file when the push lands — don't poll for it, and don't plan around reading it at a fixed time.
