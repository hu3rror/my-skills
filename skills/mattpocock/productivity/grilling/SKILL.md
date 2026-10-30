---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent with a fresh context window to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

A recommended answer is a claim, not an opinion: it must rest on a fact you have verified (via the filesystem, tools, docs, or a sub-agent) and name the source, so the fact carries an evidence chain a later round can re-check. When a recommendation depends on a fact you have not verified, label it `(待验证)` inline, name the missing fact and how you would check it — never present it as settled. A round is complete only when every recommendation has passed this check.

Before presenting a round, run the consistency check: hold every recommendation against (a) this effort's recorded decisions, (b) the precedents you cite, and (c) your own statements in this session, including the other recommendations of this round; flag any conflict inline. A recommendation that contradicts a recorded decision or your own earlier statement is a defect to resolve, not a fresh idea to float.

Decisions and precedents are records, not context: when a session starts clean (a wayfinder ticket session), fetch them — the map's Decisions-so-far, the closed tickets' resolutions, the ADRs — before the first round. An unread record is a `(待验证)` gap, never an empty set.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
