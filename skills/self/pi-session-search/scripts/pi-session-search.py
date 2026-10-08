#!/usr/bin/env python3
"""Search pi session logs (JSONL, one event per line) UTF-8-safe.

Usage:
  pi-session-search.py "pattern"                        file-level report (default)
  pi-session-search.py "pattern" --show N               ... with N snippet lines per hit
  pi-session-search.py --json "pattern"                 event-level structured report
  pi-session-search.py --json --role assistant "pat"    filter by message role
  pi-session-search.py --json --tool subagent "pat"     filter by tool-call name
  pi-session-search.py --json --tool subagent --field k=v "pat"   field filter (see below)
  pi-session-search.py --root DIR "pattern"             custom sessions root

Field filter semantics: with --tool, k=v is checked against that tool call's
arguments (k must exist as a key, v a substring of the serialized value); without
--tool, against the serialized event. Use an empty value (--field model=) to test
key existence only.

Searches every *.jsonl under the root (default ~/.pi/agent/sessions). Output is
capped; narrow with filters rather than widening the scan.
"""

import argparse
import json
import os
import sys

DEFAULT_ROOT = os.path.expanduser("~/.pi/agent/sessions")
MAX_FILES = 50          # file-level: files listed per report
MAX_EVENTS = 200        # json mode: event lines printed
MAX_OUTPUT_BYTES = 40000  # any mode: hard byte cap (well under the 50KB bash truncation)
SNIPPET_LEN = 300       # truncated content snippet length


def tool_calls(ev):
    """Yield toolCall dicts (with name/arguments) found in an event's parts."""
    for part in (ev.get("message", {}).get("content", []) or []):
        if isinstance(part, dict) and part.get("type") == "toolCall":
            yield {"name": part.get("name") or part.get("toolCall", {}).get("name"),
                   "arguments": part.get("arguments")
                                if "arguments" in part
                                else part.get("toolCall", {}).get("arguments", {})}


def field_ok(ev, k, v, tool):
    """k=v check: with tool, against that tool call's arguments; else whole event."""
    def blob_has(blob):
        try:
            as_dict = json.loads(blob) if isinstance(blob, str) else blob
        except json.JSONDecodeError:
            as_dict = None
        if isinstance(as_dict, dict) and k not in as_dict:
            return False
        return v in json.dumps(blob, ensure_ascii=False)

    if tool is not None:
        for tc in tool_calls(ev):
            if tc["name"] == tool and blob_has(tc["arguments"]):
                return True
        return False
    return blob_has(ev)


def event_filter(args):
    """Return a predicate (event dict -> bool) from --role/--tool/--field."""
    def ok(ev):
        if args.role is not None:
            if ev.get("message", {}).get("role") != args.role:
                return False
        if args.tool is not None:
            if not any(tc["name"] == args.tool for tc in tool_calls(ev)):
                return False
        if args.field is not None:
            k, sep, v = args.field.partition("=")
            if sep != "=":
                sys.exit(f"error: --field needs k=v, got {args.field!r}")
            if not field_ok(ev, k, v, args.tool):
                return False
        return True
    return ok


def snippet(ev: dict) -> str:
    """Human-readable one-line preview of an event (list of markers)."""
    ts = str(ev.get("timestamp", ""))[:19] or ev.get("id", "?")
    role = ev.get("message", {}).get("role", ev.get("type", "event"))
    parts = ev.get("message", {}).get("content", []) or []
    markers = []
    text = ""
    for p in parts:
        if not isinstance(p, dict):
            continue
        t = p.get("type")
        if t == "text":
            text = " ".join(p.get("text", "").split())
        elif t == "thinking":
            text = text or " ".join((p.get("thinking") or p.get("content") or "").split())
        elif t == "toolCall":
            name = p.get("name") or p.get("toolCall", {}).get("name")
            arguments = p.get("arguments") if "arguments" in p else p.get("toolCall", {}).get("arguments", {})
            if isinstance(arguments, dict):
                arguments = json.dumps(arguments, ensure_ascii=False)
            markers.append(f"toolCall {name} {str(arguments)[:120]}")
        elif t == "toolResult":
            markers.append(f"toolResult {ev.get('message', {}).get('toolName', '')}".rstrip())
    line = "; ".join(markers) if markers else text
    return f"{ts} [{role:<9}] {line[:SNIPPET_LEN]}"


