#!/usr/bin/env node
// Unit tests for scripts/vendor-sync.mjs's manifest parsing and patched-file
// classification. Offline and deterministic: fixtures only, no network, no
// clones. The pin-based "does a patched file need a manual merge" rule is what
// lets the vendor freshness check go green — a regression here re-opens the
// false-positive pending-update issues (every patched file listed as "manual
// merge" even when upstream never moved).

import test from "node:test";
import assert from "node:assert/strict";
import { parseUpstreamRefs, patchedNeedsMerge } from "./vendor-sync.mjs";

// Mirrors PATCHES.md's real upstream-references table.
const REFS_FIXTURE = `# PATCHES.md — Patch manifest

## Upstream references

| Source | URL | Pinned commit (diff baseline) |
|---|---|---|
| mattpocock/skills | https://github.com/mattpocock/skills | \`c55ee46073ed923f86ce59a5eb3b6d895095d1b7\` |
| yetone/kill-ai-slop | https://github.com/yetone/kill-ai-slop | \`f6e2ae32b30443ec7bd0da4da971ee18d8f8ffcb\` |
| cloudflare/security-audit-skill | https://github.com/cloudflare/security-audit-skill | \`c1c8a8c1471069fb0e188eeaff69b8e8db6564a8\` |

## A-class patches (applied, must-fix)

| # | Origin | File (repo-relative) | Patch summary | Upstream counterpart | Verification method |
|---|---|---|---|---|---|
| 1 | baseline | \`skills/mattpocock/engineering/research/SKILL.md\` | +2 lines appended | mattpocock/skills \`skills/engineering/research/SKILL.md\` | git diff shows exactly 2 added lines |
`;

test("parseUpstreamRefs maps each source to its pinned commit", () => {
  assert.deepEqual([...parseUpstreamRefs(REFS_FIXTURE).entries()], [
    ["mattpocock/skills", "c55ee46073ed923f86ce59a5eb3b6d895095d1b7"],
    ["yetone/kill-ai-slop", "f6e2ae32b30443ec7bd0da4da971ee18d8f8ffcb"],
    ["cloudflare/security-audit-skill", "c1c8a8c1471069fb0e188eeaff69b8e8db6564a8"],
  ]);
});

test("parseUpstreamRefs ignores table header, separator, and later sections", () => {
  const pins = parseUpstreamRefs(REFS_FIXTURE);
  assert.equal(pins.size, 3); // header `---` row and A-class table rows skipped
  assert.equal(pins.has("Source"), false);
  assert.equal(pins.has("1"), false);
});

test("parseUpstreamRefs tolerates a bare empty table", () => {
  assert.deepEqual(
    [...parseUpstreamRefs("## Upstream references\n\n| Source | URL | Pinned commit |\n|---|---|---|\n").entries()],
    [],
  );
});

test("patchedNeedsMerge: upstream unchanged since the pin → current, never pending", () => {
  // local differs from upstream HEAD (true of every patch by construction),
  // but upstream did not move → the patch is current.
  assert.equal(patchedNeedsMerge("same", "same", true), false);
});

test("patchedNeedsMerge: upstream moved since the pin → pending, regardless of local", () => {
  assert.equal(patchedNeedsMerge("old", "new", false), true);
  assert.equal(patchedNeedsMerge("old", "new", true), true);
});

test("patchedNeedsMerge: missing pin falls back to local-vs-HEAD (over-reports, never under)", () => {
  assert.equal(patchedNeedsMerge(null, "new", false), false); // unchanged file, no pin: current
  assert.equal(patchedNeedsMerge(null, "new", true), true); // deviated file, no pin: pending
  assert.equal(patchedNeedsMerge("old", null, true), true);
  assert.equal(patchedNeedsMerge(null, null, true), true);
});

test("patchedNeedsMerge compares bytes, not decoded strings", () => {
  // Two different invalid-UTF-8 byte sequences decode to the same U+FFFD
  // replacement char; a decoded-string compare would miss the change.
  const a = Buffer.from([0xff, 0xfe, 0x41]);
  const b = Buffer.from([0xff, 0xfe, 0x42]);
  assert.equal(patchedNeedsMerge(a, b, true), true); // different bytes → pending
  assert.equal(patchedNeedsMerge(a, Buffer.from([0xff, 0xfe, 0x41]), true), false);
  // String fixtures keep working through Buffer.from normalization.
  assert.equal(patchedNeedsMerge("same", "same", true), false);
  assert.equal(patchedNeedsMerge("old", "new", false), true);
});
