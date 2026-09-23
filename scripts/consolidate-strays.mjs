#!/usr/bin/env node
// consolidate-strays.mjs — classification and recovery for the canonical
// skills store against the distribution chain's lock file and the aggregation
// repo's consolidated copies (stray-skill consolidation spec, #9: T1
// classification report, T2 explicit apply).
//
// Every skill found in the store (and any real, non-junction directory in the
// pi junction farm) is classified as one of:
//   - new stray:       absent from the lock file and not consolidated in the
//                      repo -> proposed destination is the unattributed home
//                      (skills/other/<name>) while provenance is unknown;
//   - modified stray:  tracked by the lock but differing from its consolidated
//                      copy -> destination is the consolidated copy;
//   - current:         content matches its consolidated copy.
//
// Junction entries in ~/.pi/agent/skills are distribution artifacts, never
// strays, and are skipped. The default mode is dry-run: nothing is written or
// modified. An explicit --apply <name> copies that new stray into the repo —
// skills/other/<name> by default (provenance unknown), skills/self/<name> with
// --to self. The store copy stays in place; running apply again is a no-op.
// Modified strays are report-only: apply never copies one (their recovery is
// T3). All roots are parameterized with home-derived defaults so fixtures drive
// the same logic offline. Zero dependencies; runs under PowerShell and in WSL.

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO = resolve(SCRIPT_DIR, "..");

const defaultStore = () => join(homedir(), ".agents", "skills");
const defaultPi = () => join(homedir(), ".pi", "agent", "skills");
const defaultLock = () => join(homedir(), ".agents", ".skill-lock.json");

const toPortable = (p) => p.split(sep).join("/");

// --- scanning ---------------------------------------------------------------

// Real skill directories under a scan root. Junctions and symlinks are never
// skills: in the pi junction farm they are distribution artifacts; in the
// store a junction would alias another location rather than hold content.
export function scanSkillDirectories(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => isRealDirectory(join(dir, name)))
    .map((name) => ({ name, dir: join(dir, name) }));
}

// lstat never follows links: a junction or symlink reports isSymbolicLink()
// and isDirectory() === false, so both checks agree and links are excluded.
function isRealDirectory(p) {
  let st;
  try {
    st = lstatSync(p);
  } catch {
    return false;
  }
  return st.isDirectory() && !st.isSymbolicLink();
}

// --- comparison -------------------------------------------------------------

// Recursively collect the files under a directory (symbolic links are not
// content and are skipped).
function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (!entry.isSymbolicLink()) out.push(p);
    }
  };
  walk(dir);
  return out;
}

// Whether two directories hold the same files with the same content. Text
// files are compared modulo line endings: a Windows-installed store carries
// CRLF while the repo normalizes to LF, and that drift is a distribution
// artifact, not a local edit. Files that are not UTF-8 text (e.g. source
// files with NUL bytes) are compared byte-exact so nothing is ever mangled.
function normalizedContent(buf) {
  if (buf.includes(0)) return buf; // binary / non-UTF-8 text: byte-exact
  return Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n"), "utf8");
}

export function directoriesEqual(a, b) {
  const filesOf = (root) => {
    const map = new Map();
    for (const f of listFiles(root)) map.set(toPortable(relative(root, f)), f);
    return map;
  };
  const fa = filesOf(a);
  const fb = filesOf(b);
  if (fa.size !== fb.size) return false;
  for (const [rel, pa] of fa) {
    const pb = fb.get(rel);
    if (pb === undefined) return false;
    if (readFileSync(pa).equals(readFileSync(pb))) continue;
    if (!normalizedContent(readFileSync(pa)).equals(normalizedContent(readFileSync(pb)))) return false;
  }
  return true;
}

// --- classification ---------------------------------------------------------

// Index the repo's consolidated copies by skill name, wherever they live
// (skills/self/, skills/other/, or a vendored source tree). A consolidated
// copy is any directory named like the skill that holds its SKILL.md.
function indexRepoCopies(repoRoot) {
  const map = new Map();
  const skillsRoot = join(repoRoot, "skills");
  if (!existsSync(skillsRoot)) return map;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const p = join(d, entry.name);
      if (map.has(entry.name) || !existsSync(join(p, "SKILL.md"))) {
        walk(p);
      } else {
        map.set(entry.name, p);
      }
    }
  };
  walk(skillsRoot);
  return map;
}

