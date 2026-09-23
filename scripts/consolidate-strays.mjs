#!/usr/bin/env node
// consolidate-strays.mjs — classification and recovery for the canonical
// skills store against the distribution chain's lock file and the aggregation
// repo's consolidated copies (stray-skill consolidation spec): dry-run
// classification report, explicit apply for new strays, and a diff report
// with patch-manifest row templates for modified strays.
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
// Modified strays are report-only: apply never copies one — the dry-run
// report prints a line-level diff summary of store content versus the
// consolidated copy plus a PATCHES.md row template per changed file, so the
// deviation can be recorded before the consolidated copy ever changes
// (ADR-0002). All roots are parameterized with home-derived
// defaults so fixtures drive
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

// A directory as a map of portable relative path -> absolute file path. Both
// the equality gate (directoriesEqual) and the diff report (diffDirectories)
// share this view so the two can never disagree about which files exist.
function filesOf(root) {
  const map = new Map();
  if (!existsSync(root)) return map;
  for (const f of listFiles(root)) map.set(toPortable(relative(root, f)), f);
  return map;
}

// The one normalized view of a text file's content. Line endings collapse to
// LF (a Windows-installed store carries CRLF while the repo normalizes to LF
// — that drift is a distribution artifact, not a local edit) and a single
// trailing newline is dropped (a save artifact, not content). Comparing
// through this view keeps the classification gate and the diff report
// consistent: what compares equal here is never reported, so a reported
// deviation always has a non-empty diff. Files that are not UTF-8 text (e.g.
// with NUL bytes) stay byte-exact so nothing is ever mangled.
function normalizedText(buf) {
  let text = buf.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (text.endsWith("\n")) text = text.slice(0, -1);
  return text;
}

function normalizedContent(buf) {
  if (buf.includes(0)) return buf; // binary / non-UTF-8 text: byte-exact
  return Buffer.from(normalizedText(buf), "utf8");
}

