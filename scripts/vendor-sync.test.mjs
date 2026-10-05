#!/usr/bin/env node
// Unit tests for scripts/vendor-sync.mjs's manifest parsing and patched-file
// classification. Offline and deterministic: fixtures only, no network, no
// clones. The pin-based "does a patched file need a manual merge" rule is what
// lets the vendor freshness check go green — a regression here re-opens the
// false-positive pending-update issues (every patched file listed as "manual
// merge" even when upstream never moved).

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { tmpdir } from "node:os";
import {
  isExcludedUpstreamPath,
  mattpocockSkillRoots,
  parseExcludedRoots,
  parseUpstreamRefs,
  patchedNeedsMerge,
} from "./vendor-sync.mjs";

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

// Mirrors PATCHES.md's future "Excluded from vendor sync" section: upstream
// paths (repo-relative within the upstream repo) the sync must skip silently.
const EXCLUDED_FIXTURE = `${REFS_FIXTURE}
## Excluded from vendor sync

| Source | Excluded upstream path | Reason |
|---|---|---|
| mattpocock/skills | \`skills/in-progress\` | beta category, not needed |
| mattpocock/skills | \`skills/misc\` | uncurated one-offs, not needed |
| mattpocock/skills | \`skills/engineering/wizard\` | not used by this maintainer |
`;

test("parseExcludedRoots maps each source to its excluded upstream paths", () => {
  assert.deepEqual([...parseExcludedRoots(EXCLUDED_FIXTURE).entries()], [
    ["mattpocock/skills", ["skills/in-progress", "skills/misc", "skills/engineering/wizard"]],
  ]);
});

test("parseExcludedRoots ignores the table header, separator, and other sections", () => {
  const excluded = parseExcludedRoots(EXCLUDED_FIXTURE);
  assert.equal(excluded.size, 1);
  assert.deepEqual(excluded.get("mattpocock/skills"), [
    "skills/in-progress",
    "skills/misc",
    "skills/engineering/wizard",
  ]);
});

test("parseExcludedRoots tolerates a manifest without the section", () => {
  assert.equal(parseExcludedRoots(REFS_FIXTURE).size, 0);
});

test("isExcludedUpstreamPath matches only under the excluded prefix", () => {
  const excluded = ["skills/in-progress", "skills/engineering/wizard"];
  // Under the prefix: the category itself and everything below it.
  assert.equal(isExcludedUpstreamPath("skills/in-progress", excluded), true);
  assert.equal(isExcludedUpstreamPath("skills/in-progress/loop-me", excluded), true);
  assert.equal(isExcludedUpstreamPath("skills/engineering/wizard", excluded), true);
  // Sibling with a longer name, or an unrelated path: never matched.
  assert.equal(isExcludedUpstreamPath("skills/in-progressing/x", excluded), false);
  assert.equal(isExcludedUpstreamPath("skills/engineering/code-review", excluded), false);
  assert.equal(isExcludedUpstreamPath("skills/misc/setup-pre-commit", excluded), false);
});

// Build a fixture tree from repo-relative path → content pairs, offline and
// deterministic (no network, no clones).
function makeTree(root, paths) {
  for (const [rel, content] of Object.entries(paths)) {
    const abs = join(root, ...rel.split("/"));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

test("mattpocockSkillRoots skips excluded categories and skills, keeps the rest", () => {
  const root = mkdtempSync(join(tmpdir(), "roots-"));
  try {
    makeTree(root, {
      "skills/engineering/code-review/SKILL.md": "a",
      "skills/engineering/wizard/SKILL.md": "b",
      "skills/in-progress/loop-me/SKILL.md": "c",
      "skills/misc/setup-pre-commit/SKILL.md": "d",
      "skills/productivity/grilling/SKILL.md": "e",
    });
    const excluded = [
      "skills/in-progress",
      "skills/misc",
      "skills/engineering/wizard",
    ];
    const targets = mattpocockSkillRoots(root, excluded).map((r) => r.targetRel).sort();
    assert.deepEqual(targets, [
      "skills/mattpocock/engineering/code-review",
      "skills/mattpocock/productivity/grilling",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("mattpocockSkillRoots maps every root when nothing is excluded", () => {
  const root = mkdtempSync(join(tmpdir(), "roots-"));
  try {
    makeTree(root, {
      "skills/engineering/wizard/SKILL.md": "b",
      "skills/in-progress/loop-me/SKILL.md": "c",
      "skills/productivity/grilling/SKILL.md": "e",
    });
    const targets = mattpocockSkillRoots(root, []).map((r) => r.targetRel).sort();
    assert.deepEqual(targets, [
      "skills/mattpocock/engineering/wizard",
      "skills/mattpocock/in-progress/loop-me",
      "skills/mattpocock/productivity/grilling",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