// Classify scanned skills against the lock's tracked set and the repo's
// consolidated copies. A skill is a new stray only when it is absent from the
// lock AND not consolidated in the repo; if a consolidated copy exists
// somewhere, the skill compares against it instead (content equal -> current,
// differing -> modified stray).
export function classifyStrays(skills, lock, repoRoot) {
  const tracked = (lock && lock.skills) || {};
  const repoCopies = indexRepoCopies(repoRoot);
  return skills.map((skill) => {
    const lockEntry = tracked[skill.name];
    const repoCopy = lockEntry
      ? resolve(repoRoot, dirname(lockEntry.skillPath))
      : repoCopies.get(skill.name);
    if (repoCopy === undefined) {
      return {
        ...skill,
        kind: "new-stray",
        destination: toPortable(join("skills", "other", skill.name)),
      };
    }
    const destination = toPortable(
      lockEntry ? dirname(lockEntry.skillPath) : relative(repoRoot, repoCopy)
    );
    const same = existsSync(repoCopy) && directoriesEqual(skill.dir, repoCopy);
    return same
      ? { ...skill, kind: "current", destination }
      : { ...skill, kind: "modified-stray", destination };
  });
}

// Scan both roots and classify every skill against the lock and the repo.
// Shared by the dry-run report and apply so the two actions cannot drift.
function classify({ store, pi, lock, repo }) {
  const lockData = loadLock(lock);
  const skills = [...scanSkillDirectories(store), ...scanSkillDirectories(pi)];
  return classifyStrays(skills, lockData, repo);
}

// --- apply ------------------------------------------------------------------

// Copy the contents of a source tree into a destination, preserving the
// relative layout. Symbolic links are not content (matching directoriesEqual)
// and are skipped. Files are written in place, so copying into a destination
// that already exists (an empty or partial directory) converges to the same
// tree instead of duplicating. Idempotency of the apply action itself comes
// from re-classification, which short-circuits before this ever runs.
function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const file of listFiles(src)) {
    const out = join(dest, relative(src, file));
    mkdirSync(dirname(out), { recursive: true });
    copyFileSync(file, out);
  }
}

// Explicitly copy one new stray into the aggregation repo: skills/other/<name>
// by default while provenance is unknown, skills/self/<name> when home is
// "self". Classification runs fresh from the same inputs, so the action is
// idempotent: a skill already consolidated (current) is a no-op, and a
// modified stray is never copied (its recovery is report-only, T3). The store
// copy is left in place. Returns { applied, name, kind, destination }.
export function applyStray({ store, pi, lock, repo, name, home = "other" }) {
  if (home !== "self" && home !== "other") {
    throw new Error(`invalid home "${home}" (expected "self" or "other")`);
  }
  const classified = classify({ store, pi, lock, repo });
  const skill = classified.find((c) => c.name === name);
  if (skill === undefined) {
    throw new Error(`no skill named "${name}" in the store or pi farm`);
  }
  if (skill.kind === "modified-stray") {
    throw new Error(
      `"${name}" is a modified stray; apply only copies new strays, and modified-stray recovery is report-only until its patch-manifest row exists`
    );
  }
  const destination = toPortable(join("skills", home, name));
  if (skill.kind === "current") {
    return { applied: false, name, kind: "current", destination: skill.destination };
  }
  copyTree(skill.dir, join(repo, "skills", home, name));
  return { applied: true, name, kind: "new-stray", destination };
}

// --- report ---------------------------------------------------------------

