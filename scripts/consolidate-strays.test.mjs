// Fixture-based tests for scripts/consolidate-strays.mjs (T1: dry-run
// classification report; T2: explicit apply). Offline and deterministic: fake
// store, fake pi junction farm, fake lock file, fake repo layout in temp
// directories. Asserts external behavior (classification, report output,
// copied files, untouched store, idempotent re-runs) via the Node built-in
// test runner — the repo gains no dependency.

import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import {
  applyStray,
  consolidate,
  directoriesEqual,
  scanSkillDirectories,
} from "./consolidate-strays.mjs";

const SCRIPT = fileURLToPath(new URL("./consolidate-strays.mjs", import.meta.url));

// --- fixture helpers --------------------------------------------------------

function makeTree(root, paths) {
  for (const [file, content] of Object.entries(paths)) {
    const p = join(root, file);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}

function writeLock(lockPath, skills) {
  writeFileSync(lockPath, JSON.stringify({ version: 3, skills }));
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "consolidate-"));
  const dirs = {
    root,
    store: join(root, "store"),
    pi: join(root, "pi"),
    repo: join(root, "repo"),
    lock: join(root, ".skill-lock.json"),
  };
  mkdirSync(dirs.store, { recursive: true });
  mkdirSync(dirs.pi, { recursive: true });
  mkdirSync(dirs.repo, { recursive: true });
  return dirs;
}

// Snapshot of a directory tree (files with content, links with target) used
// to prove dry-run mode writes or modifies nothing.
function snapshot(dir) {
  const out = new Map();
  if (!existsSync(dir)) return out;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      const key = relative(dir, p);
      if (entry.isSymbolicLink()) out.set(key, "LINK:" + readlinkSync(p));
      else if (entry.isDirectory()) walk(p);
      else out.set(key, "FILE:" + readFileSync(p, "utf8"));
    }
  };
  walk(dir);
  return out;
}

// --- classification ----------------------------------------------------------

test("a store skill absent from the lock file and the repo is a new stray with its proposed destination", () => {
  const d = fixture();
  try {
    makeTree(d.store, {
      "tracked/SKILL.md": "hello",
      "brand-new/SKILL.md": "new skill",
    });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "hello" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });

    const { classified, report } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    const byName = Object.fromEntries(classified.map((c) => [c.name, c]));
    assert.equal(byName["brand-new"].kind, "new-stray");
    assert.equal(byName["brand-new"].destination, "skills/other/brand-new");
    assert.equal(byName["tracked"].kind, "current");
    assert.match(report, /brand-new -> skills\/other\/brand-new/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a tracked skill whose content differs from its consolidated copy is a modified stray", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "locally edited" });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "original" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });

    const { classified } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    const tracked = classified.find((c) => c.name === "tracked");
    assert.equal(tracked.kind, "modified-stray");
    assert.equal(tracked.destination, "skills/tracked");
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a tracked skill whose content matches its consolidated copy is current, never a stray", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "same", "tracked/refs/notes.md": "notes" });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "same", "skills/tracked/refs/notes.md": "notes" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });

    const { classified, report } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    assert.deepEqual(
      classified.map((c) => [c.name, c.kind]),
      [["tracked", "current"]]
    );
    assert.match(report, /Totals: 1 current, 0 new stray, 0 modified stray\./);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

// --- junction farm ------------------------------------------------------------

test("junction entries in the pi junction farm are skipped and never reported as strays", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "x" });
    // Junction to the store (what npx skills creates) plus a real directory
    // written straight into the farm.
    symlinkSync(join(d.store, "tracked"), join(d.pi, "tracked"), "junction");
    makeTree(d.pi, { "farm-stray/SKILL.md": "written into the farm" });

    assert.deepEqual(
      scanSkillDirectories(d.pi).map((s) => s.name),
      ["farm-stray"]
    );
    assert.deepEqual(
      scanSkillDirectories(d.store).map((s) => s.name),
      ["tracked"]
    );

    makeTree(d.repo, { "skills/tracked/SKILL.md": "x" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });
    const { classified } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    const names = classified.map((c) => c.name).sort();
    assert.deepEqual(names, ["farm-stray", "tracked"]);
    assert.equal(classified.find((c) => c.name === "farm-stray").kind, "new-stray");
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("directoriesEqual detects a content difference, including in a nested file", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "sk/notes.md": "same", "sk/scripts/a.sh": "v1" });
    makeTree(d.repo, { "sk/notes.md": "same", "sk/scripts/a.sh": "v2" });
    assert.equal(directoriesEqual(join(d.store, "sk"), join(d.repo, "sk")), false);
    makeTree(d.repo, { "sk/scripts/a.sh": "v1" });
    assert.equal(directoriesEqual(join(d.store, "sk"), join(d.repo, "sk")), true);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a tracked skill whose only difference is line endings is current, not a modified stray", () => {
  const d = fixture();
  try {
    // Windows-installed store copy carries CRLF; the repo consolidated copy
    // is LF. Line-ending drift is a distribution artifact, never a stray.
    mkdirSync(join(d.store, "tracked"), { recursive: true });
    writeFileSync(join(d.store, "tracked", "SKILL.md"), "line1\r\nline2\r\n");
    makeTree(d.repo, { "skills/tracked/SKILL.md": "line1\nline2\n" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });

    const { classified } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    assert.equal(classified.find((c) => c.name === "tracked").kind, "current");
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a store skill absent from the lock but already consolidated in the repo is current, not a new stray", () => {
  const d = fixture();
  try {
    // e.g. consolidated into the unattributed home without the lock being
    // regenerated yet: nothing to recover, so not a stray.
    makeTree(d.store, { "brand-new/SKILL.md": "content" });
    makeTree(d.repo, { "skills/other/brand-new/SKILL.md": "content" });
    writeLock(d.lock, {});

    const { classified } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    const stray = classified.find((c) => c.name === "brand-new");
    assert.equal(stray.kind, "current");
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a store skill absent from the lock but differing from its repo consolidated copy is a modified stray", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "brand-new/SKILL.md": "edited after consolidation" });
    makeTree(d.repo, { "skills/other/brand-new/SKILL.md": "consolidated once" });
    writeLock(d.lock, {});

    const { classified } = consolidate({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
    });
    const stray = classified.find((c) => c.name === "brand-new");
    assert.equal(stray.kind, "modified-stray");
    assert.equal(stray.destination, "skills/other/brand-new");
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

// --- dry-run safety -----------------------------------------------------------

test("CLI exits 0 with no strays and 2 when strays exist", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "same" });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "same" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });

    const args = [SCRIPT, "--store", d.store, "--pi", d.pi, "--lock", d.lock, "--repo", d.repo];
    const clean = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(clean.status, 0);
    assert.match(clean.stdout, /Totals: 1 current, 0 new stray, 0 modified stray\./);

    makeTree(d.store, { "brand-new/SKILL.md": "stray" });
    const dirty = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(dirty.status, 2);
    assert.match(dirty.stdout, /brand-new -> skills\/other\/brand-new/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("dry-run mode writes or modifies nothing in the store, farm, lock, or repo", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "hello", "brand-new/SKILL.md": "new" });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "hello" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });
    symlinkSync(join(d.store, "tracked"), join(d.pi, "tracked"), "junction");

    const before = {
      store: snapshot(d.store),
      pi: snapshot(d.pi),
      repo: snapshot(d.repo),
      lock: snapshot(dirname(d.lock)),
    };
    consolidate({ store: d.store, pi: d.pi, lock: d.lock, repo: d.repo });
    const after = {
      store: snapshot(d.store),
      pi: snapshot(d.pi),
      repo: snapshot(d.repo),
      lock: snapshot(dirname(d.lock)),
    };
    assert.deepEqual(after, before);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

