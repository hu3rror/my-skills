#!/usr/bin/env bash
# Patch the newest installed pi so fullscreen-mode right-click paste works.
# pi updates overwrite the patch, so re-run this after any `pi` update.
# Idempotent: already-patched installs are left untouched.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SKILL_DIR/backups"

# Platform gate (compatibility: WSL-only, see SKILL.md): the win32 gate passes
# on native Windows, so the patch only matters on non-win32 hosts (WSL / Linux
# / SSH). Skip anywhere else instead of mis-patching a Windows mise install.
case "$(uname -s)" in
    Linux) ;;
    *) echo "not Linux — native Windows needs no patch (win32 gate passes); abort." >&2; exit 0 ;;
esac

MISE_INSTALLS="${HOME}/.local/share/mise/installs"
mkdir -p "$BACKUP_DIR"

# Root cause: pi-tui's TuiAltScreen.handleRightClickPaste() is gated on
# process.platform === "win32", so fullscreen right-click paste silently does
# nothing when the terminal forwards the right-click on a non-win32 host
# (Windows Terminal in WSL / WezTerm / SSH / VTE). Fix: remove the gate, keep
# the TERM_PROGRAM === "vscode" carve-out (#8186). Full rationale: SKILL.md.

# One regex per target form (minified bundle / pretty-printed dist) that
# matches the guard head in either historically seen state (original win32
# gate, or the earlier superseded WT_SESSION patch) and rewrites it to the
# gate-removed head; the following vscode carve-out line is left intact.
BUNDLE_REGEX='handleRightClickPaste\(event\)\{(?:let isWindowsTerminal=process\.env\.WT_SESSION!==undefined;if\(!this\.onRightClickPaste\|\|\(process\.platform!=="win32"&&!isWindowsTerminal\)\|\||if\(!this\.onRightClickPaste\|\|process\.platform!=="win32"\|\|)'
BUNDLE_REPL='handleRightClickPaste(event){if(!this.onRightClickPaste||'

DIST_REGEX='handleRightClickPaste\(event\) \{\n(?:        const isWindowsTerminal = process\.env\.WT_SESSION !== undefined;\n)?        if \(!this\.onRightClickPaste \|\|\n(?:            \(process\.platform !== "win32" && !isWindowsTerminal\) \|\||            process\.platform !== "win32" \|\|)'
DIST_REPL='handleRightClickPaste(event) {\n        if (!this.onRightClickPaste ||'

patch_file() {
    # $1 = file, $2 = regex, $3 = replacement, $4 = description
    local file="$1" regex="$2" repl="$3" desc="$4"
    if ! [ -f "$file" ]; then
        echo "  - $desc: not found ($file)"
        return 0
    fi
    local status backup
    backup="$BACKUP_DIR/$(basename "$file").orig"
    status="$(python3 - "$file" "$regex" "$repl" "$backup" <<'EOF'
import re, sys
path, pattern, repl, backup = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s = open(path, encoding="utf-8").read()
s2, n = re.subn(pattern, repl, s, count=1)
if n == 0:
    region = s[s.find("handleRightClickPaste") : s.find("handleRightClickPaste") + 300]
    print("already" if not re.search(r"process\.platform|isWindowsTerminal", region) else "nomatch")
    sys.exit(0)
if not __import__("os").path.exists(backup):
    __import__("shutil").copyfile(path, backup)
    print("backed-up")
open(path, "w", encoding="utf-8").write(s2)
print("patched")
EOF
)"
    case "$status" in
        *patched*) echo "  - $desc: ${status//$'\n'/; }";;
        *already*) echo "  - $desc: already patched (skip)";;
        *) echo "  - $desc: WARNING neither original nor WT_SESSION fragment found; leaving untouched ($file)";;
    esac
}

# Newest real versioned install only (mise aliases like 1.1 / latest are skipped).
latest_ver=""
for ver_dir in "$MISE_INSTALLS"/npm-earendil-works-pi-coding-agent/*/; do
    ver="$(basename "$ver_dir")"
    case "$ver" in
        [0-9]*.[0-9]*.[0-9]*) ;;
        *) continue ;;
    esac
    if [ -z "$latest_ver" ] || [ "$(printf '%s\n%s\n' "$ver" "$latest_ver" | sort -V | tail -1)" = "$ver" ]; then
        latest_ver="$ver"
    fi
done
if [ -z "$latest_ver" ]; then
    echo "no versioned pi-coding-agent install found under $MISE_INSTALLS"; exit 1
fi
echo "== pi-coding-agent $latest_ver (newest) =="

ver_dir="$MISE_INSTALLS/npm-earendil-works-pi-coding-agent/$latest_ver/"
pkg_dir="$(ls -d "$ver_dir"node_modules/.mise/@earendil-works+pi-coding-agent@*/node_modules/@earendil-works/pi-coding-agent 2>/dev/null | head -1 || true)"
if [ -z "$pkg_dir" ] || ! [ -d "$pkg_dir" ]; then
    echo "package dir not found; abort"; exit 1
fi

chunk="$(grep -lF "handleRightClickPaste(event){" "$pkg_dir"/dist/bundle/chunks/*.js 2>/dev/null | head -1 || true)"
if [ -n "$chunk" ]; then
    patch_file "$chunk" "$BUNDLE_REGEX" "$BUNDLE_REPL" "bundle chunk ($(basename "$chunk"))"
else
    echo "  - bundle chunk: handleRightClickPaste not found (layout differs)"
fi

tui_dist="$(ls -d "$ver_dir"node_modules/.mise/@earendil-works+pi-tui@*/node_modules/@earendil-works/pi-tui/dist/tui-alt-screen.js 2>/dev/null | head -1 || true)"
if [ -n "$tui_dist" ]; then
    patch_file "$tui_dist" "$DIST_REGEX" "$DIST_REPL" "pi-tui dist (tui-alt-screen.js)"
else
    echo "  - pi-tui dist: not installed separately (bundle is what runs; skip)"
fi

echo "== verification =="
if grep -qF 'process.platform!=="win32"||' "$pkg_dir"/dist/bundle/chunks/*.js 2>/dev/null; then
    echo "FAIL: old win32 gate still present in a bundle chunk"; exit 1
fi
if grep -qF "isWindowsTerminal=process.env.WT_SESSION" "$pkg_dir"/dist/bundle/chunks/*.js 2>/dev/null; then
    echo "FAIL: stale WT_SESSION patch marker still present in a bundle chunk"; exit 1
fi
echo "ok: bundle chunks clean of the old gate"
if [ -n "$tui_dist" ]; then
    if grep -qF 'process.platform !== "win32" ||' "$tui_dist" || \
       grep -qF "isWindowsTerminal = process.env.WT_SESSION !== undefined" "$tui_dist"; then
        echo "FAIL: old gate or stale WT_SESSION marker still present in pi-tui dist"; exit 1
    fi
    echo "ok: pi-tui dist clean of the old gate"
fi
if command -v node >/dev/null 2>&1; then
    for chunk in "$pkg_dir"/dist/bundle/chunks/chunk-*.js; do
        if [ -f "$chunk" ] && ! node --check "$chunk" >/dev/null 2>&1; then
            echo "WARN: node --check failed for $chunk"
        fi
    done
    if [ -n "$tui_dist" ] && ! node --check "$tui_dist" >/dev/null 2>&1; then
        echo "WARN: node --check failed for pi-tui dist"
    fi
fi
echo "done."