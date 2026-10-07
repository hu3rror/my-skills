// Tests for scripts/repo-guard.mjs: the aggregation-repo identity check the
// maintenance scripts derive their root from (ADR-0009). The guard must
// accept the real aggregation repo and refuse anything else — a foreign
// directory, a bare git repo, or a clone whose origin is not
// hu3rror/my-skills — and assertRepoDir must throw a user-facing error that
// says how to point elsewhere. Offline fixtures; the identity half spawns
// git (available in CI and on this machine; the shape half needs no git).

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { assertRepoDir, verifyRepoDir } from "./repo-guard.mjs";

// The suite's own script-relative root — the real aggregation repo, derived
// the same way the guarded scripts derive theirs (not from the run cwd).
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "repo-guard-"));
  return { root };
}

function shapedRepo(root) {
  // Meets the shape half (scripts/vendor-sync.mjs + skills/); git half varies.
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "skills"), { recursive: true });
  writeFileSync(join(root, "scripts", "vendor-sync.mjs"), "// fixture\n");
}

function gitRoot(root) {
  const init = spawnSync("git", ["init", "-q", root], { encoding: "utf8" });
  if (init.status !== 0) return false;
  return true;
}

function setOrigin(root, url) {
  return spawnSync("git", ["-C", root, "remote", "add", "origin", url], { encoding: "utf8" })
    .status === 0;
}

test("a directory without the aggregation repo's shape is refused", () => {
  const d = fixture();
  try {
    const v = verifyRepoDir(d.root);
    assert.equal(v.ok, false);
    assert.match(v.reason, /vendor-sync\.mjs/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a shaped directory that is not a git repo is refused", () => {
  const d = fixture();
  try {
    shapedRepo(d.root);
    const v = verifyRepoDir(d.root);
    assert.equal(v.ok, false);
    assert.match(v.reason, /git repo|origin/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("a shaped git repo whose origin is not my-skills is refused", () => {
  const d = fixture();
  try {
    shapedRepo(d.root);
    if (!gitRoot(d.root) || !setOrigin(d.root, "https://github.com/someone/else.git")) {
      return; // git unavailable: the shape half already covers the offline gate
    }
    const v = verifyRepoDir(d.root);
    assert.equal(v.ok, false);
    assert.match(v.reason, /someone|origin/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("the aggregation repo's origin passes the identity check", () => {
  const d = fixture();
  try {
    shapedRepo(d.root);
    if (!gitRoot(d.root) || !setOrigin(d.root, "https://github.com/hu3rror/my-skills.git")) {
      return; // git unavailable: skip the positive branch
    }
    const v = verifyRepoDir(d.root);
    assert.equal(v.ok, true);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("assertRepoDir throws a user-facing pointer error for a foreign directory", () => {
  const d = fixture();
  try {
    // The default hint addresses scripts without a --repo flag (vendor-sync /
    // verify-patch-records run from inside the repo); the explicit flag form
    // prints the --repo pointer for consolidate-strays.
    assert.throws(() => assertRepoDir(d.root), /Run it from inside the aggregation repo/);
    assert.throws(() => assertRepoDir(d.root), /my-skills/);
    assert.throws(() => assertRepoDir(d.root, { flag: "--repo" }), /--repo/);
  } finally {
    rmSync(d.root, { recursive: true, force: true });
  }
});

test("assertRepoDir accepts the real aggregation repo", () => {
  assert.doesNotThrow(() => assertRepoDir(REPO));
  assert.equal(existsSync(join(REPO, "scripts", "vendor-sync.mjs")), true);
});