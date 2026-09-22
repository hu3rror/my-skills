---
name: pi-extension-sync
description: "Sync a pi extension to the latest pi SDK: locate the installed pi + changelog, typecheck against real SDK types, triage breaking changes, fix with zero behavior change, verify tests, record ADRs."
disable-model-invocation: true
---

# Sync a pi extension to the latest pi SDK

Adapt an extension to the pi version currently installed (or the version the user names). The default posture is **zero behavior change**: this is a sync, not an upgrade project — every behavior-affecting change needs the user's sign-off.

## Steps

### 1. Locate the installed pi SDK and read its changelog

Find the `@earendil-works/pi-coding-agent` package directory:

- mise store layouts (check `~/.local/share/mise/installs/` on Linux/macOS, `%LOCALAPPDATA%\mise\installs\` on Windows):
  - `npm-earendil-works-pi-coding-agent/<ver>/node_modules/.mise/@earendil-works+pi-coding-agent@<ver>/node_modules/@earendil-works/pi-coding-agent`
  - legacy: `node/<node-ver>/node_modules/@earendil-works/pi-coding-agent`
- or resolve via the pi CLI: `Get-Command pi` / `mise which pi`, then walk up from the shim to the package.

Record the version from the package's `package.json`. If several versions are installed, ask the user which to target (default: the version pi currently runs).

Read `CHANGELOG.md` from the top: note Breaking Changes and any Added/Changed/Removed touching the extension surface (`registerTool`, `registerCommand`, `pi.on`, `modelRegistry`, `ctx.ui`, `@earendil-works/pi-ai` types).

**Done when**: pi version recorded; newest changelog entry read; breaking-change list noted.

### 2. Typecheck the extension against the real SDK types

The contract seam: only the real types catch SDK drift — behavioral tests against mocks cannot. Run the repo's own typecheck if it targets real types; otherwise create a throwaway tsconfig mapping the four packages to the installed pi packages (template in the Reference) and run `tsc --noEmit`.

Capture the full error list: count, per-file, per-category. This is the baseline red. If the repo has no typecheck gate, offer to keep the seam (tsconfig + a `typecheck` script) — adding devDependencies needs the user's confirmation.

Also verify the **runtime export surface** the extension uses: every `from "@earendil-works/..."` specifier (top-level, subpaths like `@earendil-works/pi-ai/compat`, deep imports like `@earendil-works/pi-tui/dist/word-navigation.js`) must still resolve against the target version — check the target packages' `exports` maps still list the subpaths, and that deep-imported files still exist in the target `dist`.

**Done when**: the complete error list is recorded; the export surface is verified.

### 3. Triage each error class

Map every error class to a decision: type-only fix, contract change, or behavior-affecting. The Reference table lists known classes from the 0.86.0-era breaking changes; the changelog and the real types override the table. Flag behavior-affecting classes — they change runtime behavior, not just types, and need the user's sign-off.

**Mirror-drift check (extensions that mirror pi internals)**: a green typecheck does not mean the extension's *runtime* semantics still match pi. Extensions that transcribe pi internals — retry/overflow classification tables, mirrored layout resolvers, copied `streamFn` wiring — must be diffed against the target version's actual dist sources (e.g. `pi-ai/dist/utils/retry.js`, `pi-ai/dist/utils/overflow.js`, `pi-tui/dist/tui.js`, `pi-coding-agent/dist/core/settings-manager.js`). Read the target changelog's **Changed and Fixed sections too, not just Breaking Changes** — semantic changes (0.86.0's 60s backoff cap) hide under Fixed. Line-number claims in comments/ADRs (`tui.js L781-902`) drift between versions: re-verify each against the target dist. Each drift is a behavior-affecting class needing the user's sign-off.

**Done when**: every error class has a fix decision; behavior-affecting classes (typecheck errors and mirror drift) are flagged; line-reference claims re-verified.

### 4. Fix with zero behavior change

Smallest change per class. No new features, no unrelated refactors; follow the repo's AGENTS.md (comment style, scope, dependency-confirmation rules). When a fix hides a real trade-off — e.g. tool error signaling: return-style `{ error }` details vs throw — surface it to the user and offer an ADR (step 6).

**Done when**: `tsc --noEmit` exits 0.

### 5. Verify tests

Run the repo's test command. If the test build fails for environment reasons (e.g. esbuild discovery), fix portability — but report it as test-infra work, separate from the SDK sync. Update tests where the contract changed: mock shapes must mirror the real SDK shapes the extension now uses; assertions retarget to the new contract.

**Done when**: the full suite is green; failures unrelated to the change are reported, not silently fixed.

### 6. Document

- ADR for real trade-offs, per the repo's ADR conventions (`docs/adr/`).
- CONTEXT.md glossary terms if new vocabulary crystallized (e.g. a tool result contract).
- README compatibility note (verified pi version) when the repo keeps one.

**Done when**: docs written per repo conventions.

### 7. Report

Per category: what changed, type-only vs runtime-affecting; mark unverified items `[NEEDS MANUAL VERIFICATION]`. State whether a release is warranted — but do not run one; releases follow the repo's release conventions.

**Done when**: the report lists every category with its type-only/runtime status.

## Reference

### Throwaway typecheck tsconfig

Use only when the repo lacks installed pi packages; with devDependencies installed, plain module resolution suffices. Map `paths` to the installed packages' type entries (pi-coding-agent and pi-ai: `dist/index.d.ts`; pi-tui: `dist/index.d.ts`; typebox: its `types` field, e.g. `build/index.d.mts`):

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": [],
    "allowImportingTsExtensions": true,
    "paths": {
      "@earendil-works/pi-coding-agent": ["<pi-pkg>/dist/index.d.ts"],
      "@earendil-works/pi-ai": ["<pi-ai-pkg>/dist/index.d.ts"],
      "@earendil-works/pi-tui": ["<pi-tui-pkg>/dist/index.d.ts"],
      "typebox": ["<typebox-pkg>/build/index.d.mts"]
    }
  },
  "include": ["<extension-source-files>"]
}
```

If `node:*` imports fail to resolve, drop `types: []` (auto-include @types/node from the pi install) or add an explicit `@types/node`.

Map **every** import specifier the extension uses, not just the four top-level packages — subpaths (`@earendil-works/pi-ai/compat` → `dist/compat.d.ts`) and deep imports (`@earendil-works/pi-tui/dist/word-navigation.js` → `dist/word-navigation.d.ts`) too. Unmapped subpaths resolve to the repo's own pinned version, producing false "dual-version type identity" errors (`Model` from 0.86.0 not assignable to `Model` from the repo's 0.84.2) that look like SDK drift. Grep all `from "@earendil-works/..."` specifiers and cover each.

