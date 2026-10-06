#!/usr/bin/env node
// Tests for scripts/verify-patch-records.mjs: the patch-record manifest
// machinery (map #18 migration, record format map #22). Offline and
// deterministic — fixture records plus a local fixture upstream repo (git
// init), no network. The real records at patches/ are exercised by the
// full run (`node scripts/verify-patch-records.mjs`, which clones upstream at
// their pins); this suite covers the parser, the well-formedness pass, the
// behavioral static asserts, and the reconstruction engine against a fixture
// base.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import {
  extractDiff,
  parseFrontmatter,
  parseRecordFile,
  parseStaticAsserts,
  verifyAll,
} from "./verify-patch-records.mjs";

// --- fixture git helpers (same pattern as vendor-sync-merge.test.mjs) ------

function git(dir, args) {
  const r = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout.trim();
}

function initRepo(dir) {
  mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "test"]);
  // The verifier fetches the pinned base SHA over the local transport; serving
  // reachable SHAs is what GitHub does by default, so mirror it here.
  git(dir, ["config", "uploadpack.allowReachableSHA1InWant", "true"]);
}

function commitFile(dir, rel, content, message) {
  const abs = join(dir, ...rel.split("/"));
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  git(dir, ["add", rel]);
  git(dir, ["commit", "-q", "-m", message]);
  return git(dir, ["rev-parse", "HEAD"]);
}

