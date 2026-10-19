#!/usr/bin/env node
// Tests for scripts/generate-patches-report.mjs: the pure parsing/ordering/
// statistics layer behind the standalone HTML patch-manifest report. Offline
// and deterministic — inline fixture records only, no repo, no network.
// The full report (file scanning + git state + HTML writing) is exercised by
// the generator's own run; this suite covers the seams that would silently
// corrupt a report: frontmatter/body parsing, `after:` topological ordering,
// and the summary statistics.

import test from "node:test";
import assert from "node:assert/strict";
import { parseRecord, orderByAfter, buildStats } from "./generate-patches-report.mjs";

// --- fixtures ---------------------------------------------------------------

const DIFF_RECORD = `---
id: fixture.one
file: skills/fixture/tool/SKILL.md
upstream:
  source: fixture/repo
  path: skills/fixture/tool/SKILL.md
verification: diff
after: fixture.base
summary: >-
  Step 3 rewritten: findings saved inside the repo's working tree, path must
  resolve inside the repo; the file is a committed artifact.
origin: "PATCHES.md A-class row #1"
---

## Why

Two sessions had written findings to %TEMP%.

## Diff

\`\`\`diff
--- a/skills/fixture/tool/SKILL.md
+++ b/skills/fixture/tool/SKILL.md
@@ -11,2 +11,2 @@
-old line
+new line
\`\`\`
`;

const BEHAVIORAL_RECORD = `---
id: fixture.two
file: skills/self/fixture/guide.md
verification: behavioral
summary: >-
  Template rewritten from a Chinese skeleton to an English skeleton.
---

## Why

Release notes are an English-facing artifact.

## Static assert (CI-runnable)

- \`skills/self/fixture/guide.md\` contains \`## Highlights\`
- \`skills/self/fixture/guide.md\` contains no \`## 亮点\`

## Live check (human re-run)

1. Run the consolidation script.
2. Check the classification.
`;

// A bare diff record without `after:` — the common case.
const PLAIN_RECORD = `---
id: fixture.three
file: skills/fixture/other/SKILL.md
upstream:
  source: fixture/repo
  path: skills/fixture/other/SKILL.md
verification: diff
summary: >-
  One line replaced.
---

## Diff

\`\`\`diff
--- a/skills/fixture/other/SKILL.md
+++ b/skills/fixture/other/SKILL.md
@@ -3,2 +3,2 @@
-old
+new
\`\`\`
`;

// --- parseRecord ------------------------------------------------------------

test("parseRecord: diff record — scalars, nested upstream, folded summary, after", () => {
  const r = parseRecord(DIFF_RECORD);
  assert.equal(r.fm.id, "fixture.one");
  assert.equal(r.fm.file, "skills/fixture/tool/SKILL.md");
  assert.deepEqual(r.fm.upstream, {
    source: "fixture/repo",
    path: "skills/fixture/tool/SKILL.md",
  });
  assert.equal(r.fm.verification, "diff");
  assert.equal(r.fm.after, "fixture.base");
  // folded summary joins into one paragraph
  assert.equal(
    r.fm.summary,
    "Step 3 rewritten: findings saved inside the repo's working tree, path must resolve inside the repo; the file is a committed artifact."
  );
  assert.equal(r.fm.origin, "PATCHES.md A-class row #1");
  assert.match(r.why, /%TEMP%/);
  assert.match(r.diff, /^-old line$/m);
  assert.match(r.diff, /^\+new line$/m);
  assert.match(r.diff, /^@@ -11,2 \+11,2 @@$/m);
  assert.equal(r.statics, null);
  assert.equal(r.live, null);
});

test("parseRecord: behavioral record — static assert + live check, no diff", () => {
  const r = parseRecord(BEHAVIORAL_RECORD);
  assert.equal(r.fm.id, "fixture.two");
  assert.equal(r.fm.verification, "behavioral");
  assert.equal(r.fm.after, undefined);
  assert.equal(r.diff, null);
  assert.match(r.statics, /contains `## Highlights`/);
  assert.match(r.statics, /contains no `## 亮点`/);
  assert.match(r.live, /Run the consolidation script/);
});

test("parseRecord: bare record — no after, no Why", () => {
  const r = parseRecord(PLAIN_RECORD);
  assert.equal(r.fm.after, undefined);
  assert.equal(r.why, null);
  assert.match(r.diff, /^-old$/m);
});

