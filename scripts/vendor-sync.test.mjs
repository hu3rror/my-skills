#!/usr/bin/env node
// Unit tests for scripts/vendor-sync.mjs's per-source meta parsing and
// patched-file classification. Offline and deterministic: fixtures only, no
// network, no clones. The pin-based "does a patched file need a manual merge"
// rule is what lets the vendor freshness check go green — a regression here
// re-opens the false-positive pending-update issues (every patched file listed
// as "manual merge" even when upstream never moved).

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { tmpdir } from "node:os";
import {
  isExcludedUpstreamPath,
  loadSourceMeta,
  mattpocockSkillRoots,
  parseSourceMeta,
  patchedNeedsMerge,
} from "./vendor-sync.mjs";

// Mirrors the real vendor/mattpocock.json per-source meta (map ticket #23):
// pins, exclusions and the release repo moved out of PATCHES.md's tables into
// per-source data files.
const MATTPOCOCK_META = {
  name: "mattpocock",
  repo: "mattpocock/skills",
  url: "https://github.com/mattpocock/skills.git",
  pin: "4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d",
  releaseRepo: "mattpocock/skills",
  exclusions: [
    { path: "skills/in-progress", reason: "beta category, not needed" },
    { path: "skills/misc", reason: "uncurated one-offs, not needed" },
    { path: "skills/engineering/wizard", reason: "not used by this maintainer" },
    { path: "skills/productivity/to-questionnaire", reason: "not used by this maintainer" },
  ],
};

// A manual-fork source (github/awesome-copilot): pinned for provenance and as
// the #10 diff baseline, but never synced, so no exclusions or release repo.
const AWESOME_COPILOT_META = {
  name: "awesome-copilot",
  repo: "github/awesome-copilot",
  url: "https://github.com/github/awesome-copilot",
  pin: "caab1f623bb68a330f294a11279597d7ae7be737",
  kind: "manual-fork",
  note: "localized create-readme (remote template URLs -> references/); not registered in vendor-sync SOURCES",
};

test("parseSourceMeta parses a vendored source's meta", () => {
  const meta = parseSourceMeta(JSON.stringify(MATTPOCOCK_META), "mattpocock");
  assert.equal(meta.name, "mattpocock");
  assert.equal(meta.repo, "mattpocock/skills");
  assert.equal(meta.pin, "4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d");
  assert.equal(meta.releaseRepo, "mattpocock/skills");
  assert.deepEqual(meta.exclusions.map((e) => e.path), [
    "skills/in-progress",
    "skills/misc",
    "skills/engineering/wizard",
    "skills/productivity/to-questionnaire",
  ]);
});

test("parseSourceMeta accepts a manual-fork meta without exclusions or release repo", () => {
  const meta = parseSourceMeta(JSON.stringify(AWESOME_COPILOT_META), "awesome-copilot");
  assert.equal(meta.kind, "manual-fork");
  assert.equal(meta.exclusions, undefined);
  assert.equal(meta.releaseRepo, undefined);
});

test("parseSourceMeta rejects a name mismatch between file and contents", () => {
  assert.throws(
    () => parseSourceMeta(JSON.stringify(MATTPOCOCK_META), "kill-ai-slop"),
    /name mismatch/,
  );
});

test("parseSourceMeta rejects invalid JSON", () => {
  assert.throws(() => parseSourceMeta("{nope", "mattpocock"), /invalid JSON/);
});

test("parseSourceMeta rejects a meta missing a required field", () => {
  const { pin, ...noPin } = MATTPOCOCK_META;
  assert.throws(() => parseSourceMeta(JSON.stringify(noPin), "mattpocock"), /"pin"/);
  const { url, ...noUrl } = MATTPOCOCK_META;
  assert.throws(() => parseSourceMeta(JSON.stringify(noUrl), "mattpocock"), /"url"/);
});

test("parseSourceMeta rejects malformed exclusions", () => {
  const bad = { ...MATTPOCOCK_META, exclusions: [{ path: "skills/x" }] }; // no reason
  assert.throws(() => parseSourceMeta(JSON.stringify(bad), "mattpocock"), /exclusion/);
  const notArray = { ...MATTPOCOCK_META, exclusions: "skills/in-progress" };
  assert.throws(() => parseSourceMeta(JSON.stringify(notArray), "mattpocock"), /exclusions/);
});

test("parseSourceMeta rejects a malformed releaseRepo", () => {
  const bad = { ...MATTPOCOCK_META, releaseRepo: 42 };
  assert.throws(() => parseSourceMeta(JSON.stringify(bad), "mattpocock"), /releaseRepo/);
});

test("loadSourceMeta reads and validates vendor/<name>.json", () => {
  const dir = mkdtempSync(join(tmpdir(), "meta-"));
  try {
    writeFileSync(join(dir, "mattpocock.json"), JSON.stringify(MATTPOCOCK_META));
    const meta = loadSourceMeta("mattpocock", dir);
    assert.equal(meta.pin, MATTPOCOCK_META.pin);
    assert.deepEqual(meta.exclusions.map((e) => e.path), MATTPOCOCK_META.exclusions.map((e) => e.path));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadSourceMeta refuses a missing meta file (a dropped pin would unprotect a patch)", () => {
  const dir = mkdtempSync(join(tmpdir(), "meta-"));
  try {
    assert.throws(() => loadSourceMeta("nope", dir), /missing/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Reads the committed vendor/ directory: a pin/exclusion edit that broke the
// real files (e.g. a pin bump with a typo) fails here instead of silently
// over-reporting or unprotecting a patch. Covers awesome-copilot too, which no
// sync source loads.
test("every real vendor/<name>.json parses with a 40-hex pin", () => {
  for (const name of ["mattpocock", "kill-ai-slop", "cloudflare", "awesome-copilot"]) {
    const meta = loadSourceMeta(name);
    assert.match(meta.pin, /^[0-9a-f]{40}$/, `${name} pin must be a full commit SHA`);
    assert.equal(meta.name, name);
  }
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