export function buildReport({ store, pi, lock, repo, classified }) {
  const byKind = { "new-stray": [], "modified-stray": [], current: [] };
  for (const c of classified) byKind[c.kind].push(c);

  const lines = [
    "Consolidation report (dry-run)",
    "==============================",
    `Store root:       ${store}`,
    `pi junction farm: ${pi}`,
    `Lock file:        ${lock}`,
    `Aggregation repo: ${repo}`,
    "",
    "Dry-run: no file is written or modified.",
    "",
  ];
  for (const kind of ["new-stray", "modified-stray"]) {
    if (byKind[kind].length > 0) {
      lines.push(`${kind} (${byKind[kind].length})`);
      for (const c of byKind[kind]) lines.push(`  ${c.name} -> ${c.destination}`);
      lines.push("");
    }
  }
  lines.push(`current (${byKind["current"].length})`);
  for (const c of byKind["current"]) lines.push(`  ${c.name}`);
  lines.push("");
  lines.push(
    `Totals: ${byKind["current"].length} current, ${byKind["new-stray"].length} new stray, ${byKind["modified-stray"].length} modified stray.`
  );
  return lines.join("\n");
}

// --- runner ---------------------------------------------------------------

export function consolidate({ store, pi, lock, repo }) {
  const classified = classify({ store, pi, lock, repo });
  return { classified, report: buildReport({ store, pi, lock, repo, classified }) };
}

function loadLock(lockPath) {
  if (!existsSync(lockPath)) {
    throw new Error(`lock file not found: ${lockPath}`);
  }
  return JSON.parse(readFileSync(lockPath, "utf8"));
}

// --- CLI ------------------------------------------------------------------

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(`consolidate-strays: ${err.message}`);
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  if (args.help) {
    console.log(usage());
    return;
  }
  try {
    if (args.apply !== undefined) {
      const result = applyStray({
        store: args.store,
        pi: args.pi,
        lock: args.lock,
        repo: args.repo,
        name: args.apply,
        home: args.to,
      });
      if (result.applied) {
        console.log(
          `Applied new stray:\n  ${result.name} (${result.kind}) -> ${result.destination}\nStore copy left in place; pi keeps serving the skill.`
        );
      } else {
        console.log(
          `${result.name} (${result.kind}) is already consolidated at ${result.destination}; nothing to apply.`
        );
      }
      return;
    }
    const { classified, report } = consolidate(args);
    console.log(report);
    // Non-zero when strays exist, so callers and CI can key on the result.
    if (classified.some((c) => c.kind !== "current")) process.exitCode = 2;
  } catch (err) {
    console.error(`consolidate-strays: ${err.message}`);
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const args = {
    store: defaultStore(),
    pi: defaultPi(),
    lock: defaultLock(),
    repo: DEFAULT_REPO,
    to: "other",
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--help" || flag === "-h") return { ...args, help: true };
    const value = argv[i + 1];
    if (value === undefined) throw new Error(`missing value for ${flag}`);
    if (flag === "--store") args.store = value;
    else if (flag === "--pi") args.pi = value;
    else if (flag === "--lock") args.lock = value;
    else if (flag === "--repo") args.repo = value;
    else if (flag === "--apply") args.apply = value;
    else if (flag === "--to") args.to = value;
    else throw new Error(`unknown option: ${flag}`);
    i++;
  }
  if (args.to !== "self" && args.to !== "other") {
    throw new Error(`invalid --to value "${args.to}" (expected "self" or "other")`);
  }
  if (args.apply === undefined && args.to !== "other") {
    throw new Error("--to requires --apply");
  }
  return args;
}

function usage() {
  return `Usage: node scripts/consolidate-strays.mjs [options]

Classifies every store skill as a new stray, a modified stray, or current and
prints a dry-run report (read-only; nothing is written or modified). With
--apply, copies one new stray into the repo instead.

Options:
  --store <dir>   canonical skills store (default: ~/.agents/skills)
  --pi <dir>      pi junction farm (default: ~/.pi/agent/skills)
  --lock <file>   distribution lock file (default: ~/.agents/.skill-lock.json)
  --repo <dir>    aggregation repo root (default: this script's parent)
  --apply <name>  copy the named new stray into the repo (idempotent)
  --to <home>     destination home with --apply: other (default) or self
  -h, --help      show this help

Exit codes: 0 = no strays (or applied/no-op), 2 = strays found in dry-run,
1 = error.`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
