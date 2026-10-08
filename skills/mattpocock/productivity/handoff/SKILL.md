---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the OS temp directory, resolved explicitly (`$env:TEMP` on Windows; `$TMPDIR`, else `/tmp`, on Linux / WSL / macOS) - not the current workspace. A bare `/tmp/...` path reaching a Windows-native tool (node, python, pi's `write`) resolves to `C:\tmp\...` instead, so pass the resolved absolute path on Windows.

Open the document with a handover preamble addressed to the next agent, worded to force an alignment stop before any work:

> You are the incoming agent. Read this document and every artifact it references in full before doing anything else. Then reply with your understanding of four things: the goal, the current state, the next steps, and the risks. Wait for the user's confirmation before starting work.

Include a "suggested skills" section in the document, naming which skills the next agent should load (read each SKILL.md and follow it) and in what order.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