// A fixture "upstream" repo with the base (pin) and HEAD, plus a fixture root
// holding the local consolidated copy, the meta dir and the patches dir.
// Returns the fixture root (all under one temp tree, cleaned by the caller).
function makeFixture({ base, local, upstreamHead = base, recordTexts = [] }) {
  const root = mkdtempSync(join(tmpdir(), "records-"));
  const upstream = join(root, "upstream");
  initRepo(upstream);
  const pin = commitFile(upstream, "skills/fixture/tool/SKILL.md", base, "base");
  if (upstreamHead !== base) {
    commitFile(upstream, "skills/fixture/tool/SKILL.md", upstreamHead, "head");
  }

  writeFileSync(join(root, "meta.json"), JSON.stringify({})); // placeholder
  const metaDir = join(root, "meta");
  mkdirSync(metaDir);
  writeFileSync(
    join(metaDir, "fixture.json"),
    JSON.stringify({ name: "fixture", repo: "fixture/repo", url: upstream, pin }),
  );

  const repo = join(root, "repo");
  const patches = join(repo, "patches");
  const skills = join(repo, "skills", "fixture", "tool");
  mkdirSync(skills, { recursive: true });
  writeFileSync(join(skills, "SKILL.md"), local);
  for (const [rel, text] of recordTexts) {
    const abs = join(patches, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return { root, repo, patches, metaDir, pin, upstream };
}

// Build a record file body from parts (same shape the real records use).
function recordBody({ id, file, up, after, summary, origin, diff, behavior }) {
  const fm = ["---", `id: ${id}`, `file: ${file}`];
  if (up) {
    fm.push("upstream:");
    fm.push(`  source: ${up.source}`);
    fm.push(`  path: ${up.path}`);
  }
  fm.push(`verification: ${behavior ? "behavioral" : "diff"}`);
  if (after) fm.push(`after: ${after}`);
  fm.push("summary: >-", `  ${summary}`);
  fm.push(`origin: "${origin}"`);
  fm.push("---");
  const body = [fm.join("\n"), "", "## Why", "", "test fixture", ""];
  if (behavior) {
    body.push("## Static assert (CI-runnable)", "", ...behavior);
  } else {
    body.push("## Diff", "", "```diff", diff, "```");
  }
  return body.join("\n") + "\n";
}

// A standard unified diff for a base -> local replacement of the tool line
// (line 3 in the fixture BASE). git apply needs a trailing context line when
// the change ends the hunk (observed against the real records), so the hunk
// carries line 4 (blank) as trailing context; the record file's closing fence
// contributes one extra newline, so the hunk ends with two (one real blank).
function replaceDiff(baseLine, newLine) {
  return [
    "--- a/skills/fixture/tool/SKILL.md",
    "+++ b/skills/fixture/tool/SKILL.md",
    "@@ -3,2 +3,2 @@",
    `-${baseLine}`,
    `+${newLine}`,
    "",
    "",
  ].join("\n");
}

const BASE = "# Fixture tool\n\nline one\n\nline two\n";
const LOCAL = "# Fixture tool\n\nline one patched\n\nline two\n";
const LINE = "line one";
const LINE_PATCHED = "line one patched";

// --- parser units -----------------------------------------------------------

test("parseFrontmatter: scalars, nested upstream, folded summary", () => {
  const fm = parseFrontmatter(
    "---\nid: fixture.one\nfile: skills/fixture/tool/SKILL.md\nupstream:\n  source: fixture/repo\n  path: skills/fixture/tool/SKILL.md\nverification: diff\nsummary: >-\n  One line replaced.\norigin: \"PATCHES.md A-class row #1\"\n---\n",
  );
  assert.equal(fm.id, "fixture.one");
  assert.equal(fm.file, "skills/fixture/tool/SKILL.md");
  assert.equal(fm.upstream.source, "fixture/repo");
  assert.equal(fm.upstream.path, "skills/fixture/tool/SKILL.md");
  assert.equal(fm.summary, "One line replaced.");
  assert.equal(fm.origin, "PATCHES.md A-class row #1");
});

test("parseFrontmatter: comments and blank lines are skipped", () => {
  const fm = parseFrontmatter(
    "---\n# a comment\n\nid: fixture.behavioral\nfile: x\nverification: behavioral\n---\n",
  );
  assert.equal(fm.id, "fixture.behavioral");
});

test("parseFrontmatter: no frontmatter throws", () => {
  assert.throws(() => parseFrontmatter("# no frontmatter\n"), /frontmatter/);
});

test("parseFrontmatter: malformed line throws (a dropped field must fail, not vanish)", () => {
  assert.throws(() => parseFrontmatter("---\nid: a\n??\n---\n"), /unparseable/);
});

test("extractDiff: pulls the fenced diff block", () => {
  const d = extractDiff("## Diff\n\n```diff\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\n```\n");
  assert.equal(d, "--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b");
});

test("parseStaticAsserts: contains / contains no / malformed", () => {
  const a = parseStaticAsserts(
    "- `skills/fixture/tool/SKILL.md` contains `patched`\n- `skills/fixture/tool/SKILL.md` contains no `original`\n- this line is prose\n",
  );
  assert.equal(a.length, 2);
  assert.deepEqual(a[0], { malformed: false, path: "skills/fixture/tool/SKILL.md", negated: false, needle: "patched" });
  assert.deepEqual(a[1], { malformed: false, path: "skills/fixture/tool/SKILL.md", negated: true, needle: "original" });
  assert.ok(a.every((x) => !x.malformed));
  const bad = parseStaticAsserts("- `x` contains\n");
  assert.equal(bad.length, 1);
  assert.equal(bad[0].malformed, true);
});

test("parseRecordFile: extracts sections and diff for a diff record", () => {
  const root = mkdtempSync(join(tmpdir(), "rec-parse-"));
  try {
    mkdirSync(join(root, "patches", "self", "x"), { recursive: true });
    const abs = join(root, "patches", "self", "x", "b.md");
    writeFileSync(
      abs,
      recordBody({
        id: "x.b",
        file: "skills/fixture/tool/SKILL.md",
        summary: "s",
        origin: "PATCHES.md A-class row #1",
        behavior: ["- `skills/fixture/tool/SKILL.md` contains `patched`"],
      }),
    );
    const rec = parseRecordFile(abs, root);
    assert.equal(rec.fm.id, "x.b");
    assert.ok(rec.staticAssert.includes("- `skills/fixture/tool/SKILL.md` contains `patched`"));
    assert.equal(rec.diff, null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- verifyAll: well-formedness ---------------------------------------------

test("verifyAll: a well-formed diff record reconstructs byte-identically", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "mattpocock/engineering/tool/one.md",
      recordBody({
        id: "fixture.one",
        file: "skills/fixture/tool/SKILL.md",
        up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
        summary: "one line replaced",
        origin: "PATCHES.md A-class row #1",
        diff: replaceDiff(LINE, LINE_PATCHED),
      }),
    ]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.equal(r.failures.length, 0, r.report);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("verifyAll: after: chains two records on the same file", () => {
  const f = makeFixture({
    base: "# Fixture tool\n\nline one\n\nline two\nline three\n",
    // trailing real content line: hunks must end with a non-blank context
    // line (a blank trailing context that is the file's last line fails git
    // apply — the EOF "" line is not a physical line).
    local: "# Fixture tool\n\nline one patched\n\nline two patched\nline three\n",
    recordTexts: [
      [
        "mattpocock/engineering/tool/one.md",
        recordBody({
          id: "fixture.one",
          file: "skills/fixture/tool/SKILL.md",
          up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
          summary: "one line replaced",
          origin: "PATCHES.md A-class row #1",
          diff: replaceDiff(LINE, LINE_PATCHED),
        }),
      ],
      [
        "mattpocock/engineering/tool/two.md",
        recordBody({
          id: "fixture.two",
          file: "skills/fixture/tool/SKILL.md",
          up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
          after: "fixture.one",
          summary: "second line replaced, stacked on fixture.one",
          origin: "PATCHES.md A-class row #2",
          diff: [
            "--- a/skills/fixture/tool/SKILL.md",
            "+++ b/skills/fixture/tool/SKILL.md",
            "@@ -3,4 +3,4 @@",
            " line one patched",
            "",
            "-line two",
            "+line two patched",
            " line three",
          ].join("\n"),
        }),
      ],
    ],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.equal(r.failures.length, 0, r.report);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("verifyAll: duplicate id fails well-formedness", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [
      [
        "mattpocock/engineering/tool/one.md",
        recordBody({
          id: "fixture.dup",
          file: "skills/fixture/tool/SKILL.md",
          up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
          summary: "x",
          origin: "PATCHES.md A-class row #1",
          diff: replaceDiff(LINE, LINE_PATCHED),
        }),
      ],
      [
        "mattpocock/engineering/tool/two.md",
        recordBody({
          id: "fixture.dup",
          file: "skills/fixture/tool/SKILL.md",
          up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
          summary: "y",
          origin: "PATCHES.md A-class row #2",
          diff: replaceDiff(LINE, LINE_PATCHED),
        }),
      ],
    ],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.match(r.report, /duplicate id/);
    assert.ok(r.failures.length > 0);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("verifyAll: a record pointing at a missing file fails (the sync skip-set guard)", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "mattpocock/engineering/tool/gone.md",
      recordBody({
        id: "fixture.gone",
        file: "skills/fixture/tool/MISSING.md",
        up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
        summary: "x",
        origin: "PATCHES.md A-class row #1",
        diff: replaceDiff(LINE, LINE_PATCHED),
      }),
    ]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.match(r.report, /file not in repo/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("verifyAll: diff record without a diff block fails", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "mattpocock/engineering/tool/one.md",
      recordBody({
        id: "fixture.nodiff",
        file: "skills/fixture/tool/SKILL.md",
        up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
        summary: "x",
        origin: "PATCHES.md A-class row #1",
      }).replace("## Diff", "## Something else"),
    ]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.match(r.report, /without a diff block|exactly one/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("verifyAll: behavioral record with a ## Diff block fails", () => {
  // recordBody can't produce both sections; build this one manually — a
  // behavioral record must never carry a diff to reconstruct.
  const behavioralWithDiff = [
    "---",
    "id: fixture.bad-behavioral",
    "file: skills/fixture/tool/SKILL.md",
    "verification: behavioral",
    "summary: >-",
    "  x",
    'origin: "PATCHES.md A-class row #1"',
    "---",
    "",
    "## Why",
    "",
    "x",
    "",
    "## Static assert (CI-runnable)",
    "",
    "- `skills/fixture/tool/SKILL.md` contains `patched`",
    "",
    "## Diff",
    "",
    "```diff",
    "--- a/skills/fixture/tool/SKILL.md",
    "+++ b/skills/fixture/tool/SKILL.md",
    "@@ -3,2 +3,2 @@",
    "-line one",
    "+line one patched",
    "```",
    "",
  ].join("\n");
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [["self/fixture/b.md", behavioralWithDiff]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.match(r.report, /behavioral record with a ## Diff block/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("verifyAll: missing after: target fails", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "mattpocock/engineering/tool/one.md",
      recordBody({
        id: "fixture.one",
        file: "skills/fixture/tool/SKILL.md",
        up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
        after: "fixture.nope",
        summary: "x",
        origin: "PATCHES.md A-class row #1",
        diff: replaceDiff(LINE, LINE_PATCHED),
      }),
    ]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.match(r.report, /after: target fixture\.nope not found/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

// --- verifyAll: behavioral static asserts -----------------------------------

test("verifyAll: behavioral static asserts pass and fail on content", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "self/fixture/b.md",
      recordBody({
        id: "fixture.behavioral",
        file: "skills/fixture/tool/SKILL.md",
        summary: "x",
        origin: "PATCHES.md A-class row #1",
        behavior: [
          "- `skills/fixture/tool/SKILL.md` contains `patched`",
          "- `skills/fixture/tool/SKILL.md` contains no `original`",
        ],
      }),
    ]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.equal(r.failures.length, 0, r.report);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }

  const f2 = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "self/fixture/b.md",
      recordBody({
        id: "fixture.behavioral",
        file: "skills/fixture/tool/SKILL.md",
        summary: "x",
        origin: "PATCHES.md A-class row #1",
        behavior: [
          "- `skills/fixture/tool/SKILL.md` contains `does-not-exist`",
        ],
      }),
    ]],
  });
  try {
    const r2 = verifyAll({ root: f2.repo, patchesDir: f2.patches, metaDir: f2.metaDir });
    assert.match(r2.report, /should contain `does-not-exist`/);
  } finally {
    rmSync(f2.root, { recursive: true, force: true });
  }
});

test("verifyAll: no vendor meta for a referenced upstream.source fails loudly", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "mattpocock/engineering/tool/one.md",
      recordBody({
        id: "fixture.one",
        file: "skills/fixture/tool/SKILL.md",
        up: { source: "unknown/repo", path: "skills/fixture/tool/SKILL.md" },
        summary: "x",
        origin: "PATCHES.md A-class row #1",
        diff: replaceDiff(LINE, LINE_PATCHED),
      }),
    ]],
  });
  try {
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.match(r.report, /no vendor meta/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

// --- verifyAll: new-file hunks ----------------------------------------------

test("verifyAll: a new-file hunk (--- /dev/null) is byte-compared to local", () => {
  const f = makeFixture({
    base: BASE,
    local: LOCAL,
    recordTexts: [[
      "fixture/create/ref.md",
      recordBody({
        id: "fixture.create",
        file: "skills/fixture/tool/SKILL.md",
        up: { source: "fixture/repo", path: "skills/fixture/tool/SKILL.md" },
        summary: "adds a local reference",
        origin: "PATCHES.md A-class row #1",
        diff:
          replaceDiff(LINE, LINE_PATCHED) +
          "\n" +
          "--- /dev/null\n" +
          "+++ b/skills/fixture/tool/references/guide.md\n" +
          "@@ -0,0 +1,2 @@\n" +
          "+# Guide\n" +
          "+content\n",
      }),
    ]],
  });
  try {
    mkdirSync(join(f.repo, "skills", "fixture", "tool", "references"), { recursive: true });
    writeFileSync(join(f.repo, "skills", "fixture", "tool", "references", "guide.md"), "# Guide\ncontent\n");
    const r = verifyAll({ root: f.repo, patchesDir: f.patches, metaDir: f.metaDir });
    assert.equal(r.failures.length, 0, r.report);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});