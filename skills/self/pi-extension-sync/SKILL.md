---
name: pi-extension-sync
description: "Sync a pi extension to the latest pi SDK (or an explicit target): resolve the target version, typecheck against real SDK types, triage breaking changes, fix with zero behavior change, survey new APIs for optional adoption, verify tests, record ADRs."
disable-model-invocation: true
---

# Sync a pi extension to the latest pi SDK

Adapt an extension to the **latest published pi version** by default, or to an explicit `target=<version>`. Two layers:

- **Compatibility layer** (steps 2–4): fix breaking changes with **zero behavior change** — every behavior-affecting fix needs the user's sign-off.
- **Adoption layer** (step 5): survey APIs/features added since the installed version; present each as a candidate with benefit, scope, and risk; adopt only what the user picks, one item at a time.

## Steps

### 1. Resolve the target version, locate the SDK, and read its changelog

Resolve `target` in this order: explicit `target=<version>` argument → else the latest published version (npm `dist-tags.latest` for `@earendil-works/pi-coding-agent`; cross-check GitHub releases). **Never** infer target from prior reports, prior syncs, CONTEXT.md, ADRs, git history, or installed devDependencies — the report is write-only.

Record the resolved version. If it equals the installed version, skip the fix loop (steps 3–4) but still run step 2's typecheck — the seam catches pre-existing repo debt, not just SDK drift — and run the adoption survey (step 5).

Locate the **installed** package (for the baseline comparison) via:

- mise store layouts (check `~/.local/share/mise/installs/` on Linux/macOS, `%LOCALAPPDATA%\mise\installs\` on Windows):
  - `npm-earendil-works-pi-coding-agent/<ver>/node_modules/.mise/@earendil-works+pi-coding-agent@<ver>/node_modules/@earendil-works/pi-coding-agent`
  - legacy: `node/<node-ver>/node_modules/@earendil-works/pi-coding-agent`
- or resolve via the pi CLI: `Get-Command pi` / `mise which pi`, then walk up from the shim to the package.

For a target other than installed, unpack the target version to a temp dir (`npm pack @earendil-works/pi-coding-agent@<target>` or an isolated `npm i` in a scratch project).

Read `CHANGELOG.md` over the **installed → target range**, not just the newest entry: note Breaking Changes and any Added/Changed/Removed touching the extension surface (`registerTool`, `registerCommand`, `pi.on`, `modelRegistry`, `ctx.ui`, `@earendil-works/pi-ai` types). Also check the target version's official docs / API reference, not just the changelog.

**Done when**: target version recorded; installed→target changelog range read; breaking-change list noted; docs surface checked.

### 2. Typecheck the extension against the target SDK types

The contract seam: only the real types catch SDK drift — behavioral tests against mocks cannot. Map against the **target** version's packages, not the installed ones. If the target differs from installed, use the temp-unpacked copy from step 1; do not let the repo's installed copy or devDependencies shadow it.

Run the repo's own typecheck if it targets real types; otherwise create a throwaway tsconfig mapping the four packages to the target packages (template in the Reference) and run `tsc --noEmit`.

Capture the full error list: count, per-file, per-category. This is the baseline red. If the repo has no typecheck gate, offer to keep the seam (tsconfig + a `typecheck` script) — adding devDependencies needs the user's confirmation.

Also verify the **runtime export surface** the extension uses: every `from "@earendil-works/..."` specifier (top-level, subpaths like `@earendil-works/pi-ai/compat`, deep imports like `@earendil-works/pi-tui/dist/word-navigation.js`) must still resolve against the target version — check the target packages' `exports` maps still list the subpaths, and that deep-imported files still exist in the target `dist`.

**Done when**: the complete error list is recorded; the export surface is verified.

### 3. Triage each error class

Map every error class to a decision: type-only fix, contract change, or behavior-affecting. The Reference table lists known classes from a past curation point; the changelog and the real types override the table. Flag behavior-affecting classes — they change runtime behavior, not just types, and need the user's sign-off. Classify an error as drift only after a clean comparison run against the repo's pinned types: an error set that reproduces identically is pre-existing repo debt — version-independent; triage it as repo hygiene and check whether the repo has a gate.

**Mirror-drift check (extensions that mirror pi internals)**: a green typecheck does not mean the extension's *runtime* semantics still match pi. Extensions that transcribe pi internals — retry/overflow classification tables, mirrored layout resolvers, copied `streamFn` wiring — must be diffed against the target version's actual dist sources (e.g. `pi-ai/dist/utils/retry.js`, `pi-ai/dist/utils/overflow.js`, `pi-tui/dist/tui.js`, `pi-coding-agent/dist/core/settings-manager.js`). Read the target changelog's **Changed and Fixed sections too, not just Breaking Changes** — semantic changes (e.g. a 60s backoff cap added in a 0.86.x Fixed entry) hide under Fixed. Line-number claims in comments/ADRs (`tui.js L781-902`) drift between versions: re-verify each against the target dist. Each drift is a behavior-affecting class needing the user's sign-off.

**Done when**: every error class has a fix decision; behavior-affecting classes (typecheck errors and mirror drift) are flagged; line-reference claims re-verified.

### 4. Fix breaking changes with zero behavior change

This step covers the **compatibility layer only**. Adopting new APIs happens in step 5 and is explicitly *not* zero-behavior-change.

Smallest change per class. No new features, no unrelated refactors; follow the repo's AGENTS.md (comment style, scope, dependency-confirmation rules). When a fix hides a real trade-off — e.g. tool error signaling: return-style `{ error }` details vs throw — surface it to the user and offer an ADR (step 7).

**Done when**: `tsc --noEmit` exits 0.

### 5. Survey new capabilities and adopt on request

Unlike steps 2–4, this step is **not** bound by zero behavior change: adopting a new API is a deliberate improvement the user opts into.

Collect candidate APIs/features added between the installed and target versions: the changelog's Added and non-breaking Changed sections, new public exports in the target types, and new docs sections.

Filter to candidates that (a) touch the surface this extension uses and (b) would improve the current design (simplify, remove a workaround, add a capability). Drop unrelated additions — do not pad the list.

Present one table row per candidate: capability / what it solves / benefit to this extension / change scope / risk (behavior-affecting?) / recommendation (adopt · watch · n/a).

For each item the user picks: implement it **on its own**, then typecheck, test, and ADR it separately. Do not batch adopted items into one change.

**Done when**: the candidate table is presented; every item has an explicit user decision; each adopted item is individually verified.

### 6. Verify tests

Run the repo's test command. If the test build fails for environment reasons (e.g. esbuild discovery), fix portability — but report it as test-infra work, separate from the SDK sync. Update tests where the contract changed: mock shapes must mirror the real SDK shapes the extension now uses; assertions retarget to the new contract.

**Done when**: the full suite is green; failures unrelated to the change are reported, not silently fixed.

### 7. Document

- ADR for real trade-offs, per the repo's ADR conventions (`docs/adr/`).
- CONTEXT.md glossary terms if new vocabulary crystallized (e.g. a tool result contract).
- README compatibility note (the resolved target version) when the repo keeps one.

**Done when**: docs written per repo conventions.

### 8. Report

Report the **resolved target version**. Version numbers in reports are stable references; line-number / internal-structure claims are not — re-verify them against the target dist on every run.

Per category: what changed, type-only vs runtime-affecting; mark unverified items `[NEEDS MANUAL VERIFICATION]`. For the adoption survey: each candidate's final status (adopted / declined / watch) and, for adopted items, the runtime impact. State whether a release is warranted — but do not run one; releases follow the repo's release conventions.

**Done when**: the report lists every category with its type-only/runtime status and the resolved target version.

## Reference

All version numbers, file paths, line numbers, and API names in this Reference are snapshots from a curation point, not exhaustive lists. The target changelog and the target types are authoritative; treat everything here as a starting hint.

### Resolving the target version

```bash
npm view @earendil-works/pi-coding-agent dist-tags.latest
# cross-check GitHub releases; pass target=<version> to pin a specific run
```

### Throwaway typecheck tsconfig

Use only when the repo lacks installed pi packages; with devDependencies installed, plain module resolution suffices. Map `paths` to the **target** version's packages (unpack the target to a temp dir if it differs from installed). Entries: pi-coding-agent and pi-ai: `dist/index.d.ts`; pi-tui: `dist/index.d.ts`; typebox: its `types` field, e.g. `build/index.d.mts`:

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
      "@earendil-works/pi-coding-agent": ["<target-pi-pkg>/dist/index.d.ts"],
      "@earendil-works/pi-ai": ["<target-pi-ai-pkg>/dist/index.d.ts"],
      "@earendil-works/pi-tui": ["<target-pi-tui-pkg>/dist/index.d.ts"],
      "typebox": ["<target-typebox-pkg>/build/index.d.mts"]
    }
  },
  "include": ["<extension-source-files>"]
}
```

If `node:*` imports fail to resolve, drop `types: []` (auto-include @types/node from the pi install) or add an explicit `@types/node`.

Map **every** import specifier the extension uses, not just the four top-level packages — subpaths (`@earendil-works/pi-ai/compat` → `dist/compat.d.ts`) and deep imports (`@earendil-works/pi-tui/dist/word-navigation.js` → `dist/word-navigation.d.ts`) too. Unmapped subpaths resolve to the repo's own pinned version, producing false "dual-version type identity" errors (a `Model` from the target version not assignable to a `Model` from the repo's pinned version) that look like SDK drift. Grep all `from "@earendil-works/..."` specifiers and cover each.

