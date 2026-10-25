# Research: "No Comments" / Comment-Discipline Norms in Coding Teams and Agent-Skill Ecosystems

**Question:** How do coding teams and agent-skill ecosystems enforce "no comments" / comment-discipline norms — and is pre-coding-time loading of comment discipline a proven working pattern, or do implementations converge on post-hoc audit?

**Answer in one paragraph.** The agent-skill ecosystem is split 4-to-1 *toward post-hoc audit*: of the five public "no-comments" skills indexed on skills.sh, four (including pstack's, the highest-profile one) are user-invoked, `disable-model-invocation` review workflows that spawn an independent "comment-hating" reviewer subagent **after** code is written; only one (ctxr-dev/no-comments) is a writing-time rule skill meant to load **while** the agent codes. Even pstack — whose `poteto-mode` carries an inline "write them clean as you go" comment rule that loads during coding — gates a mandatory `/no-comments` pass before review, on the explicit reasoning that "an author defends its comments the way you'd defend yours," i.e., a same-agent pre-loading rule is not trusted to be self-enforcing. Real-world teams that do enforce "no comments" (Cap, werf, Raven, lector, astro) write it as **pre-loaded written policy in AGENTS.md** ("read BEFORE writing any code… default to no code comments"), often backed by a **separate automated/human review gate** (CI lint, PR gate, code review). Empirical evidence that context-loaded instructions change agent output is real but double-edged: the AGENTS.md evaluation finds agents "tend to respect their instructions" (behavior changes, e.g., more testing), yet net task success is at best marginally improved and "unnecessary requirements from context files make tasks harder"; comment-in-context studies show comments sway generated code by ±20% pass@1 — implying the *converse* (a prohibition loaded at coding time) also steers output, but no study isolates "comment policy at coding time" from post-hoc audit.

---

## 1. pstack's no-comments workflow (github.com/cursor/plugins, `pstack/`)

Source: local clone of `cursor/plugins` → `pstack/` (plugin.json: name `pstack` v0.15.32, author Lauren Tan, MIT). GitHub: <https://github.com/cursor/plugins/tree/main/pstack>.

### Triggering: user-invoked post-hoc audit, explicitly not auto-loaded

`pstack/skills/no-comments/SKILL.md` frontmatter:

```yaml
name: no-comments
description: "Spawn Comment Sicko, fix accepted findings, and offer encodings for claimed constraints."
disable-model-invocation: true
```

`disable-model-invocation: true` means the model is **not** allowed to invoke it spontaneously during coding; the user (or an orchestrating skill) must call it. Its body is a post-hoc audit workflow, not a writing rule:

> "Spawn Comment Sicko. Act on accepted findings. Defer to Comment Sicko's fresh perspective. ## Scope: Use the caller's files or diff. Otherwise use the current diff against the base branch, default `main`, including the working tree."

Step 1: "Spawn `Task` with `subagent_type: "comment-sicko"`." Step 5 encodes claimed constraints: "Constraint comments say `do not remove`… Offer the cheapest in-scope type, runtime, test, or CI lint… If approved, encode then delete."

The reviewer agent itself, `pstack/agents/comment-sicko.md`:

> "I hate comments. Feed me the parent scoped files or diff… Narration, banners, commented-out corpses, workaround sermons. I want them all. Only these exceptions get to crawl away. — Legal or license headers. Non-obvious behavior forced by an external dependency… `// prettier-ignore`… Doc comments that define a public API contract. Issue or RFC links that explain a constraint code cannot express… When I am not sure a keep clause applies, the comment dies."

README.md (`/no-comments` row): "strip comments before review; spawns Comment Sicko, fixes accepted findings, offers encodings for claimed constraints." And: "pstack also ships Comment Sicko, a read-only comment reviewer available as `subagent_type: "comment-sicko"`. usually invoke it through `/no-comments`, not directly."

`docs/guide/05-build-and-clean.md` (§69-81) gives the design rationale — the post-hoc gate exists *because* a pre-loaded writing rule isn't trusted to be self-enforcing:

> "Comments need their own pass, and not from the agent that wrote them. An author defends its comments the way you'd defend yours. So before review, hand them to fresh eyes: `/no-comments` the diff… spawns Comment Sicko, a read-only reviewer with a short keep list… A surprise in your own code gets no such pass."

### But pstack ALSO pre-loads comment discipline during coding — inside poteto-mode

`pstack/skills/poteto-mode/SKILL.md`, "## Comments" section:

> "Comments follow the same rule as the reply. Write them clean as you go. Keep a comment only for a non-obvious *why* the code can't show. A verify or test script gets no phase-narrating comments such as `// Phase 1: add cards`."

poteto-mode is a "custom mode" (README: "pick it from the `/` menu and press option+enter… it stays in context every turn until you exit the mode"), itself `disable-model-invocation: true` — i.e., it only loads when a human turns it on. Its trigger list wires the audit gate: "Before review → the **no-comments** skill (`/no-comments`)."

**Verdict for Q1:** pstack's *named no-comments artifact* is a user-invoked post-hoc audit, not auto-loaded during coding. pstack as a whole is a hybrid: a written comment rule rides along in mode context during coding, plus a mandatory pre-review audit by a fresh reviewer. The Claude Code port (michael-denyer/pstack-claude, <https://www.claudepluginhub.com/skills/michael-denyer-pstack-plugins-pstack/no-comments>) documents the load cost: "Every session ~30 tokens — Name and description: Claude knows it exists. When invoked ~712 tokens — SKILL.md joins the conversation and stays."

## 2. Agent skill stores: what "no comments" skills exist and what form they take

skills.sh (Vercel's skills directory) search for "no-comments" returns five skills; anthropics/skills and awesome-claude-skills contain none.

| Skill (skills.sh) | Form | Trigger model |
|---|---|---|
| cursor/plugins (pstack) | Workflow (audit + fix + encode) | `disable-model-invocation: true`; user-invoked pre-review pass |
| ryanditjia/rstack | Workflow (audit + fix + encode), pstack-derived | "Spawn a reviewer subagent. Act on accepted findings. Defer to the reviewer's fresh perspective." |
| riffingonsoftware/agent-skills | Workflow (audit) | "Delegate the review to a fresh, read-only subagent… The reviewer reports only and never edits files." |
| shipshitdev/skills | Workflow (audit) | "Spawn a read-only comment reviewer… This skill is the pre-review comment pass." Companion to `comment-mode`, `deslop` |
| ctxr-dev/no-comments | Reference-style rule doc (the one exception) | Description written as a trigger: "Use when writing, editing, or reviewing code in any language… never write a comment on a line you add or change"; no `disable-model-invocation` |

Quotes and forms:

- **riffingonsoftware/agent-skills** (<https://www.skills.sh/riffingonsoftware/agent-skills/no-comments>): "Comments lie. Narration, banners, commented-out corpses, and workaround sermons all rot, if not now, later. Kill every comment except those on this keep list."
- **shipshitdev/skills** (<https://www.skills.sh/shipshitdev/skills/no-comments>): "Authoring agents defend comments. Defer to a fresh reviewer that did not write the code."
- **ctxr-dev/no-comments** (<https://www.skills.sh/ctxr-dev/no-comments/no-comments>; raw SKILL.md at <https://raw.githubusercontent.com/ctxr-dev/no-comments/HEAD/SKILL.md>) is the lone *writing-time* rule skill:
  - "This changes what you **write**: every line you add or change carries no comment. It never changes what is already in the file."
  - "There is no 'unless the code is non-obvious' clause. That clause was tried, and it was used to justify a comment every single time."
  - "**Never write a comment on a line you add or change.**" — followed by a six-rung "what to do instead" ladder (rename → extract → model in a type → restructure → test → write it down outside the source).
  - Explicitly not an audit: "A comment sweep is its own change, with its own PR, and only when someone asks for it." Its audit is a same-agent "Final pass before you commit" self-check list ("Fix what you find, then commit. Never show this pass to the user.").

- **anthropics/skills** (<https://github.com/anthropics/skills>): the official 16-skill repo (docx/pdf/pptx/xlsx, webapp-testing, canvas-design, brand-guidelines, mcp-builder, etc.) contains **no** comment-discipline skill. Its README: skills are "folders of instructions, scripts, and resources that Claude loads dynamically."
- **awesome-claude-skills** (ComposioHQ, <https://github.com/composiohq/awesome-claude-skills>): 1000+ skill list (Code & DevOps, document skills, etc.) contains **no** "no-comments"/comment-discipline skill; all "comment" hits are Office-XML tracked-change comments (docx/pptx).

**Verdict for Q2:** the store-level pattern is a *reference-doc-or-workflow* skill; 4 of 5 are post-hoc audit workflows that keep the author-agent out of judging its own comments; the reference-rule form (ctxr-dev) exists and is auto-invocable but is the minority. No store ships an AGENTS.md-style rule *as* the skill; AGENTS.md rules appear instead in real repos (see §3).

## 3. Published claims and team practice: pre-loaded written policy vs review/audit gate

### Canonical blog claims ("comments lie", self-documenting code)

- **Jeff Atwood, "Coding Without Comments"** (Coding Horror, Jul 24, 2008, <https://blog.codinghorror.com/coding-without-comments/>): "While comments are neither inherently good or bad, they are frequently used as a crutch. **You should always write your code as if comments didn't exist.** This forces you to write your code in the simplest, plainest, most self-documenting way you can humanly come up with… when you can't possibly imagine any conceivable way your code could be changed to become more straightforward and obvious — then, and *only then*, should you feel compelled to add a comment." Enforcement framing: personal discipline + refactoring, not a gate.
- **"Comments Lie!"** — Lassi Autio, 2019 (<https://lassiautio.com/2019/03/19/comments-lie/>), echoing Ron Jeffries ("Code never lies, comments sometimes do") and Clean Code: "good code doesn't need comments, but the bad code needs comments… oftentimes comments are not up to date and they 'lie'."
- **"Lies, Damned Lies, and Code Comments"** — Stacey Vetzal, Feb 3, 2015 (<https://stacey.vetzal.ca/2015/2015-02-03-code-comments/>): "If you see a comment that lies, fix it or delete it. Immediately… If you feel you need to write a comment to explain what the code is doing, refactor the code so that it is clear."
- **Google Testing Blog, "Let Code Speak for Itself"** (Dec 2023, <https://testing.googleblog.com/2023/12/let-code-speak-for-itself.html>) and **Google Go style guide** (<https://google.github.io/styleguide/go/guide.html>): the mainstream corporate norm is *why-not-what* discipline, not zero comments: "It is often better for comments to explain why something is done, not what the code is doing."
- **Counterexample — TigerBeetle TIGER_STYLE.md** (<https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md>), an extreme-discipline team whose written policy explicitly rejects the "no comments" reading: "Don't forget to say why. Code alone is not documentation. Use comments to explain why you wrote the code the way you did… write the code and comments to explain and justify the mental model to your reviewer." Enforcement: human review culture, not a ban.

### Teams that DO enforce "no comments" — and how

Real repos put the rule in **pre-loaded written policy (AGENTS.md / CONTRIBUTING-style files)** and back it with review/CI gates:

- **CapSoftware/Cap `AGENTS.md`** (<https://github.com/CapSoftware/Cap/blob/main/AGENTS.md>) — "Pre-Generation Invariants (read BEFORE writing any code)… emit code in the correct shape the FIRST time":
  > "**Default to no code comments.** Add a comment only after solving a bug or working through a complex issue, and only when it captures non-obvious context that a future investigator or reviewer genuinely needs… Bad cases that remain banned: narrating what the code does, restating types, JSDoc that paraphrases parameter names, 'TODO: refactor'… When in doubt, prefer better naming/types over a comment. Applies to every language: Rust, TS, JS, Python, shell, SQL, TOML, etc." — plus "These rules are enforced by CI (`cargo clippy -D warnings`, Biome)."
- **werf/werf `AGENTS.md`** (CNCF project, <https://github.com/werf/werf/blob/main/AGENTS.md>) — "All rules in this document are requirements — not suggestions": "NEVER add comments unless they document a non-obvious public API or explain genuinely non-obvious logic. NEVER add comments that restate what the code does… When in doubt, don't comment." (Section is generated from CODESTYLE.md.)
- **EverMind-AI/Raven `AGENTS.md`** (<https://github.com/EverMind-AI/Raven/blob/main/AGENTS.md>) — "§1.1 Top rule: don't add comments unless necessary… Match the style of surrounding lines. If neighboring code has no comments, **don't** add one to your new line," backed by an *automated* gate: "Machine enforcement: `scripts/check_source_language.py` gates every PR's added lines."
- **heuwels/lector PR #515, "docs(agents): add a code-comment rule"** (<https://github.com/heuwels/lector/pull/515>) — a team that added a `## Code Comments` section to AGENTS.md and documented the process. Rationale: "Agent-written comments in this repo argue, narrate the change that produced them, and repeat what the code already says… The cost is not the wasted lines. It is that a reader learns to skip comments, so the few that carry a real constraint get skipped as well." The rule: "**It inverts the default.** Write no comment. Then justify each one against a single test: delete it, and ask whether a competent reader can still get the code right." Also notable: "**It does not ask for a cleanup.** It applies to comments an agent writes or changes" — pre-loading-at-write-time, post-hoc sweep separate.
- **withastro/astro `AGENTS.md`** (<https://github.com/withastro/astro/blob/296e1b03/AGENTS.md>) — a "Writing Comments" rule set plus a dedicated skill: "Deletion test: a comment must state something the reader cannot recover from the code… Full guidance with examples: `.agents/skills/writing-comments/SKILL.md`." (Rule-as-AGENTS.md + rule-as-skill, both pre-loaded.)

**Verdict for Q3:** published commentary argues *why* (comments rot/lie; code should be self-explanatory) but describes enforcement as either (a) pre-loaded written policy (style guides, AGENTS.md "read before writing" sections) or (b) review/audit gates (human code review; in agent workflows, CI lint or a spawned reviewer). No prominent team claims a purely pre-loaded rule with no gate; the repos above that pre-load also bolt on CI or PR gates.

## 4. Evidence: does a comment policy loaded into context at coding time change agent output?

No study isolates "comment policy at coding time" against post-hoc audit. The nearest evidence:

**Instructions loaded at coding time DO change agent behavior — but net task effect is marginal/negative.**
- **"Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?"** (arXiv:2602.11988, later MSR '26, DOI 10.1145/3793302.3793350, <https://arxiv.org/abs/2602.11988>): "Behaviorally, both LLM-generated and developer-provided context files encourage broader exploration (e.g., more thorough testing and file traversal), and coding agents tend to **respect their instructions**." But: "context files tend to reduce task success rates compared to providing no repository context, while also increasing inference cost by over 20%" (LLM-generated files; developer-written ones give "a marginal performance gain"); conclusion: "**unnecessary requirements from context files make tasks harder, and human-written context files should describe only minimal requirements.**" I.e., a comment ban is *obeyed* (behavior change) but adds instruction load whose task-level payoff is unproven.
- **"Agent READMEs: An Empirical Study of Context Files for Agentic Coding"** (TOSEM 2025, arXiv:2511.12884, <https://arxiv.org/html/2511.12884v2>): first large-scale study of 2,303 context files (CLAUDE.md/AGENTS.md/copilot-instructions.md). Code-style guidance is a top category: "Implementation Details (70.8%) with development guidance (e.g., code style)." Confirms teams *do* use pre-loaded context files for exactly this kind of norm, and maintain them "like configuration code." It measures content, not compliance.

**Comments already in context change what LLMs generate — in both directions (±17-21% pass@1).**
- **"Talking to Itself While Coding: What Makes Comments Help Code Generation?"** (arXiv:2609.09242, Findings of EMNLP 2026, <https://arxiv.org/abs/2609.09242>): "Comments from source solutions that pass the tests raise recipient pass@1 by 17.2% on average. In contrast… comments written for a different problem reduce pass@1 by 20.8%… comments help code generation not merely because they are comments, but because they can provide correct solution content." — Comments in the generation context are *causal* for output; the same mechanism predicts a prohibition text (or absence of exemplar comments) steers output, though the paper tested informative comments, not prohibition prose.
- **"When Comments Mislead: An Empirical Study of Outdated Comments in LLM-Based Code Completion"** (artifact, DOI 10.5281/zenodo.19249395): outdated comments bias completion "toward historical implementations" vs updated/no-comment conditions — the empirical backbone of the "comments lie to agents" claim.
- **"On the Impact of Code Comments for Automated Bug-Fixing"** (arXiv:2601.23059): comments at inference improve bug-fixing up to ~3x EM; training with comments is neutral when comments are absent at inference.

**Practitioner position (pstack author) — why the gate, not just the rule.**
- **Lauren Tan (@poteto), X post, Oct 13 2026** (<https://nitter.rdrama.net/poteto/status/2110230228081766860>): "ban and delete most if not all code comments! agents love copying what already exists. a seemingly harmless comment explaining some temporary workaround is one of the worst viruses you can have in your codebase… you can use pstack's /no-comments skill as a weedkiller." Her mode-level rule ("write them clean as you go") covers new code; the audit handles what agents produced anyway.
- **Anthropic, "Equipping agents for the real world with Agent Skills"** (Oct 16, 2025, <https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills>) defines the load mechanism any pre-loaded skill depends on: "At startup, the agent pre-loads the `name` and `description` of every installed skill into its system prompt… If Claude thinks the skill is relevant to the current task, it will load the skill by reading its full `SKILL.md` into context." **agents.md spec** (<https://agents.md>): AGENTS.md is read at session start ("Agents automatically read the nearest file in the directory tree"), lists "Code style guidelines" as a popular section, and "the agent will attempt to execute relevant programmatic checks and fix failures before finishing the task" — the platform-level affordance for pre-loaded policy + automated gates.

**Verdict for Q4:** the mechanism is real (agents follow instructions in context; comments in context move generated code), but *proven* is too strong a word for pre-loading alone: the one controlled study of context files finds instruction-following with marginal-to-negative net task effect and warns to keep context files minimal; the ecosystem's own answer to "will the agent police its own comments?" is an independent post-hoc reviewer. The hybrid (pre-load the rule, gate with an audit) is what pstack, Cap, Raven, and werf actually ship.

## 5. Synthesis

1. **No-comments-as-a-skill converges on post-hoc audit**: 4/5 skills.sh no-comments skills (pstack, rstack, riffingonsoftware, shipshitdev) are user-invoked, fresh-reviewer workflows; all use variants of "defer to a fresh perspective / an author defends its comments." The single writing-time-rule skill (ctxr-dev) is recent, standalone, and auto-invocable by description — the counter-pattern that has not yet propagated to the big stores.
2. **The hybrid is the mature pattern**: pre-load a terse written rule into the coding context (pstack poteto-mode "Comments" section; Cap "read BEFORE writing any code"; werf "MANDATORY"; astro "Writing Comments") AND run a post-hoc audit gate before review/merge (pstack `/no-comments` + Comment Sicko; Raven CI gate; Cap clippy/Biome). The audit exists because the same agent that wrote the code is judged not independent; pstack says so literally.
3. **Evidence status**: instruction-loading changes behavior (arXiv:2602.11988) and comments-in-context change generated code by ±17-21% pass@1 (arXiv:2609.09242), but no study demonstrates that pre-loaded comment policy *alone* beats post-hoc audit on any measured outcome; the one controlled context-file study actually cautions that extra requirements can hurt. "Proven working pattern" is therefore: *pre-loading is proven to change output; post-hoc audit is the proven enforcement backstop; teams ship both.*
4. **Local environment context**: this very machine mirrors the hybrid — `~/.agents/skills/comment-discipline/SKILL.md` is a trigger-by-description writing-time skill ("Use when writing new code or editing existing code… names, structures, and types carry the meaning first"), while `~/.agents/skills/no-comments/SKILL.md` is `disable-model-invocation: true` and spawns `comment-sicko` for an independent post-hoc pass. The comment-discipline SKILL.md states the boundary explicitly: "Cleaning up comments in existing code is a different job: run the `no-comments` skill."

## Sources

**Repos / files (primary):**
- cursor/plugins → pstack: `skills/no-comments/SKILL.md`; `agents/comment-sicko.md`; `skills/poteto-mode/SKILL.md`; `docs/guide/05-build-and-clean.md`; `README.md`; `plugin.json` — <https://github.com/cursor/plugins/tree/main/pstack>
- ctxr-dev/no-comments SKILL.md — <https://raw.githubusercontent.com/ctxr-dev/no-comments/HEAD/SKILL.md>; <https://www.skills.sh/ctxr-dev/no-comments/no-comments>
- skills.sh entries: ryanditjia/rstack, riffingonsoftware/agent-skills, shipshitdev/skills, cursor/plugins — <https://www.skills.sh/…> (URLs in §2 table)
- anthropics/skills — <https://github.com/anthropics/skills>; ComposioHQ/awesome-claude-skills — <https://github.com/composiohq/awesome-claude-skills>
- CapSoftware/Cap AGENTS.md — <https://github.com/CapSoftware/Cap/blob/main/AGENTS.md>; werf/werf AGENTS.md — <https://github.com/werf/werf/blob/main/AGENTS.md>; EverMind-AI/Raven AGENTS.md — <https://github.com/EverMind-AI/Raven/blob/main/AGENTS.md>; withastro/astro AGENTS.md — <https://github.com/withastro/astro/blob/296e1b03/AGENTS.md>; heuwels/lector PR #515 — <https://github.com/heuwels/lector/pull/515>
- TigerBeetle TIGER_STYLE.md — <https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md>
- agents.md spec — <https://agents.md>; pstack Claude Code port load-costs — <https://www.claudepluginhub.com/skills/michael-denyer-pstack-plugins-pstack/no-comments>

**Docs / blogs:**
- Anthropic, "Equipping agents for the real world with Agent Skills" (2025-10-16) — <https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills>
- Jeff Atwood, "Coding Without Comments" (2008-07-24) — <https://blog.codinghorror.com/coding-without-comments/>
- Lassi Autio, "Comments Lie!" (2019) — <https://lassiautio.com/2019/03/19/comments-lie/>
- Stacey Vetzal, "Lies, Damned Lies, and Code Comments" (2015) — <https://stacey.vetzal.ca/2015/2015-02-03-code-comments/>
- Google Testing Blog, "Let Code Speak for Itself" (2023-12) — <https://testing.googleblog.com/2023/12/let-code-speak-for-itself.html>; Google Go style guide — <https://google.github.io/styleguide/go/guide.html>
- Lauren Tan (@poteto) X post on comments/agents — <https://nitter.rdrama.net/poteto/status/2110230228081766860>

**Studies:**
- "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?" — arXiv:2602.11988 / DOI 10.1145/3793302.3793350
- "Agent READMEs: An Empirical Study of Context Files for Agentic Coding" (TOSEM 2025) — arXiv:2511.12884 / DOI 10.1145/3840295
- "Talking to Itself While Coding: What Makes Comments Help Code Generation?" (Findings of EMNLP 2026) — arXiv:2609.09242
- "When Comments Mislead: An Empirical Study of Outdated Comments in LLM-Based Code Completion" — DOI 10.5281/zenodo.19249395
- "On the Impact of Code Comments for Automated Bug-Fixing" — arXiv:2601.23059
