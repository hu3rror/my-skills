#!/usr/bin/env node
// Tests for the `vendor-sync merge` subcommand: the three-way-merge mechanics
// moved out of the my-skills-vendor-sync skill body into the script. Offline
// and deterministic — fixture files plus a local fixture upstream repo (git
// init), no network. The script drives `git merge-file` / `git diff --no-index`
// directly, so the fixtures exercise the real mechanics with the same tools.
//
// Coverage note: the reshaped verdict (clean merge, changed lines differ) is
// exercised at the decideVerdict unit level only. git's line-based merge-file
// conflicts on every overlapping edit I probed, and non-overlapping edits
// reproduce the patch's changed lines exactly — a real reshaped case in
// practice is the conservative line-ending/absorbed artifact the skill's old
// `cmp` procedure was designed to catch, not a fixture I can construct with
// plain LF text. The other four verdicts run end-to-end against a fixture repo.

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
  decideVerdict,
  diffChangedLines,
  mergeSource,
  patchLinesEqual,
  runMergeFile,
} from "./vendor-sync.mjs";

// --- git helpers for fixture repos -----------------------------------------

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
  // The script fetches the pinned base SHA over the local transport; serving
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

// A fixture "upstream" repo with the patched file's base (pin) and HEAD
// contents, plus the local consolidated copy under a fixture root. Returns
// everything mergeSource needs to run against it, entirely offline.
function makeFixture(upstreamHead, baseSha) {
  const upstream = mkdtempSync(join(tmpdir(), "merge-upstream-"));
  const root = mkdtempSync(join(tmpdir(), "merge-root-"));
  initRepo(upstream);
  commitFile(upstream, "skill.txt", BASE, "base");
  commitFile(upstream, "skill.txt", upstreamHead, "head");
  const source = {
    name: "fixture",
    url: upstream,
    repo: "fixture/repo",
    targetRoot: "skills/fixture",
    skillRoots: (cloneDir) => [{ upstreamDir: cloneDir, targetRel: "skills/fixture" }],
  };
  const patchedSet = new Set(["skills/fixture/skill.txt"]);
  const pins = new Map([["fixture/repo", baseSha]]);
  const localAbs = join(root, "skills", "fixture", "skill.txt");
  const cleanUp = () => {
    rmSync(upstream, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  };
  return { source, patchedSet, pins, localAbs, root, cleanUp };
}

const BASE = "one\ntwo\nthree\nfour\n";
// Upstream moved line 4 only; the local patch edits line 2 (a context line
// between them keeps the two hunks disjoint, so the merge is clean).
const HEAD_MOVED_ELSEWHERE = "one\ntwo\nthree\nFOUR\n";
// Local patch: line 2 two -> TWO.
const OURS = "one\nTWO\nthree\nfour\n";
// Upstream moved the same line the local patch edits -> conflict.
const HEAD_SAME_LINE = "one\ntw2\nthree\nfour\n";

function writeLocal(localAbs, content) {
  mkdirSync(dirname(localAbs), { recursive: true });
  writeFileSync(localAbs, content);
}

// --- unit: git merge-file invocation ----------------------------------------

test("runMergeFile: clean three-way on non-overlapping edits", () => {
  const dir = mkdtempSync(join(tmpdir(), "mergefile-"));
  try {
    writeFileSync(join(dir, "ours"), OURS);
    writeFileSync(join(dir, "base"), BASE);
    writeFileSync(join(dir, "theirs"), HEAD_MOVED_ELSEWHERE);
    const r = runMergeFile(join(dir, "ours"), join(dir, "base"), join(dir, "theirs"));
    assert.equal(r.clean, true);
    assert.equal(r.status, 0);
    assert.equal(r.merged.toString("utf8"), "one\nTWO\nthree\nFOUR\n");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runMergeFile: same line edited on both sides -> conflict (exit 1)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mergefile-"));
  try {
    writeFileSync(join(dir, "ours"), OURS);
    writeFileSync(join(dir, "base"), BASE);
    writeFileSync(join(dir, "theirs"), HEAD_SAME_LINE);
    const r = runMergeFile(join(dir, "ours"), join(dir, "base"), join(dir, "theirs"));
    assert.equal(r.clean, false);
    assert.equal(r.status, 1);
    // Markers carry the absolute file paths (git merge-file behavior).
    assert.match(r.merged.toString("utf8"), /<<<<<<< /);
    assert.match(r.merged.toString("utf8"), />>>>>>> /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- unit: patch-survival comparison ----------------------------------------

test("diffChangedLines: extracts the changed lines, dropping context and headers", () => {
  const dir = mkdtempSync(join(tmpdir(), "difflines-"));
  try {
    writeFileSync(join(dir, "base"), BASE);
    writeFileSync(join(dir, "ours"), OURS);
    // Only the changed line pair survives: context, @@ hunks, ---/+++ headers
    // and the no-newline marker are all dropped. Lines are raw bytes (Buffer).
    assert.deepEqual(diffChangedLines(join(dir, "base"), join(dir, "ours")), [
      Buffer.from("two"),
      Buffer.from("TWO"),
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("diffChangedLines: identical files -> no changed lines", () => {
  const dir = mkdtempSync(join(tmpdir(), "difflines-"));
  try {
    writeFileSync(join(dir, "a"), BASE);
    writeFileSync(join(dir, "b"), BASE);
    assert.deepEqual(diffChangedLines(join(dir, "a"), join(dir, "b")), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("diffChangedLines: added/removed lines keep their content after the marker", () => {
  const dir = mkdtempSync(join(tmpdir(), "difflines-"));
  try {
    writeFileSync(join(dir, "a"), "x\n");
    writeFileSync(join(dir, "b"), "x\n+plus\n");
    // The added line's content starts with `+`; only the diff marker is
    // stripped, so the survival comparison sees the real content.
    assert.deepEqual(diffChangedLines(join(dir, "a"), join(dir, "b")), [Buffer.from("+plus")]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("diffChangedLines: binary diff -> null, so a patch can never be proven by an empty diff", () => {
  const dir = mkdtempSync(join(tmpdir(), "difflines-"));
  try {
    writeFileSync(join(dir, "a"), Buffer.from([0x61, 0x00, 0x62])); // NUL byte
    writeFileSync(join(dir, "b"), "c\n");
    // git reports "Binary files … differ" (exit 1); the changed lines would be
    // meaningless text, so the survival proof must not run on them.
    assert.equal(diffChangedLines(join(dir, "a"), join(dir, "b")), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("patchLinesEqual: null (untrustworthy lines) never equals anything", () => {
  assert.equal(patchLinesEqual(null, ["a"]), false);
  assert.equal(patchLinesEqual(["a"], null), false);
  assert.equal(patchLinesEqual(null, null), false);
});

test("patchLinesEqual: order matters, length matters", () => {
  assert.equal(patchLinesEqual(["a", "b"], ["a", "b"]), true);
  assert.equal(patchLinesEqual(["a", "b"], ["b", "a"]), false);
  assert.equal(patchLinesEqual(["a"], ["a", "b"]), false);
  assert.equal(patchLinesEqual([], []), true);
});

// --- unit: the verdict classifier -------------------------------------------

test("decideVerdict: clean merge with identical changed lines -> merged", () => {
  const verdict = decideVerdict({
    clean: true,
    status: 0,
    ours: Buffer.from(OURS),
    theirs: Buffer.from(HEAD_MOVED_ELSEWHERE),
    oldLines: ["two", "TWO"],
    newLines: ["two", "TWO"],
  });
  assert.equal(verdict, "merged");
});

test("decideVerdict: clean merge whose changed lines differ -> reshaped", () => {
  // The re-applied patch changed different lines (or line endings moved): the
  // conservative no-write case — the old `cmp old.patch new.patch` mismatch.
  const verdict = decideVerdict({
    clean: true,
    status: 0,
    ours: Buffer.from("a\nB\nc\n"),
    theirs: Buffer.from("B\na\nb\nc\n"),
    oldLines: ["b", "B"],
    newLines: ["b", "a", "B"],
  });
  assert.equal(verdict, "reshaped");
});

test("decideVerdict: clean merge, local copy equals upstream HEAD -> adopted", () => {
  const verdict = decideVerdict({
    clean: true,
    status: 0,
    ours: Buffer.from(HEAD_MOVED_ELSEWHERE),
    theirs: Buffer.from(HEAD_MOVED_ELSEWHERE),
    oldLines: ["two", "TWO"], // irrelevant: adopted short-circuits
    newLines: [],
  });
  assert.equal(verdict, "adopted");
});

test("decideVerdict: merge-file exit 1 -> conflict, any other failure -> error", () => {
  assert.equal(
    decideVerdict({ clean: false, status: 1, ours: Buffer.alloc(0), theirs: Buffer.alloc(0), oldLines: [], newLines: [] }),
    "conflict",
  );
  assert.equal(
    decideVerdict({ clean: false, status: 128, ours: Buffer.alloc(0), theirs: Buffer.alloc(0), oldLines: [], newLines: [] }),
    "error",
  );
});

// --- integration: mergeSource against a fixture repo -------------------------
// base = BASE, head = fixture HEAD, local = the patched copy. The pinned base
// SHA is fetched over the local transport (allowReachableSHA1InWant above).

test("mergeSource: clean merge writes the surviving patch over the copy", () => {
  const f = makeFixture(HEAD_MOVED_ELSEWHERE, /* baseSha */ null);
  try {
    const baseSha = git(f.source.url, ["rev-parse", "HEAD~1"]);
    f.pins.set("fixture/repo", baseSha);
    writeLocal(f.localAbs, OURS);
    const r = mergeSource(f.source, f.patchedSet, f.pins, new Map(), f.root, false);
    assert.equal(r.errors.length, 0);
    assert.equal(r.items.length, 1);
    assert.equal(r.items[0].verdict, "merged");
    assert.equal(r.items[0].written, true);
    // The merged content keeps the local patch (TWO) and takes upstream's
    // change (FOUR).
    assert.equal(readFileSync(f.localAbs, "utf8"), "one\nTWO\nthree\nFOUR\n");
  } finally {
    f.cleanUp();
  }
});

test("mergeSource: conflict writes nothing and keeps both sides for the human", () => {
  const f = makeFixture(HEAD_SAME_LINE, /* baseSha */ null);
  try {
    const baseSha = git(f.source.url, ["rev-parse", "HEAD~1"]);
    f.pins.set("fixture/repo", baseSha);
    writeLocal(f.localAbs, OURS);
    const r = mergeSource(f.source, f.patchedSet, f.pins, new Map(), f.root, false);
    assert.equal(r.errors.length, 0);
    assert.equal(r.items[0].verdict, "conflict");
    assert.equal(r.items[0].written, undefined);
    // Local copy untouched.
    assert.equal(readFileSync(f.localAbs, "utf8"), OURS);
    // Evidence preserved: marked merge + a diff3 view with the base.
    const dir = r.items[0].tmpDir;
    assert.ok(dir, "conflict temp dir must be reported");
    assert.match(readFileSync(join(dir, "merged"), "utf8"), /<<<<<<< /);
    assert.match(readFileSync(join(dir, "merged.diff3"), "utf8"), /\|\|\|\|\|\|\| /);
  } finally {
    f.cleanUp();
  }
});

test("mergeSource: upstream adopted the patch -> adopted, copy untouched", () => {
  const f = makeFixture(HEAD_MOVED_ELSEWHERE, /* baseSha */ null);
  try {
    const baseSha = git(f.source.url, ["rev-parse", "HEAD~1"]);
    f.pins.set("fixture/repo", baseSha);
    // Local copy already equals upstream HEAD: upstream shipped our patch.
    writeLocal(f.localAbs, HEAD_MOVED_ELSEWHERE);
    const r = mergeSource(f.source, f.patchedSet, f.pins, new Map(), f.root, false);
    assert.equal(r.items[0].verdict, "adopted");
    assert.equal(r.items[0].written, undefined);
    assert.equal(readFileSync(f.localAbs, "utf8"), HEAD_MOVED_ELSEWHERE);
  } finally {
    f.cleanUp();
  }
});

test("mergeSource: dry run reports merged but writes nothing", () => {
  const f = makeFixture(HEAD_MOVED_ELSEWHERE, /* baseSha */ null);
  try {
    const baseSha = git(f.source.url, ["rev-parse", "HEAD~1"]);
    f.pins.set("fixture/repo", baseSha);
    writeLocal(f.localAbs, OURS);
    const r = mergeSource(f.source, f.patchedSet, f.pins, new Map(), f.root, true);
    assert.equal(r.items[0].verdict, "merged");
    assert.equal(r.items[0].written, false);
    assert.equal(readFileSync(f.localAbs, "utf8"), OURS);
  } finally {
    f.cleanUp();
  }
});

test("mergeSource: unfetchable pin falls back to no-pin with a preserved diff", () => {
  const f = makeFixture(HEAD_SAME_LINE, /* baseSha */ null);
  try {
    // An all-zero SHA cannot be fetched even with allowReachableSHA1InWant.
    f.pins.set("fixture/repo", "0".repeat(40));
    writeLocal(f.localAbs, OURS);
    const r = mergeSource(f.source, f.patchedSet, f.pins, new Map(), f.root, false);
    assert.equal(r.errors.length, 0);
    assert.equal(r.items[0].verdict, "no-pin");
    assert.equal(r.items[0].written, undefined);
    assert.equal(readFileSync(f.localAbs, "utf8"), OURS);
    const dir = r.items[0].tmpDir;
    assert.ok(dir, "no-pin temp dir must be reported");
    assert.ok(readFileSync(join(dir, "ours"), "utf8"));
    assert.ok(readFileSync(join(dir, "theirs"), "utf8"));
    // The reconcile diff the skill's no-pin step promised.
    assert.ok(readFileSync(join(dir, "ours-vs-theirs.diff"), "utf8"));
  } finally {
    f.cleanUp();
  }
});