### New-capability survey checklist

Sources for step 5: the changelog's Added / non-breaking Changed sections over the installed→target range; a diff of the target types' public exports against the installed ones; new docs sections. Judge relevance by whether the candidate touches a surface this extension already uses and whether it removes a workaround, simplifies, or adds a capability. Discard the rest.

### Known pi breaking-change classes (curated around 0.86.0; superseded by the target changelog and types)

| Class | Symptom | Fix |
|---|---|---|
| Model genericity | `Model` requires 1 type argument | use `Model<Api>` — the type `modelRegistry.getAll/getAvailable/find` return |
| Tool result contract | `details` required, `isError` not a member of `AgentToolResult`; `ToolResultMessage` is a conditional type | return `{ content, details }`; expected failures: error text in content + `details: { error: string }`; the harness derives `isError` only from throws, so a returned `isError` field is dead code |
| notify levels | `"warn"` not in the union | use `"warning"` (union is `"info" \| "warning" \| "error"`); unknown levels render as info at runtime |
| ui.custom typing | `ctx.ui.custom<T>` returns `Promise<T>`; wrapper return type mismatches | align the wrapper's declared return (null vs undefined) |
| pi.on | returns an unsubscribe function | ignoring it is fine |
| tool schema | tools without parameter schemas are rejected at registration | always provide a TypeBox `parameters` |
| JSON-only | `ToolCall.arguments` / `ToolResultMessage.details` restricted to JSON-compatible values | keep arguments and details JSON-compatible |

## Related skills

- **npm-release** — when the extension is published as an npm package, a completed sync or adoption is usually followed by a versioned release; hand over per that skill.