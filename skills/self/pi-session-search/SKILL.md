---
name: pi-session-search
description: >-
  Search pi session logs (~/.pi/agent/sessions JSONL) for past-run content —
  phrases, tool calls, thinking passages, fields — or read the log format
  itself. Use when the agent must dig through past sessions: retro
  archaeology, debugging "it happened in an earlier run", tracing a behavior
  change across sessions.
---

# Pi session search

The one command that finds past-session content, replacing ad-hoc grep/python archaeology.

## Steps

### 1. Confirm the sessions root

```bash
echo "$PI_SESSION_FILE"   # current session; its dirname's parent is the root
ls ~/.pi/agent/sessions   # the root (default)
python scripts/pi-session-search.py --root DIR "pattern"   # point at a custom root
```

Done when: you know the root path — `~/.pi/agent/sessions` by default, or the `--root DIR` you pass for a run that used its own `--session-dir`.

### 2. Full-text file-level search

```bash
python scripts/pi-session-search.py "pattern"          # relative to this skill's dir
```

Output: hit list grouped by repo directory, each file with a hit count and a UTC timestamp spanning the session. Filenames sort newest-last (UTC timestamps prefix them).

Done when: you can name every session file containing the pattern, or state confidently that none do (an empty report means no hit).

### 3. Structured queries (`--json`)

`--json` requires at least one filter (`--role` / `--tool` / `--field`); add a pattern as the last positional (`""` matches all).

```bash
python scripts/pi-session-search.py --json --role assistant "pattern"          # a role
python scripts/pi-session-search.py --json --role assistant --tool subagent "" # tool-call events only
python scripts/pi-session-search.py --json --tool subagent --field "model=" "" # args with a model key (any value)
python scripts/pi-session-search.py --json --tool subagent "sensenova-6.8"     # call args containing the text
python scripts/pi-session-search.py --show 5 "pattern"                          # file mode: 5 snippets per hit file
```

Each event line prints: timestamp, role, event type, the tool name (for tool calls), and a truncated content snippet.

Done when: your question maps to a named filter, and the output answers it — e.g. "the subagent calls in that session carried `model` 0/4 times".

### 4. Drill into a hit

Once you know the file, open it where the hit was:

```bash
grep -n "pattern" ~/.pi/agent/sessions/--C--Users-Hue-Repos-<repo>--/<session>.jsonl
```

Done when: you have read the surrounding lines in context.

## Reference: environment facts

- **Session dirs start with `--`** (they encode the cwd, e.g. `--C--Users-Hue-Repos-foo--`). `ls -d */`, `for f in $(ls -d */)`, and `du */20*.jsonl` misparse them as options — use the script, or `find`/`rg` with an explicit `./` or `--` separator.
- **JSONL, one event per line**: `type` is `session` | `message` | `model_change` | `thinking_level_change` | `custom_message` | ... A message event's body is `message.role` + `message.content[]` (parts of type text / thinking / toolCall). Tool calls live in assistant `content[]` parts with `type: "toolCall"`; tool results are their own events (`message.role == "toolResult"`) carrying the returned text — event-level `details` is not written.
- **Thinking-level evidence has two landing spots**: the *requested* level in a `set-thinking-level` toolCall's `arguments.level`; the *applied* session level in a `thinking_level_change` event (plain `thinkingLevel` field).
- **Python prints Chinese correctly (PYTHONUTF8 active)** — no wrapper boilerplate needed.
- **Scale**: hundreds of JSONL files, ~150 MB total. A full-scan python run is seconds; `rg` is faster for pure text.
- **Output is capped**; narrow with filters or `--show N` rather than widening the scan.