### Known pi breaking-change classes (0.86.0-era — verify against the changelog)

| Class | Symptom | Fix |
|---|---|---|
| Model genericity | `Model` requires 1 type argument | use `Model<Api>` — the type `modelRegistry.getAll/getAvailable/find` return |
| Tool result contract | `details` required, `isError` not a member of `AgentToolResult`; `ToolResultMessage` is a conditional type | return `{ content, details }`; expected failures: error text in content + `details: { error: string }`; the harness derives `isError` only from throws, so a returned `isError` field is dead code |
| notify levels | `"warn"` not in the union | use `"warning"` (union is `"info" \| "warning" \| "error"`); unknown levels render as info at runtime |
| ui.custom typing | `ctx.ui.custom<T>` returns `Promise<T>`; wrapper return type mismatches | align the wrapper's declared return (null vs undefined) |
| pi.on | returns an unsubscribe function | ignoring it is fine |
| tool schema | tools without parameter schemas are rejected at registration | always provide a TypeBox `parameters` |
| JSON-only | `ToolCall.arguments` / `ToolResultMessage.details` restricted to JSON-compatible values | keep arguments and details JSON-compatible |

Non-breaking additions worth checking (optional, out of scope unless the user asks): `detectSupportedImageMimeTypeFromFile`, `modelRegistry.stream/streamSimple`, `resizeImage`.

## Related skills

- **npm-release** — when the extension is published as an npm package, a completed sync (especially one that bumps devDependencies or changes runtime behavior) is usually followed by a versioned release; hand over per that skill.
