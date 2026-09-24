#!/usr/bin/env node
// Skill hygiene: no distributed skill may hardcode a machine-specific path.
//
// The skills under skills/ are distributed to the canonical store and served
// to every harness on every machine, so a path that names this user or this
// host (a Windows / macOS / Linux home directory, a WSL drive mount) breaks the
// moment the skill runs anywhere else. Portable forms are `~`, environment
// variables, or repo-relative paths. A placeholder like `C:/path/to/<script>`
// is documentation, not a machine path, and stays legal — only user/host
// signatures are rejected. Runs in the script-tests CI job.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = join(REPO, "skills");

// Signatures of a user- or host-specific path. Generic documentation paths
// (`C:/path/to/<file>`, `C:/src/file.js`) match none of these and stay legal.
const MACHINE_PATH_PATTERNS = [
  /[A-Za-z]:[\\/]Users[\\/]/i, // Windows user profile (C:\Users\<name>\...)
  /\/Users\/[A-Za-z0-9._-]+/, // macOS home (/Users/<name>/...)
  /\/home\/[A-Za-z0-9._-]+/, // Linux home (/home/<name>/...)
  /\/mnt\/[a-z]\//i, // WSL drive mount (/mnt/c/...)
];

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

test("distributed skills contain no machine-specific paths", () => {
  const offenders = [];
  for (const file of walkFiles(SKILLS)) {
    const buf = readFileSync(file);
    if (buf.includes(0)) continue; // binary / non-UTF-8: no text paths to scan
    const rel = relative(REPO, file).split(sep).join("/");
    buf
      .toString("utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        for (const re of MACHINE_PATH_PATTERNS) {
          const match = line.match(re);
          if (match) offenders.push(`${rel}:${i + 1}: ${match[0]}`);
        }
      });
  }
  assert.ok(
    offenders.length === 0,
    `machine-specific path(s) found in distributed skills:\n${offenders.join("\n")}`,
  );
});