// Whether two directories hold the same files with the same content.
export function directoriesEqual(a, b) {
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

// --- diff report -------------------------------------------------------------

// Split a file's content into lines under the same normalized view as
// normalizedContent (the trailing newline is already dropped, so "a\n" and
// "a" both yield ["a"]). An empty file yields no lines; a file holding one
// blank line yields [""].
function toLines(buf) {
  const lines = normalizedText(buf).split("\n");
  if (lines.length === 1 && lines[0] === "") return [];
  return lines;
}

// Line-level diff between two texts with an LCS alignment. "-" lines exist
// only in the consolidated copy (removed by the local edit) and "+" lines
// only in the store (added by it) — the orientation a maintainer reads
// against a PATCHES.md patch summary like "+2 lines appended: ...". Skill
// files are small, so the O(m*n) DP table is fine for a manual diagnostic;
// pathological sizes return null and the caller falls back to counts only.
function diffLines(storeLines, copyLines) {
  const m = storeLines.length;
  const n = copyLines.length;
  if (m * n > 4_000_000) return null;
  const lcs = new Int32Array((m + 1) * (n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i * (n + 1) + j] =
        storeLines[i] === copyLines[j]
          ? lcs[(i + 1) * (n + 1) + j + 1] + 1
          : Math.max(lcs[(i + 1) * (n + 1) + j], lcs[i * (n + 1) + j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (storeLines[i] === copyLines[j]) {
      i++;
      j++;
    } else if (lcs[i * (n + 1) + j + 1] >= lcs[(i + 1) * (n + 1) + j]) {
      // Deletions first (unified-diff order): "-" is copy-only, "+" is store-only.
      ops.push({ t: "-", s: copyLines[j++] });
    } else {
      ops.push({ t: "+", s: storeLines[i++] });
    }
  }
  while (i < m) ops.push({ t: "+", s: storeLines[i++] });
  while (j < n) ops.push({ t: "-", s: copyLines[j++] });
  return ops;
}

// Compare two skill directories and describe every difference, file by file
// (the diff summary). "added" files exist only in the store, "removed"
// only in the consolidated copy; both carry whole-file line ops so content is
// visible. "modified" files carry aligned ops plus added/removed counts.
// Binary (NUL-containing) files get no line diff — nothing is ever mangled —
// and files differing only in line endings or a trailing newline (the same
// normalized view directoriesEqual compares) are no deviation at all.
// Entries are sorted by relative path so the report is deterministic.
export function diffDirectories(storeDir, copyDir) {
  const fa = filesOf(storeDir);
  const fb = filesOf(copyDir);
  const out = [];
  for (const rel of [...new Set([...fa.keys(), ...fb.keys()])].sort()) {
    const pa = fa.get(rel);
    const pb = fb.get(rel);
    let entry;
    if (pa === undefined) {
      const buf = readFileSync(pb);
      if (buf.includes(0)) {
        entry = { rel, status: "removed", binary: true, added: 0, removed: 0, ops: null };
      } else {
        const lines = toLines(buf);
        entry = {
          rel,
          status: "removed",
          binary: false,
          added: 0,
          removed: lines.length,
          ops: lines.map((s) => ({ t: "-", s })),
        };
      }
    } else if (pb === undefined) {
      const buf = readFileSync(pa);
      if (buf.includes(0)) {
        entry = { rel, status: "added", binary: true, added: 0, removed: 0, ops: null };
      } else {
        const lines = toLines(buf);
        entry = {
          rel,
          status: "added",
          binary: false,
          added: lines.length,
          removed: 0,
          ops: lines.map((s) => ({ t: "+", s })),
        };
      }
    } else {
      const ba = readFileSync(pa);
      const bb = readFileSync(pb);
      if (ba.equals(bb)) continue;
      if (ba.includes(0) || bb.includes(0)) {
        entry = { rel, status: "modified", binary: true, added: 0, removed: 0, ops: null };
      } else {
        const aLines = toLines(ba);
        const bLines = toLines(bb);
        if (aLines.length === bLines.length && aLines.every((l, idx) => l === bLines[idx])) {
          continue;
        }
        const ops = diffLines(aLines, bLines);
        entry =
          ops === null
            ? { rel, status: "modified", binary: false, added: aLines.length, removed: bLines.length, ops: null }
            : {
                rel,
                status: "modified",
                binary: false,
                added: ops.filter((o) => o.t === "+").length,
                removed: ops.filter((o) => o.t === "-").length,
                ops,
              };
      }
    }
    out.push(entry);
  }
  return out;
}

// --- classification ---------------------------------------------------------

// Index the repo's consolidated copies by skill name, under the two
// consolidation homes only: skills/self/ (the self-authored home) and
// skills/other/ (the unattributed home). Those are the only destinations
// consolidation copies strays into (glossary: consolidation). Vendored source
// trees are never consolidation homes, so an untracked store skill whose name
// merely collides with a vendored skill is classified as a new stray
// (adoptable) instead of being misattributed to upstream — the lock file is
// the authoritative tracked set (spec, implementation decision).
function indexConsolidatedCopies(repoRoot) {
  const map = new Map();
  const walk = (d) => {
    if (!existsSync(d)) return;
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
  walk(join(repoRoot, "skills", "self"));
  walk(join(repoRoot, "skills", "other"));
  return map;
}

// Classify scanned skills against the lock's tracked set and the repo's
// consolidated copies. A skill is a new stray only when it is absent from the
// lock AND has no consolidated copy in a consolidation home; an untracked
// skill comparing against a copy in one of the two homes catches the
// already-consolidated-without-lock-regeneration flow (content equal ->
// current, differing -> modified stray).
export function classifyStrays(skills, lock, repoRoot) {
  const tracked = (lock && lock.skills) || {};
  const repoCopies = indexConsolidatedCopies(repoRoot);
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
// modified stray is never copied (its recovery is report-only). The store
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

// Diff report and patch-manifest row templates for one modified stray.
// This is the recovery surface for a modified stray: the maintainer reads the
// diff to compose the PATCHES.md patch summary, fills the row template in,
// and only then recovers the edit — the consolidated copy never changes before
// its patch row exists, so vendor sync cannot overwrite the edit (ADR-0002).
// A row template is emitted per changed file (ADR-0002: every patch entry must
// map to a real file in the repo); the consolidated copy is not changing for
// a file removed from the store, so that case gets no row.
function modifiedStrayDetail(c, repo) {
  const copyDir = join(repo, c.destination);
  const diffs = diffDirectories(c.dir, copyDir);
  const lines = ["    Diff summary (store vs consolidated copy):"];
  const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  for (const e of diffs) {
    if (e.binary) lines.push(`      ${e.rel}: binary - differs (byte compare)`);
    else if (e.status === "added") lines.push(`      ${e.rel}: added in store`);
    else if (e.status === "removed") lines.push(`      ${e.rel}: removed from store`);
    else if (e.ops === null) {
      lines.push(
        `      ${e.rel}: ${count(e.added, "line")} in store, ${count(e.removed, "line")} in the consolidated copy (alignment skipped)`
      );
    } else {
      lines.push(`      ${e.rel}: ${count(e.added, "line")} added, ${count(e.removed, "line")} removed`);
    }
    if (e.ops) for (const op of e.ops) lines.push(`        ${op.t} ${op.s}`);
  }
  if (!existsSync(copyDir)) {
    lines.push(
      "    (consolidated copy missing - no patch-manifest row applies; restore the copy before recovery)"
    );
    return lines;
  }
  const templates = [];
  for (const e of diffs) {
    if (e.status === "removed") continue;
    templates.push(
      `      | <next #> | new | \`${toPortable(join(c.destination, e.rel))}\` | <patch summary: see diff above> | <upstream counterpart> | <verification method> |`
    );
  }
  if (templates.length > 0) {
    lines.push(
      "    Patch-manifest row templates (append as A-class rows in PATCHES.md, completing the placeholders):"
    );
    lines.push(...templates);
  }
  return lines;
}

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
      for (const c of byKind[kind]) {
        lines.push(`  ${c.name} -> ${c.destination}`);
        if (c.kind === "modified-stray") lines.push(...modifiedStrayDetail(c, repo));
      }
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
prints a dry-run report (read-only; nothing is written or modified). Modified
strays are reported with a diff summary and a PATCHES.md row template — the
script never copies one; its patch row must exist first (ADR-0002). With
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
