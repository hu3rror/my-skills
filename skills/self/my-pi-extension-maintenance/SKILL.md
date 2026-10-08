---
name: my-pi-extension-maintenance
description: "Maintain a pi extension against its pi dependencies: sync to the latest (or pinned) target versions, verify the actual import surface against the target's types, exports, changelog and official docs, fix breaking changes with zero behavior change (user sign-off only when a behavior change is unavoidable), survey new APIs for optional adoption."
disable-model-invocation: true
---

# Maintain a pi extension against its pi dependencies

Adapt an extension to the **latest published versions of the pi packages it imports** by default, or to an explicit `target=<version>`. Two layers:

- **Compatibility layer** (steps 3–4): fix breaking changes with **zero behavior change** — the user's sign-off is required only when a behavior change is unavoidable.
- **Adoption layer** (step 6): survey APIs/features added since the installed version; present each as a candidate with benefit, scope, and risk; adopt only what the user picks, one item at a time.

## Steps

### 1. Resolve the target versions, locate the packages, and read the changelogs

Resolve the target **per pi package the extension imports** (`@earendil-works/...` specifiers, gathered from the repo's package.json and import surface): explicit `target=<version>` pins the whole run → else the latest published version (`npm view <pkg> dist-tags.latest`, cross-check GitHub releases). **Never** infer targets from prior reports, prior syncs, GLOSSARY.md, ADRs, git history, or installed devDependencies — the report is write-only.

Record the resolved version per package. If it equals the installed version, skip the fix loop (steps 3–4) but still run step 2's import-surface check — the seam catches pre-existing repo debt, not just SDK drift — and run the adoption survey (step 6).

Locate the **installed** packages via the pi CLI (`Get-Command pi` / `mise which pi`, then walk up from the shim to the package) — never a hardcoded store layout. For a target other than installed, unpack the target to a temp dir (`npm pack <pkg>@<target>` or an isolated `npm i` in a scratch project).

Read each package's `CHANGELOG.md` over the **installed → target range**, not just the newest entry: note Breaking Changes and any Added/Changed/Removed/Fixed touching the extension surface. Also check the target version's official docs / API reference, not just the changelog.

**Done when**: target versions recorded; installed→target changelog range read; breaking-change list noted; docs surface checked.

### 2. Check the actual import surface

The contract seam: only the real types and the target packages' actual surface catch SDK drift — behavioral tests against mocks cannot. Map against the **target** versions, not the installed ones. If a target differs from installed, use the temp-unpacked copy from step 1.

Enumerate every `from "@earendil-works/..."` specifier the extension uses — top-level, subpaths (`@earendil-works/pi-ai/compat`), deep imports (`@earendil-works/pi-tui/dist/word-navigation.js`). Verify each resolves against the target version: the target package's `exports` map still lists the subpath, deep-imported files still exist in the target `dist`, and the top-level types load. Grep the specifiers; cover each.

If the repo has its own typecheck gate that targets real types, run it against the target packages (map `paths` to the target if the gate would otherwise resolve the installed copies). Otherwise the export-surface pass above is the verification — no throwaway tsconfig by default.

**Done when**: every import specifier is verified to resolve against the target; the repo's own typecheck (when it exists) exits 0.

### 3. Triage each breaking change

Map every breaking change to a decision: type-only fix or contract change. The **target changelog, target types, exports maps, and official docs are the source of truth** — nothing else. Classify an error as drift only after a clean comparison run against the repo's pinned types: an error set that reproduces identically is pre-existing repo debt — version-independent; triage it as repo hygiene and check whether the repo has a gate.

**Mirror-drift check — conditional**: only when the extension mirrors pi internals — deep imports into `@earendil-works/*/dist/...` or transcribed logic (retry/overflow classification tables, mirrored layout resolvers, copied `streamFn` wiring) — diff the mirrored internals against the target version's actual dist sources, and read the target changelog's **Changed and Fixed sections too, not just Breaking Changes** (semantic changes hide under Fixed). Line-number claims in comments/ADRs drift between versions: re-verify each against the target dist. No deep imports into `dist/` → skip the check entirely.

**Done when**: every breaking change has a fix decision; mirror drift (when triggered) is diffed and its behavior changes flagged.

### 4. Fix breaking changes with zero behavior change

This step covers the **compatibility layer only**. Adopting new APIs happens in step 6 and is explicitly *not* zero-behavior-change.

Smallest change per class. No new features, no unrelated refactors; follow the repo's AGENTS.md (comment style, scope, dependency-confirmation rules).

**Sign-off rule**: require the user's sign-off only when a behavior change is **unavoidable** — the target contract forces it and no zero-behavior alternative exists (a level renamed out of a union, a return shape removed). When a preserving alternative exists, take it without sign-off. Surface genuine trade-offs (e.g. tool error signaling: return-style `{ error }` details vs throw) as information; the user decides only the unavoidable ones.

**Done when**: every unavoidable behavior change has the user's sign-off; the repo's typecheck (when it exists) exits 0.

### 5. Verify tests

Run the repo's test command (when it has one). If the test build fails for environment reasons (e.g. esbuild discovery), fix portability — but report it as test-infra work, separate from the sync. Update tests where the contract changed: mock shapes must mirror the real SDK shapes the extension now uses; assertions retarget to the new contract.

**Done when**: the suite the repo has is green; failures unrelated to the change are reported, not silently fixed. Verification is typecheck (if any) + tests (if any) + the import-surface pass — no default build.

### 6. Survey new capabilities and adopt on request

Unlike steps 3–4, this step is **not** bound by zero behavior change: adopting a new API is a deliberate improvement the user opts into.

Collect candidate APIs/features added between the installed and target versions: the changelog's Added and non-breaking Changed sections, new public exports in the target types, new docs sections.

Filter to candidates that (a) touch the surface this extension uses and (b) would improve the current design (simplify, remove a workaround, add a capability). Drop unrelated additions — do not pad the list.

Present one table row per candidate: capability / what it solves / benefit to this extension / change scope / risk (behavior-affecting?) / recommendation (adopt · watch · n/a).

For each item the user picks: implement it **on its own**, then typecheck and test it separately. Do not batch adopted items into one change.

**Done when**: the candidate table is presented; every item has an explicit user decision; each adopted item is individually verified.

### 7. Document and report

- ADR only for a real, settled trade-off, per the repo's ADR conventions (`docs/adr/`) — not per adoption item by default.
- GLOSSARY.md glossary terms if new vocabulary crystallized (e.g. a tool result contract).
- README compatibility note (the resolved target versions) when the repo keeps one.

**Done when**: docs written per repo conventions.

Report the **resolved target versions**. Version numbers in reports are stable references; line-number / internal-structure claims are not — re-verify them against the target dist on every run. Per category: what changed, type-only vs runtime-affecting; mark unverified items `[NEEDS MANUAL VERIFICATION]`. For the adoption survey: each candidate's final status (adopted / declined / watch) and, for adopted items, the runtime impact. State whether a release is warranted — but do not run one; releases follow the repo's release conventions.

**Done when**: the report lists every category with its type-only/runtime status and the resolved target versions.

## Reference

All version numbers, file paths, line numbers, and API names in this Reference are snapshots from a curation point, not exhaustive lists. The target changelog, target types, exports maps, and official docs are authoritative; treat everything here as a starting hint.

### Resolving the target versions

```bash
npm view <pi-pkg> dist-tags.latest   # one call per pi dependency the extension imports
# cross-check GitHub releases; pass target=<version> to pin a specific run
```

### Import-surface checklist

Grep every `from "@earendil-works/..."` specifier. For each: top-level → the package's `exports` entry exists and its types resolve; subpath (`@earendil-works/pi-ai/compat`) → still listed in the target `exports` map; deep import (`@earendil-works/pi-tui/dist/word-navigation.js`) → the file still exists in the target `dist`. Unmapped subpaths resolve to the repo's own pinned version, producing false "dual-version type identity" errors that look like SDK drift.

### New-capability survey checklist

Sources for step 6: the changelog's Added / non-breaking Changed sections over the installed→target range; a diff of the target types' public exports against the installed ones; new docs sections. Judge relevance by whether the candidate touches a surface this extension already uses and whether it removes a workaround, simplifies, or adds a capability. Discard the rest.

## Related skills

- **npm-release** — when the extension is published as an npm package, a completed sync or adoption is usually followed by a versioned release; hand over per that skill.