// --- orderByAfter -----------------------------------------------------------

test("orderByAfter: dependency sorts before its stacker", () => {
  const base = {
    fm: { id: "fixture.base", file: "skills/fixture/tool/SKILL.md" },
  };
  const stacker = {
    fm: {
      id: "fixture.one",
      file: "skills/fixture/tool/SKILL.md",
      after: "fixture.base",
    },
  };
  // deliberately out of order: stacker first
  const out = orderByAfter([stacker, base]);
  assert.deepEqual(
    out.map((r) => r.fm.id),
    ["fixture.base", "fixture.one"]
  );
});

test("orderByAfter: longer chain resolves transitively", () => {
  const a = { fm: { id: "a", file: "f", after: "b" } };
  const b = { fm: { id: "b", file: "f", after: "c" } };
  const c = { fm: { id: "c", file: "f" } };
  const out = orderByAfter([a, b, c]);
  assert.deepEqual(
    out.map((r) => r.fm.id),
    ["c", "b", "a"]
  );
});

test("orderByAfter: unrelated records and different files keep a stable order", () => {
  const r1 = { fm: { id: "x.one", file: "f1" } };
  const r2 = { fm: { id: "x.two", file: "f2" } };
  const r3 = { fm: { id: "x.three", file: "f1" } };
  const out = orderByAfter([r1, r2, r3]);
  assert.deepEqual(
    out.map((r) => r.fm.id),
    ["x.one", "x.three", "x.two"] // per-file grouping, insertion order within a file
  );
});

test("orderByAfter: every record survives (no drops, no duplicates)", () => {
  const records = [
    { fm: { id: "s", file: "f", after: "m" } },
    { fm: { id: "m", file: "f", after: "b" } },
    { fm: { id: "b", file: "f" } },
    { fm: { id: "loner", file: "g" } },
  ];
  const out = orderByAfter(records);
  assert.equal(out.length, records.length);
  assert.equal(new Set(out.map((r) => r.fm.id)).size, records.length);
});

// --- buildStats -------------------------------------------------------------

function mk(partial, source) {
  return { source, fm: { id: "unset", ...partial } };
}

test("buildStats: counts totals, sources, verification and stacked", () => {
  const records = [
    mk({ id: "mattpocock.a", verification: "diff", file: "skills/mattpocock/a/SKILL.md" }, "mattpocock"),
    mk({ id: "mattpocock.b", verification: "diff", file: "skills/mattpocock/b/SKILL.md" }, "mattpocock"),
    mk({ id: "self.c", verification: "behavioral", file: "skills/self/c/guide.md" }, "self"),
    mk({ id: "self.d", verification: "behavioral", file: "skills/self/d/guide.md", after: "self.c" }, "self"),
  ];
  const s = buildStats(records);
  assert.equal(s.total, 4);
  assert.deepEqual(s.bySource, { mattpocock: 2, self: 2 });
  assert.deepEqual(s.byVerification, { diff: 2, behavioral: 2 });
  assert.equal(s.stacked.length, 1);
  assert.equal(s.stacked[0].fm.id, "self.d");
  assert.equal(s.multiPatchFiles.length, 0);
});

test("buildStats: multi-patch files aggregate and sort by patch count", () => {
  const records = [
    mk({ id: "f.a", file: "skills/f/SKILL.md", verification: "diff" }, "f"),
    mk({ id: "f.b", file: "skills/f/SKILL.md", verification: "diff" }, "f"),
    mk({ id: "f.c", file: "skills/f/SKILL.md", verification: "diff" }, "f"),
    mk({ id: "g.x", file: "skills/g/SKILL.md", verification: "diff" }, "g"),
    mk({ id: "g.y", file: "skills/g/SKILL.md", verification: "diff" }, "g"),
    mk({ id: "h.z", file: "skills/h/SKILL.md", verification: "diff" }, "h"),
  ];
  const s = buildStats(records);
  assert.deepEqual(s.multiPatchFiles, [
    ["skills/f/SKILL.md", ["f.a", "f.b", "f.c"]],
    ["skills/g/SKILL.md", ["g.x", "g.y"]],
  ]);
  assert.equal(s.files.get("skills/h/SKILL.md").length, 1);
});