def contains_pattern(line: str, pattern: str) -> bool:
    return pattern in line


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("pattern", nargs="+", help="text to search for (use \"\" to match all)")
    ap.add_argument("--json", action="store_true", help="event-level structured output")
    ap.add_argument("--role", help="filter JSON events by message role")
    ap.add_argument("--tool", help="filter JSON events by tool-call name")
    ap.add_argument("--field", help="filter by k=v (with --tool: on that call's arguments)")
    ap.add_argument("--show", type=int, default=0, help="file mode: snippet lines per hit file")
    ap.add_argument("--root", default=DEFAULT_ROOT, help="sessions root")
    args = ap.parse_args()
    pattern = " ".join(args.pattern)

    if not os.path.isdir(args.root):
        sys.exit(f"error: sessions root not found: {args.root}")

    if args.json and not (args.role or args.tool or args.field):
        sys.exit("error: --json needs at least one filter (--role/--tool/--field)")

    budget = {"bytes": 0}

    def emit(line):
        """Print a line into the shared byte budget; return False when over."""
        budget["bytes"] += len(line.encode("utf-8"))
        print(line)
        return budget["bytes"] <= MAX_OUTPUT_BYTES

    predicate = event_filter(args)
    hits = []  # (file, [event-or-None per matching line])
    for dirpath, _dirs, files in os.walk(args.root):
        for name in sorted(files):
            if not name.endswith(".jsonl"):
                continue
            path = os.path.join(dirpath, name)
            file_hits = []
            with open(path, encoding="utf-8", errors="replace") as fh:
                for line in fh:
                    if pattern and not contains_pattern(line, pattern):
                        continue
                    if args.json:
                        try:
                            ev = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        if not predicate(ev):
                            continue
                        file_hits.append(ev)
                    else:
                        file_hits.append(None)
            if file_hits:
                hits.append((path, file_hits))
            if not args.json and len(hits) >= MAX_FILES:
                break

    if args.json:
        printed = 0
        capped = False
        for path, file_hits in hits:
            for ev in file_hits:
                if not emit(f"{os.path.relpath(path, args.root)}: {snippet(ev)}"):
                    capped = True
                    break
                printed += 1
                if printed >= MAX_EVENTS:
                    break
            if capped or printed >= MAX_EVENTS:
                break
        if capped:
            print(f"... (output capped at {MAX_OUTPUT_BYTES // 1024}KB; narrow the query)")
        elif printed >= MAX_EVENTS:
            print(f"... ({printed} events shown; narrow the query)")
        else:
            print(f"{printed} events in {len(hits)} file(s)")
    else:
        if not hits:
            print("no hits")
            return
        from collections import OrderedDict
        by_dir = OrderedDict()
        for path, file_hits in hits:
            by_dir.setdefault(os.path.dirname(path), []).append((path, len(file_hits)))
        total_lines = sum(n for items in by_dir.values() for _, n in items)
        capped = False
        for d, items in by_dir.items():
            if not emit(f"== {os.path.basename(d)} =="):
                capped = True
                break
            for path, n in items:
                if not emit(f"  {os.path.basename(path)}  ({n} hit lines)"):
                    capped = True
                    break
                if args.show:
                    broke = False
                    for ev in sample_snippets(path, pattern, args.show):
                        if not emit(f"      {snippet(ev)}"):
                            capped = True
                            broke = True
                            break
                    if broke:
                        break
            if capped:
                break
        if capped:
            print(f"... (output capped at {MAX_OUTPUT_BYTES // 1024}KB; narrow the query)")
        else:
            print(f"{len(hits)} file(s), {total_lines} hit line(s)")


def sample_snippets(path, pattern, n):
    """Re-open a file and yield up to n snippet events matching the pattern."""
    out = []
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if pattern and pattern not in line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            out.append(ev)
            if len(out) >= n:
                break
    return out


if __name__ == "__main__":
    main()