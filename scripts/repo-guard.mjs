// repo-guard.mjs — shared aggregation-repo identity check (ADR-0009).
//
// The maintenance scripts derive their repo root from their own location
// (`resolve(dirname(fileURLToPath(import.meta.url)), "..")`) — correct while
// the script travels with the aggregation repo, but silent garbage if the
// script ever runs from a copy outside it. ADR-0009: refuse instead of
// assuming. verifyRepoDir checks shape (scripts/vendor-sync.mjs + skills/)
// and identity (git origin ends with /my-skills); assertRepoDir throws the
// user-facing error naming what was checked and how to point elsewhere
// (--repo for consolidate-strays, $REPO for the maintenance skill). Zero
// dependencies; runs under PowerShell and in WSL.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const IDENTITY_SUFFIXES = ["my-skills", "my-skills.git"];

export function verifyRepoDir(repo) {
  if (
    !existsSync(join(repo, "scripts", "vendor-sync.mjs")) ||
    !existsSync(join(repo, "skills"))
  ) {
    return {
      ok: false,
      reason: `${repo} has no scripts/vendor-sync.mjs or skills/ — not the aggregation repo layout`,
    };
  }
  const git = spawnSync("git", ["-C", repo, "remote", "get-url", "origin"], {
    encoding: "utf8",
  });
  if (git.status !== 0 || !git.stdout) {
    return {
      ok: false,
      reason: `${repo} is not a git repo with an origin remote`,
    };
  }
  const remote = git.stdout.trim().toLowerCase();
  if (!IDENTITY_SUFFIXES.some((s) => remote.endsWith(s))) {
    return {
      ok: false,
      reason: `${repo} origin is ${remote}, not hu3rror/my-skills (ADR-0009 identity check)`,
    };
  }
  return { ok: true };
}

export function assertRepoDir(repo, { flag } = {}) {
  const v = verifyRepoDir(repo);
  if (v.ok) return;
  const hint = flag
    ? `Point at it explicitly: ${flag}`
    : `Run it from inside the aggregation repo, or fix the repo anchor (~/.agents/.my-skills-repo).`;
  throw new Error(
    `not the my-skills aggregation repo: ${v.reason}.\n` +
      `Expecting the aggregation repo root (the clone of hu3rror/my-skills).\n` +
      `${hint}`,
  );
}