// --- apply ------------------------------------------------------------------

test("apply copies a new stray into the unattributed home by default", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "brand-new/SKILL.md": "new skill" });
    writeLock(d.lock, {});

    const result = applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "brand-new",
    });
    assert.equal(result.applied, true);
    assert.equal(result.kind, "new-stray");
    assert.equal(result.destination, "skills/other/brand-new");
    assert.equal(
      readFileSync(join(d.repo, "skills", "other", "brand-new", "SKILL.md"), "utf8"),
      "new skill"
    );
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("apply with the self-authored target copies into the self-authored home", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "my-skill/SKILL.md": "mine" });
    writeLock(d.lock, {});

    const result = applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "my-skill",
      home: "self",
    });
    assert.equal(result.applied, true);
    assert.equal(result.destination, "skills/self/my-skill");
    assert.equal(
      readFileSync(join(d.repo, "skills", "self", "my-skill", "SKILL.md"), "utf8"),
      "mine"
    );
    // nothing landed in the unattributed home
    assert.equal(existsSync(join(d.repo, "skills", "other", "my-skill")), false);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("apply preserves the nested file structure and leaves the store copy untouched", () => {
  const d = fixture();
  try {
    makeTree(d.store, {
      "brand-new/SKILL.md": "new skill",
      "brand-new/refs/notes.md": "notes",
      "brand-new/scripts/a.sh": "echo hi",
    });
    writeLock(d.lock, {});
    const storeBefore = snapshot(d.store);

    applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "brand-new",
    });

    const copied = join(d.repo, "skills", "other", "brand-new");
    for (const f of ["SKILL.md", "refs/notes.md", "scripts/a.sh"]) {
      assert.equal(
        readFileSync(join(copied, f), "utf8"),
        readFileSync(join(d.store, "brand-new", f), "utf8")
      );
    }
    assert.deepEqual(snapshot(d.store), storeBefore);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("applying twice is a no-op on the second run and produces no duplicates", () => {
  const d = fixture();
  try {
    makeTree(d.store, {
      "brand-new/SKILL.md": "new skill",
      "brand-new/refs/notes.md": "n",
    });
    writeLock(d.lock, {});

    const first = applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "brand-new",
    });
    assert.equal(first.applied, true);
    const repoAfterFirst = snapshot(d.repo);

    const second = applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "brand-new",
    });
    assert.equal(second.applied, false);
    assert.equal(second.kind, "current");
    assert.equal(second.destination, "skills/other/brand-new");
    assert.deepEqual(snapshot(d.repo), repoAfterFirst);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("apply of a skill already consolidated in the repo is a no-op", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "brand-new/SKILL.md": "content" });
    makeTree(d.repo, { "skills/other/brand-new/SKILL.md": "content" });
    writeLock(d.lock, {});
    const repoBefore = snapshot(d.repo);

    const result = applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "brand-new",
    });
    assert.equal(result.applied, false);
    assert.equal(result.kind, "current");
    assert.equal(result.destination, "skills/other/brand-new");
    assert.deepEqual(snapshot(d.repo), repoBefore);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("apply refuses a modified stray and touches neither the consolidated copy nor the store", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "locally edited" });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "original" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });
    const repoBefore = snapshot(d.repo);
    const storeBefore = snapshot(d.store);

    assert.throws(
      () =>
        applyStray({
          store: d.store,
          pi: d.pi,
          lock: d.lock,
          repo: d.repo,
          name: "tracked",
        }),
      /modified stray/
    );
    assert.deepEqual(snapshot(d.repo), repoBefore);
    assert.deepEqual(snapshot(d.store), storeBefore);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("apply copies a stray written directly into the pi junction farm", () => {
  const d = fixture();
  try {
    makeTree(d.pi, { "farm-stray/SKILL.md": "written into the farm" });
    writeLock(d.lock, {});

    const result = applyStray({
      store: d.store,
      pi: d.pi,
      lock: d.lock,
      repo: d.repo,
      name: "farm-stray",
    });
    assert.equal(result.applied, true);
    assert.equal(
      readFileSync(join(d.repo, "skills", "other", "farm-stray", "SKILL.md"), "utf8"),
      "written into the farm"
    );
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("apply with an unknown skill name or an invalid home errors", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "brand-new/SKILL.md": "x" });
    writeLock(d.lock, {});
    assert.throws(
      () => applyStray({ store: d.store, pi: d.pi, lock: d.lock, repo: d.repo, name: "nope" }),
      /no skill named "nope"/
    );
    assert.throws(
      () =>
        applyStray({
          store: d.store,
          pi: d.pi,
          lock: d.lock,
          repo: d.repo,
          name: "brand-new",
          home: "vendor",
        }),
      /invalid home "vendor"/
    );
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("CLI apply copies a new stray and a second run is a no-op", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "brand-new/SKILL.md": "new skill" });
    writeLock(d.lock, {});
    const args = [
      SCRIPT,
      "--store", d.store,
      "--pi", d.pi,
      "--lock", d.lock,
      "--repo", d.repo,
      "--apply", "brand-new",
    ];

    const first = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(first.status, 0);
    assert.match(first.stdout, /Applied new stray/);
    assert.match(first.stdout, /brand-new \(new-stray\) -> skills\/other\/brand-new/);
    assert.match(first.stdout, /Store copy left in place; pi keeps serving the skill/);
    assert.equal(
      readFileSync(join(d.repo, "skills", "other", "brand-new", "SKILL.md"), "utf8"),
      "new skill"
    );

    const repoAfterFirst = snapshot(d.repo);
    const second = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(second.status, 0);
    assert.match(second.stdout, /nothing to apply/);
    assert.deepEqual(snapshot(d.repo), repoAfterFirst);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("CLI apply with --to self copies into the self-authored home", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "my-skill/SKILL.md": "mine" });
    writeLock(d.lock, {});

    const res = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--store", d.store,
        "--pi", d.pi,
        "--lock", d.lock,
        "--repo", d.repo,
        "--apply", "my-skill",
        "--to", "self",
      ],
      { encoding: "utf8" }
    );
    assert.equal(res.status, 0);
    assert.match(res.stdout, /my-skill \(new-stray\) -> skills\/self\/my-skill/);
    assert.equal(
      readFileSync(join(d.repo, "skills", "self", "my-skill", "SKILL.md"), "utf8"),
      "mine"
    );
    assert.equal(existsSync(join(d.repo, "skills", "other", "my-skill")), false);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("CLI apply errors on a modified stray and on an invalid --to value", () => {
  const d = fixture();
  try {
    makeTree(d.store, { "tracked/SKILL.md": "locally edited" });
    makeTree(d.repo, { "skills/tracked/SKILL.md": "original" });
    writeLock(d.lock, { tracked: { skillPath: "skills/tracked/SKILL.md" } });
    const repoBefore = snapshot(d.repo);

    const modified = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--store", d.store,
        "--pi", d.pi,
        "--lock", d.lock,
        "--repo", d.repo,
        "--apply", "tracked",
      ],
      { encoding: "utf8" }
    );
    assert.equal(modified.status, 1);
    assert.match(modified.stderr, /modified stray/);
    assert.deepEqual(snapshot(d.repo), repoBefore);

    const badTo = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--store", d.store,
        "--pi", d.pi,
        "--lock", d.lock,
        "--repo", d.repo,
        "--apply", "tracked",
        "--to", "vendor",
      ],
      { encoding: "utf8" }
    );
    assert.equal(badTo.status, 1);
    assert.match(badTo.stderr, /invalid --to value "vendor"/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

