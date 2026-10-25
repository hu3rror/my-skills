# Sub-agent tooling in mainstream coding assistants (as of 2026)

Research question: is a skill instruction like *"spawn a sub-agent to audit code comments, giving it a rules file as its instructions"* portable across mainstream coding assistants? For each harness: (a) can it spawn an independent sub-agent with a **custom instruction set / custom system prompt** (not just fixed bundled roles)? (b) is the call **blocking** (returns full result) or **background**?

**Bottom line:** every mainstream harness surveyed — Claude Code, Cursor, OpenAI Codex, Gemini CLI, Roo Code, OpenCode, Google Antigravity — has a first-class, documented sub-agent mechanism with user-authored instruction sets, and pi gets one via extensions (`pi-subagents`, `pi-matt-subagent`). The pattern is portable in substance; the *syntax* and the *blocking/background default* differ per harness. Aider is the one mainstream exception (no sub-agents; architect/editor is a different, fixed two-model mechanism). No official cross-harness statement "most harnesses now have a sub-agent tool" exists; the closest widely-cited sources are a 2026 survey of 28 harnesses, a Jan-2026 practitioner essay ("most harnesses … out of the box already"), and per-harness official release announcements.

---

## 1. Claude Code (Anthropic) — YES, both blocking and background

Docs: https://code.claude.com/docs/en/sub-agents

- **Custom instruction set: yes.** "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions." Custom subagents are Markdown files with YAML frontmatter; "the body becomes the system prompt… Subagents receive only this system prompt plus basic environment details like the working directory, not the Claude Code system prompt." Locations: `.claude/agents/` (project, version-controllable), `~/.claude/agents/` (user), plugins, managed settings, and a `--agents` JSON flag for session-scoped definitions. Frontmatter: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `isolation: worktree`.
- **Blocking or background: both, and the default is background.** "Foreground subagents block the main conversation until complete." "Background subagents run concurrently while you continue working." "With nothing configured, a subagent that Claude spawns from your main conversation starts in the background." A background subagent's results reach Claude "as a completion notification in a later turn"; the parent sees "only the summary."
- **Task/Agent tool:** the Task tool was renamed to Agent in v2.1.63 (`Task(...)` still aliases). A subagent returns a summary of its work; spawning is done by the model via the Agent tool (with `tools: Agent(name)` allowlists), @-mention, or natural language.
- **Agent Skills (a different mechanism):** skills are reusable prompt workflows that run in the main context; a skill can opt to run inside a subagent (`context: fork`), and a subagent definition can preload skills via the `skills:` frontmatter field. So "give it a rules file as instructions" maps to the subagent's markdown body (its system prompt) or to skill content preloaded into the subagent.

## 2. Cursor — YES, both blocking and background

Docs: https://cursor.com/docs/subagents , https://cursor.com/docs/agent/overview

- **Custom instruction set: yes.** Custom subagents are Markdown files with YAML frontmatter in `.cursor/agents/` (project; also accepts `.claude/agents/` and `.codex/agents/` compatibility dirs) or `~/.cursor/agents/` (user); the body after frontmatter is the subagent prompt. Fields: `name`, `description`, `model` (`inherit` or a specific ID), `readonly`, `is_background`. Built-ins: Explore and Browser (https://cursor.com/docs/subagents — "Cursor includes two built-in subagents…"). "Agent is built on three components: Instructions (the system prompt and rules)…" — custom prompts are supported for agents/modes generally.
- **Blocking or background: both.** "Foreground — Blocks until the subagent completes. Returns the result immediately." "Background — Returns immediately. The subagent works independently." `is_background: true` makes a subagent run without blocking. Parallel: "Agent sends multiple Task tool calls in a single message, so subagents run simultaneously."
- Project mode (coordinator agent that "plans the work and delegates it to other agents") is a separate feature; side chats are not subagents.

## 3. OpenAI Codex CLI — YES (subagent workflows on by default), orchestration waits for results

Docs: https://learn.chatgpt.com/docs/agent-configuration/subagents

- **Custom instruction set: yes.** "Current Codex releases enable subagent workflows by default." Built-ins: `default`, `worker`, `explorer`. Custom agents are TOML files in `~/.codex/agents/` or `.codex/agents/`, each requiring `name`, `description`, `developer_instructions` (the agent's core instructions), with optional `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`. "Current local Codex releases delegate when you ask directly or when applicable `AGENTS.md` or skill instructions request it."
- **Blocking or background:** subagents run as separate "agent threads" (inspectable/steerable); "When many agents are running, Codex waits until all requested results are available, then returns a consolidated response." Whether to wait is prompt-controlled: "A good subagent prompt should explain how to divide the work, whether Codex should wait for all agents before continuing…". Global settings: `[agents] enabled` (default true), `max_concurrent_threads_per_session`, `default_subagent_model`, `default_subagent_reasoning_effort`, `interrupt_message`.

## 4. Gemini CLI — YES, synchronous tool-call style; async/background still an open feature request

Docs: https://geminicli.com/docs/core/subagents/ ; announcement: https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli/ (Apr 2026, v0.38.1)

- **Custom instruction set: yes.** "Subagents are exposed to the main agent as a tool of the same name. When the main agent calls the tool, it delegates the task to the subagent." Custom subagents are Markdown files with YAML frontmatter in `.gemini/agents/*.md` (project) or `~/.gemini/agents/*.md` (user) — "the body of the markdown file becomes the agent's System Prompt." Frontmatter: `name`, `description`, `kind` (local/remote), `tools` (with wildcards), `mcpServers`, `model`, `temperature`, `max_turns`, `timeout_mins`. Built-ins: `codebase_investigator`, `cli_help`, `generalist`, `browser_agent` (experimental). Subagents cannot call subagents (recursion protection). Manage via `/agents`.
- **Blocking or background:** documented behavior is a synchronous delegation that "reports back to the main agent with its findings"; parallel subagents are supported. Async/background execution is *not* yet shipped: tracked as open issues "Async & Background Execution of subagents" (#17754) and "Local agents can be started async" (#17757) on google-gemini/gemini-cli.

## 5. Aider — different mechanism; no sub-agent tool

Docs: https://aider.chat/docs/usage/modes.html , https://aider.chat/2024/09/26/architect.html

- Architect/editor mode is a fixed two-model pipeline inside one chat turn: "aider sends your requests to two models": the main model acts as architect proposing a solution, then an "editor model" turns the proposal into specific file edits. Roles are chosen per request (`--architect`, `--editor-model`), not user-authored custom instruction sets, and there is no independent spawned context — "this uses two LLM requests" in sequence within the same turn.
- Core aider has **no sub-agent mechanism**: multi-agent/sub-agent support is an open feature request (https://github.com/Aider-AI/aider/issues/4428, created 2025-08-08, referencing Gemini CLI's sub-agent system as inspiration). (AiderDesk, a third-party GUI wrapper, implements its own subagents — distinct from aider core.)

## 6. Other mainstream harnesses with documented sub-agent tools

- **Roo Code** (VS Code): built-in `🪃 Orchestrator` (Boomerang) mode delegates to subtasks via the `new_task` tool; each subtask runs in a different specialized mode with its own conversation history; "Parent tasks are paused during subtask execution and resumed when the subtask completes, with results transferred back to the parent" (blocking). Custom modes (user-authored `roleDefinition` + `customInstructions` and tool groups) provide the custom instruction sets. https://docs.roocode.cn/features/boomerang-tasks , https://roocodeinc.github.io/Roo-Code/advanced-usage/available-tools/new-task/
- **OpenCode**: `mode: subagent` agents defined in `opencode.json` or Markdown files in `.opencode/agents/` / `~/.config/opencode/agents/` (file name = agent name, body = prompt); invoked by the model via the Task tool, with `permission.task` allow/deny globs and `hidden` subagents; primary agents can also invoke subagents directly. Blocking/background both: the Task tool takes `background=true` — "launches the subagent asynchronously and returns immediately. Foreground is the default; use it when you need the result before continuing" (from source `packages/opencode/src/tool/task.ts`; feature is gated behind `experimentalBackgroundSubagents`). https://opencode.ai/docs/agents/
- **Google Antigravity CLI**: "asynchronous subagents framework"; parent calls the `invoke_subagent` tool (or defines transient ones via `define_subagent`); "Subagents run asynchronously in the background"; custom subagents are Markdown files with YAML frontmatter (`name`, `description`, `tools`, `model`, `commandExecutionPolicy`, `mcpServers`, `skills/plugins`); nesting depth capped at 10. https://antigravity.google/docs/subagents/
- **pi** (the local harness): sub-agent tooling is **not in pi core** — it comes from extensions. `pi-subagents` (~558K downloads/mo, v0.82) registers a `subagent` tool with an `async` parameter and built-in agents (`reviewer`, `worker`, `scout`, `researcher`, `evidence-auditor`, `oracle`, `delegate`) — https://pi.dev/packages/pi-subagents , tool reference https://cdn.jsdelivr.net/npm/pi-subagents@0.80.0/docs/tool-reference.md. `pi-sub-agent` (v0.1.5) registers a `subagent` tool (single/parallel/chain) running `pi --mode json` child subprocesses, plus user agents from `~/.pi/agent/agents/*.md` and project agents from `.pi/agents/*.md` — https://pi.dev/packages/pi-sub-agent. The local `pi-matt-subagent` v0.14.2 (installed in `~/.pi/agent/npm/node_modules/`) provides `subagent` (blocking, single/parallel/chain) + `research` (background) tools with seven bundled roles including `comment-sicko` ("a report-only comment audit for the no-comments workflow"); user agents from `~/.pi/agent/agents/` and project agents from `.pi/agents/` override bundled roles by name.

## 7. Cross-harness statements ("most harnesses have a sub-agent tool" vs "pi-specific")

- **No official cross-harness statement exists** (no vendor claims to speak for "most harnesses"). Official statements are per-harness: Anthropic's sub-agents doc; Google's Developers Blog "Subagents have arrived in Gemini CLI" (https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli/, Apr 2026); OpenAI/ChatGPT Learn subagents doc; Cursor subagents doc; Google Antigravity docs.
- **Widely-cited "most harnesses" claim (third-party):** "Subagent Utilization — Use subagents. If you are not already doing it yourself, I'm pretty sure most harnesses actually have started to do this out of the box already" — *State of AI Assisted Workflows*, Handmade Oasis, Jan 2026 (https://handmadeoasis.com/state-of-ai-assisted-workflows-january-2026/). Supporting survey: *AI Coding-Agent Primitives*, Hermosa AI, 2026 — "Compare 62 coding-agent capabilities across 28 tools, including plan mode, subagents…" (https://hermosaai.com/research/ai-primitives). Sebastian Raschka's *Components of a Coding Agent*: "Claude Code has supported subagents for a long time, and Codex added them more recently" (https://magazine.sebastianraschka.com/p/components-of-a-coding-agent).
- **The "pi-specific" opposite is contradicted, not supported:** Anson Biggs, *How Subagents are Built* (2026): "pi.dev/ doesn't ship with subagents. Pi is a really incredible agent harness… By far the thing I miss the most is subagents" (https://notes.ansonbiggs.com/how-subagents-are-built/). I.e., sub-agents were *missing* from pi natively (hence the third-party extensions above), while every other surveyed harness ships them.

## Portability mapping for the skill instruction

"Spawn a sub-agent to audit code comments, giving it a rules file as its instructions" maps as follows:

| Harness | Custom instructions via | Blocking / background |
| --- | --- | --- |
| Claude Code | subagent markdown body (system prompt) in `.claude/agents/`; preloaded skills (`skills:`) | both; default = background |
| Cursor | `.cursor/agents/*.md` body (subagent prompt) | both; `is_background: true` for background |
| OpenAI Codex | `.codex/agents/*.toml` `developer_instructions` | parallel threads; waits for all results (prompt controls waiting) |
| Gemini CLI | `.gemini/agents/*.md` body (system prompt) | synchronous tool call; parallel; async = open request |
| Roo Code | custom modes (`roleDefinition`/`customInstructions`) + `new_task` message | blocking (parent paused until subtask completes) |
| OpenCode | `.opencode/agents/*.md` body or JSON `prompt` | foreground default; `background=true` async |
| Antigravity | custom subagent `.md` with frontmatter; `define_subagent` | asynchronous (background by design) |
| pi | extension tools (`pi-subagents` / `pi-matt-subagent` / `pi-sub-agent`); agent files `~/.pi/agent/agents/*.md`, `.pi/agents/*.md` | `subagent` blocking, `research`/`async` background |

**Caveats:** (1) every harness has its own file format, directory, and tool name — the instruction is portable as a *pattern*, not as verbatim tool calls; (2) blocking vs background defaults differ (Claude Code backgrounds by default; Cursor foreground by default; Codex/Gemini wait for reports; Roo blocking; Antigravity background); (3) a "rules file as instructions" is best expressed per-harness as the subagent definition file's body/system prompt or the task message, since that is what each harness treats as the subagent's instruction set; (4) pi requires installing an extension (not used by every pi install), so the instruction must state that dependency.
