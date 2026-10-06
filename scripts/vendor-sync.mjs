#!/usr/bin/env node
// Sync upstream skill repos into the per-source directories.
//
// Why this exists: `npx skills update` re-downloads from upstream and silently
// discards local patches. This repo ships the patched artifacts, so sync must
// never overwrite files listed in the patch records at patches/ — those are
// skipped and flagged
// for a manual merge instead.

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PATCHES_DIR = join(ROOT, "patches");
const VENDOR_DIR = join(ROOT, "vendor");
const DRY_RUN = process.argv.includes("--dry-run");

// Upstream sources. `targetRoot` is the repo directory this source owns (used
// to prune files upstream has removed). `skillRoots` maps each upstream skill
// directory to its repo-relative counterpart. The per-source *data* (repo, url,
// pinned commit, exclusions, release repo) lives in `vendor/<name>.json` (map
// ticket #23) and is attached by loadManifest; this array keeps only the
// path-mapping code.
const SOURCES = [
  {
    name: "mattpocock",
    targetRoot: "skills/mattpocock",
    skillRoots: mattpocockSkillRoots,
  },
  {
    name: "kill-ai-slop",
    targetRoot: "skills/kill-ai-slop/kill-ai-slop",
    skillRoots: fixedSkillRoots([
      { upstream: "skill", target: "skills/kill-ai-slop/kill-ai-slop" },
    ]),
  },
  {
    name: "cloudflare",
    targetRoot: "skills/cloudflare/security-audit",
    skillRoots: fixedSkillRoots([
      {
        upstream: "skills/security-audit",
        target: "skills/cloudflare/security-audit",
      },
    ]),
  },
];

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

function main() {
  if (process.argv[2] === "merge") mergeMain();
  else syncMain();
}

// Shared manifest load + guard for both modes. An empty skip set or a patch
// record that fails to parse into a real file path would silently shrink the
// set this mechanism exists to protect — refuse rather than risk an overwrite.
//
// Pins and exclusions live in per-source meta (`vendor/<name>.json`, map
// ticket #23): pins keyed by repo, exclusions as upstream-repo-relative path
// lists; url/repo/releaseRepo land on the source config for cloning and the
// freshness summary. A missing or invalid meta throws here (see
// loadSourceMeta) — a silently dropped pin or exclusion would unprotect a
// patch, so the script refuses to run instead. The patched-file skip set comes
// from the per-patch records at `patches/<source>/` (the patches/**/*.md glob
// is the manifest, map ticket #22; PATCHES.md was deleted at the migration).
function loadManifest(mode) {
  const patchedSet = parsePatchedFiles();
  const pins = new Map();
  const excludedRoots = new Map();
  for (const source of SOURCES) {
    const meta = loadSourceMeta(source.name);
    source.repo = meta.repo;
    source.url = meta.url;
    source.releaseRepo = meta.releaseRepo ?? null;
    pins.set(meta.repo, meta.pin);
    if (meta.exclusions?.length) {
      excludedRoots.set(meta.repo, meta.exclusions.map((e) => e.path));
    }
  }
  if (patchedSet.size === 0) {
    console.error(
      `patches/: no patch records found. Refusing to ${mode} — proceeding would risk overwriting local patches.`,
    );
    process.exit(1);
  }
  const missing = [...patchedSet].filter((file) => !existsSync(toAbs(file)));
  if (missing.length > 0) {
    console.error(
      `patches/: ${missing.length} patch record(s) target file(s) not present in the repo: ${missing.join(", ")}. Refusing to ${mode}.`,
    );
    process.exit(1);
  }
  return { patchedSet, pins, excludedRoots };
}

function syncMain() {
  const { patchedSet, pins, excludedRoots } = loadManifest("sync");
  console.log(`Patched files in patch records: ${patchedSet.size}`);
  if (DRY_RUN) {
    console.log("Dry run: reporting only, no files will be written or deleted.");
  }

  const total = { added: 0, updated: 0, removed: 0, unchanged: 0 };
  const patched = [];
  const errors = [];
  const sources = [];
  let failed = false;

  for (const source of SOURCES) {
    console.log(`\n=== ${source.name} — ${source.url} ===`);
    const r = syncSource(source, patchedSet, pins, excludedRoots);
    for (const p of r.added) log("add", p);
    for (const p of r.updated) log("update", p);
    for (const p of r.removed) console.log(`  kept (removed upstream) ${p}`);
    total.added += r.added.length;
    total.updated += r.updated.length;
    total.removed += r.removed.length;
    total.unchanged += r.unchanged;
    for (const item of r.patched) patched.push({ source: source.name, ...item });

    // Machine-readable per-source state for the freshness check workflow:
    // pending = a dry run would change files, or a patched file now needs a
    // manual merge (upstream changed it since the pinned base — not merely
    // "local differs from upstream", which is true of every patch by
    // construction). patched-but-current files are not pending. The patched
    // tri-state comes from the same classifier as the human summary above.
    const patchedByStatus = { differs: [], removed: [], unchanged: 0 };
    for (const item of r.patched) {
      const status = patchedStatus(item);
      if (status === "unchanged") patchedByStatus.unchanged++;
      else patchedByStatus[status].push(item.path);
    }
    sources.push({
      name: source.name,
      pending:
        r.added.length + r.updated.length + r.removed.length +
        patchedByStatus.differs.length + patchedByStatus.removed.length >
        0,
      added: r.added,
      updated: r.updated,
      removed: r.removed,
      patchedDiffers: patchedByStatus.differs,
      patchedRemoved: patchedByStatus.removed,
      patchedUnchanged: patchedByStatus.unchanged,
      releaseRepo: source.releaseRepo,
    });

    for (const e of r.errors) {
      errors.push(e);
      console.error(`  error: ${e}`);
    }
    if (r.errors.length > 0) failed = true;
  }

  console.log("\n=== vendor-sync summary ===");
  console.log(`added:      ${total.added}`);
  console.log(`updated:    ${total.updated}`);
  console.log(`removed upstream (kept local, review): ${total.removed}`);
  console.log(`unchanged:  ${total.unchanged}`);
  console.log(`patched (skipped, never overwritten): ${patched.length}`);
  for (const p of patched) {
    switch (patchedStatus(p)) {
      case "removed":
        console.log(
          `  [patched] ${p.path} — upstream removed this file; kept local copy, merge manually`,
        );
        break;
      case "differs":
        console.log(
          `  [patched] ${p.path} — upstream updated a patched file — merge manually`,
        );
        break;
      default:
        console.log(`  [patched] ${p.path} — unchanged`);
    }
  }
  const unseenPatched = patchedSet.size - patched.length;
  if (unseenPatched > 0) {
    console.log(
      `  (${unseenPatched} patched file(s) under non-synced sources, e.g. skills/self/ — no upstream, left as-is)`,
    );
  }
  if (errors.length > 0) {
    console.error(`\n${errors.length} source(s) failed.`);
  }
  // Machine-readable summary line for the freshness check workflow. Unique
  // single-line prefix, printed in both dry-run and real mode; humans keep
  // reading the block above.
  console.log(
    `VENDOR_SYNC_SUMMARY=${JSON.stringify({
      dryRun: DRY_RUN,
      failed,
      changed: sources.some((s) => s.pending),
      counts: {
        added: total.added,
        updated: total.updated,
        removed: total.removed,
        unchanged: total.unchanged,
      },
      errors,
      sources,
    })}`,
  );
  process.exit(failed ? 1 : 0);
}

// Enumerate every upstream skill file a source owns, mapped from its
// repo-relative path to the absolute upstream path (shared by sync and merge).
function enumerateManaged(source, excludedRoots, cloneDir) {
  const excluded = excludedRoots.get(source.repo) ?? [];
  const managed = new Map(); // repoRelPath -> absolute upstream path
  for (const { upstreamDir, targetRel } of source.skillRoots(cloneDir, excluded)) {
    for (const rel of walkFiles(upstreamDir)) {
      managed.set(`${targetRel}/${rel}`, join(upstreamDir, ...rel.split("/")));
    }
  }
  return managed;
}

// Clone a source shallowly and fetch its pinned base commit (the patched
// files' diff baseline) — the setup both sync and merge need. Returns the temp
// dir the caller must clean up, the clone dir, the pin, whether it landed, and
// an error string when the clone itself failed. Callers print their own
// "pin unfetchable" note — the two modes fall back differently. Exported for
// verify-patch-records.mjs, which reconstructs record hunks from the same
// pinned blobs.
export function cloneAndFetchPin(source, pins) {
  const tmp = mkdtempSync(join(os.tmpdir(), "my-skills-vendor-"));
  const cloneDir = join(tmp, source.name);
  const clone = spawnSync(
    "git",
    ["clone", "--depth", "1", "--quiet", source.url, cloneDir],
    { encoding: "utf8" },
  );
  if (clone.status !== 0) {
    return { tmp, cloneDir, error: `${source.name}: clone failed: ${(clone.stderr || "").trim()}` };
  }
  const pin = pins.get(source.repo);
  let pinAvailable = false;
  if (pin) {
    const fetched = spawnSync(
      "git",
      ["-C", cloneDir, "fetch", "--depth", "1", "--quiet", "origin", pin],
      { encoding: "utf8" },
    );
    pinAvailable = fetched.status === 0;
  }
  return { tmp, cloneDir, pin, pinAvailable };
}

function syncSource(source, patchedSet, pins, excludedRoots) {
  const r = {
    added: [],
    updated: [],
    removed: [],
    unchanged: 0,
    patched: [],
    errors: [],
  };
  const { tmp, cloneDir, pin, pinAvailable, error } = cloneAndFetchPin(source, pins);
  if (error) {
    r.errors.push(error);
    return r;
  }
  if (!pinAvailable && pin) {
    console.error(
      `  note: pinned commit ${pin} not fetchable for ${source.name} — patched files treated as pending (old semantics)`,
    );
  }
  try {
    // Enumerate every upstream skill file, mapped to its repo-relative path.
    const managed = enumerateManaged(source, excludedRoots, cloneDir);

    for (const [repoRel, upstreamAbs] of managed) {
      if (patchedSet.has(repoRel)) {
        r.patched.push({
          path: repoRel,
          differs: patchedDiffers(cloneDir, upstreamAbs, repoRel, pin, pinAvailable),
          removedUpstream: false,
        });
        continue;
      }
      const targetAbs = toAbs(repoRel);
      if (!existsSync(targetAbs)) {
        r.added.push(repoRel);
        if (!DRY_RUN) {
          mkdirSync(dirname(targetAbs), { recursive: true });
          copyFileSync(upstreamAbs, targetAbs);
        }
      } else if (filesDiffer(upstreamAbs, targetAbs)) {
        r.updated.push(repoRel);
        if (!DRY_RUN) copyFileSync(upstreamAbs, targetAbs);
      } else {
        r.unchanged++;
      }
    }

    // Report files upstream no longer ships; never delete them. Deleting a
    // local-only file would silently clobber content the patch records cannot protect
    // (it only tracks patches of upstream files). The maintainer reviews and
    // removes these manually.
    const targetRootAbs = toAbs(source.targetRoot);
    if (existsSync(targetRootAbs)) {
      for (const rel of walkFiles(targetRootAbs)) {
        const repoRel = `${source.targetRoot}/${rel}`;
        if (managed.has(repoRel)) continue;
        if (patchedSet.has(repoRel)) {
          r.patched.push({ path: repoRel, differs: false, removedUpstream: true });
          continue;
        }
        r.removed.push(repoRel);
      }
    }
    return r;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function mattpocockSkillRoots(cloneDir, excluded = []) {
  const scan = join(cloneDir, "skills");
  const roots = [];
  for (const rel of walkFiles(scan)) {
    if (!rel.endsWith("SKILL.md")) continue;
    const skillRel = rel.slice(0, -"SKILL.md".length - 1); // drop trailing "/SKILL.md"
    // Mattpocock skill roots sit exactly at skills/<category>/<name>/SKILL.md;
    // deeper SKILL.md files are internals of a skill, not separate skills.
    if (skillRel.split("/").length !== 2) continue;
    // Manifest-declared exclusions (vendor/<name>.json "exclusions", map
    // ticket #23) are skipped silently — the paths are upstream-repo-relative
    // and matched boundary-safe, so a category exclusion covers every skill
    // under it.
    if (isExcludedUpstreamPath(`skills/${skillRel}`, excluded)) continue;
    roots.push({
      upstreamDir: join(scan, ...skillRel.split("/")),
      targetRel: ["skills", "mattpocock", ...skillRel.split("/")].join("/"),
    });
  }
  return roots;
}

function fixedSkillRoots(roots) {
  // Fixed roots enumerate their source's whole tree; they take no exclusions
  // (extra call arguments are ignored by JS).
  return (cloneDir) =>
    roots.map(({ upstream, target }) => ({
      upstreamDir: join(cloneDir, ...upstream.split("/")),
      targetRel: target,
    }));
}

// Recursively list files under `dir`, returning paths relative to `base` with
// forward-slash separators (repo-relative form, not OS form).
function walkFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, base));
    else if (entry.isFile()) out.push(relative(base, full).split(sep).join("/"));
  }
  return out;
}

// Extract the repo-relative file paths from the patch records at patches/
// (one record per upstream deviation, format map ticket #22): the `file:`
// frontmatter of every patches/**/*.md except patches/README.md. These are the
// files sync must never overwrite. A record without a parseable `file:` refuses
// to run — a silently dropped path would unprotect a patch (the same guard the
// old PATCHES.md table had).
function parsePatchedFiles() {
  const files = new Set();
  for (const abs of walkRecordFiles()) {
    const text = readFileSync(abs, "utf8");
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!m) {
      console.error(`patches/: ${abs} has no frontmatter — refusing to run (a record without file: would unprotect a patch)`);
      process.exit(1);
    }
    const fm = m[1].match(/(?:^|\n)file:\s*(\S+)/);
    if (!fm) {
      console.error(`patches/: ${abs} has no file: field — refusing to run`);
      process.exit(1);
    }
    files.add(fm[1]);
  }
  return files;
}

// Recursively list the record files under patches/: every .md there is a patch
// record except the directory's README.md (the format spec, no frontmatter).
function walkRecordFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md") out.push(p);
    }
  };
  walk(PATCHES_DIR);
  return out;
}

// Parse + validate one per-source meta file (vendor/<name>.json, map ticket
// #23): repo/url/pin are required, exclusions optional (path + reason each),
// releaseRepo/kind/note optional. Failures throw — a missing required field,
// a name mismatch or malformed JSON would otherwise silently drop the pin or
// the exclusions the sync guard depends on.
export function parseSourceMeta(text, name) {
  let meta;
  try {
    meta = JSON.parse(text);
  } catch (err) {
    throw new Error(`vendor meta ${name}.json: invalid JSON: ${err.message}`);
  }
  if (meta.name !== name) {
    throw new Error(`vendor meta ${name}.json: name mismatch (file says "${meta.name}")`);
  }
  for (const field of ["repo", "url", "pin"]) {
    if (typeof meta[field] !== "string" || meta[field].length === 0) {
      throw new Error(`vendor meta ${name}.json: missing or invalid "${field}"`);
    }
  }
  if (meta.releaseRepo !== undefined && (typeof meta.releaseRepo !== "string" || meta.releaseRepo.length === 0)) {
    throw new Error(`vendor meta ${name}.json: missing or invalid "releaseRepo"`);
  }
  if (meta.exclusions !== undefined) {
    if (!Array.isArray(meta.exclusions)) {
      throw new Error(`vendor meta ${name}.json: "exclusions" must be an array`);
    }
    for (const ex of meta.exclusions) {
      if (typeof ex?.path !== "string" || typeof ex?.reason !== "string") {
        throw new Error(`vendor meta ${name}.json: exclusion entries need "path" and "reason"`);
      }
    }
  }
  return meta;
}

// Read one per-source meta file. `dir` is injectable so tests can point at a
// fixture tree; the default is the repo's vendor/ directory.
export function loadSourceMeta(name, dir = VENDOR_DIR) {
  const abs = join(dir, `${name}.json`);
  if (!existsSync(abs)) {
    throw new Error(`vendor meta missing: vendor/${name}.json`);
  }
  return parseSourceMeta(readFileSync(abs, "utf8"), name);
}

// Scan one `## <heading>` table in a Markdown doc and call `row` for every data
// row with the backtick-stripped, trimmed cells; header and separator rows are
// left to the caller's row predicate to skip. A section runs until the next
// `## ` heading, so later sections never leak in; a missing section yields
// nothing. (No longer used for the patched-file skip set — that comes from the
// patch records now — but kept for any table-driven sections.)
function parseSectionTable(text, heading, row) {
  let inSection = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith(heading)) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith("## ")) break;
    if (!inSection || !line.startsWith("|")) continue;
    row(line.split("|").map((c) => c.trim().replace(/`/g, "")));
  }
}

// Boundary-safe prefix match: an excluded prefix covers the path itself and
// everything under it (`skills/in-progress` covers `skills/in-progress/loop-me`)
// but never a sibling with a longer name (`skills/in-progressing/...` is not
// covered). Callers pass upstream-repo-relative paths on both sides.
export function isExcludedUpstreamPath(upstreamRel, excludedPaths) {
  return excludedPaths.some((p) => upstreamRel === p || upstreamRel.startsWith(`${p}/`));
}

// Does a patched file need a manual merge? Only when upstream changed it since
// the pinned base (base blob ≠ HEAD blob). The old test — local copy differs
// from upstream HEAD — was true of every patched file by construction (a patch
// is a deviation), so the freshness check could never go green and every
// pending-update issue listed every patched file as "manual merge".
export function patchedNeedsMerge(baseBlob, headBlob, localDiffers) {
  if (baseBlob === null || headBlob === null) return localDiffers;
  // Buffers from spawnSync are raw bytes; strings (tests, fixtures) normalize
  // through Buffer.from — either way the comparison is byte-exact, never
  // decoded, so two different invalid-UTF-8 sequences can't compare equal.
  return !Buffer.from(baseBlob).equals(Buffer.from(headBlob));
}

// One tri-state classification shared by the human summary and the machine
// summary so the two can never disagree about a patched file.
function patchedStatus(item) {
  if (item.removedUpstream) return "removed";
  if (item.differs) return "differs";
  return "unchanged";
}

// Per-file "did upstream move this patched file since the pinned base?".
// Compares blobs (raw bytes, LF-normalized) so checkout line-ending
// translation in the clone cannot cause false pending reports.
function patchedDiffers(cloneDir, upstreamAbs, repoRel, pin, pinAvailable, root = ROOT) {
  if (!pinAvailable || !pin) return filesDifferBlob(cloneDir, upstreamAbs, repoRel, root);
  const rel = relative(cloneDir, upstreamAbs).split(sep).join("/");
  const base = spawnSync("git", ["-C", cloneDir, "cat-file", "blob", `${pin}:${rel}`]);
  if (base.status !== 0) return filesDifferBlob(cloneDir, upstreamAbs, repoRel, root);
  const head = spawnSync("git", ["-C", cloneDir, "cat-file", "blob", `HEAD:${rel}`]);
  if (head.status !== 0) return filesDifferBlob(cloneDir, upstreamAbs, repoRel, root);
  // Both blobs are present here, so `localDiffers` never participates in the
  // verdict — pass false instead of re-running a comparison the classifier
  // ignores.
  return patchedNeedsMerge(base.stdout, head.stdout, false);
}

// Fallback when the pin is missing or unfetchable: the HEAD blob
// (LF-normalized) vs the local copy. Comparing working-tree files here would
// let the clone's checkout line-ending translation (an upstream .gitattributes)
// report every patched file as differing on Windows clones — the same false
// alarm the blob comparison exists to avoid.
function filesDifferBlob(cloneDir, upstreamAbs, repoRel, root = ROOT) {
  const rel = relative(cloneDir, upstreamAbs).split(sep).join("/");
  const head = spawnSync("git", ["-C", cloneDir, "cat-file", "blob", `HEAD:${rel}`]);
  if (head.status !== 0) return filesDiffer(upstreamAbs, join(root, ...repoRel.split("/")));
  // Byte-exact: raw blob bytes vs the raw local file. Decoded-string compares
  // would treat two different invalid-UTF-8 sequences as equal and could hide
  // a real upstream change.
  return !head.stdout.equals(readFileSync(join(root, ...repoRel.split("/"))));
}

function filesDiffer(a, b) {
  if (!existsSync(b)) return true;
  return !readFileSync(a).equals(readFileSync(b));
}

function toAbs(repoRel) {
  return join(ROOT, ...repoRel.split("/"));
}

// === merge subcommand ===
//
// `node scripts/vendor-sync.mjs merge [--dry-run]`: rebuild the three-way
// merge for every patched file upstream changed since its pinned base
// (`git merge-file`, base = pinned upstream blob, ours = local copy, theirs =
// upstream HEAD), prove the patch survived mechanically (changed lines
// compared, not eyeballed), and write the merged content only when it did.
// The mechanics used to live in the my-skills-vendor-sync skill body as a
// Git Bash block; Node spawns git directly, so the subcommand runs from any
// shell and is deterministic and testable.

// Verdicts that leave work for the human: the subcommand exits 1 when any
// file lands here, a stop-and-report signal for the driving skill.
const MERGE_ATTENTION_VERDICTS = new Set(["conflict", "error", "reshaped", "adopted", "no-pin"]);

function mergeMain() {
  const { patchedSet, pins, excludedRoots } = loadManifest("merge");
  console.log(`Three-way merge of patched files (${patchedSet.size} patched files in patch records)`);
  if (DRY_RUN) console.log("Dry run: reporting only, no files will be written.");

  const results = [];
  const errors = [];
  let failed = false;
  for (const source of SOURCES) {
    console.log(`\n=== ${source.name} — ${source.url} ===`);
    const r = mergeSource(source, patchedSet, pins, excludedRoots, ROOT, DRY_RUN);
    results.push(...r.items);
    if (r.head) console.log(`  merged against ${source.name} HEAD ${r.head}`);
    for (const e of r.errors) {
      errors.push(e);
      console.error(`  error: ${e}`);
    }
    if (r.errors.length > 0) failed = true;
  }

  let needsAttention = 0;
  for (const item of results) {
    if (MERGE_ATTENTION_VERDICTS.has(item.verdict)) needsAttention++;
    switch (item.verdict) {
      case "merged":
        console.log(
          `  [merge] ${item.path} — clean three-way, patch survived (changed lines identical) — ${DRY_RUN ? "would write merged content" : "written"}`,
        );
        break;
      case "conflict":
        console.log(
          `  [merge] ${item.path} — conflict; nothing written. Marked hunks + both sides kept in ${item.tmpDir}`,
        );
        break;
      case "error":
        console.log(`  [merge] ${item.path} — git merge-file failed: ${item.stderr} (kept in ${item.tmpDir})`);
        break;
      case "reshaped":
        console.log(
          `  [merge] ${item.path} — clean merge but the patch reshaped (changed lines differ); not written. Old vs new diffs in ${item.tmpDir}`,
        );
        break;
      case "adopted":
        console.log(
          `  [merge] ${item.path} — upstream adopted the local patch; copy already current; restate the patch record`,
        );
        break;
      case "no-pin":
        console.log(
          `  [merge] ${item.path} — pinned commit unfetchable; manual reconcile (local-vs-HEAD diff in ${item.tmpDir})`,
        );
        break;
      default:
        console.log(`  [merge] ${item.path} — ${item.verdict}`);
    }
  }
  if (results.length === 0) {
    console.log("  nothing to merge — no patched file changed upstream since the pins");
  }
  if (errors.length > 0) console.error(`\n${errors.length} source(s) failed.`);

  // Machine-readable summary for the driving skill: per-file verdicts plus the
  // attention flag that decides the exit code.
  console.log(
    `MERGE_SUMMARY=${JSON.stringify({
      dryRun: DRY_RUN,
      failed,
      needsAttention,
      files: results.map((r) => ({ path: r.path, verdict: r.verdict, written: r.written ?? false })),
    })}`,
  );
  process.exit(failed || needsAttention > 0 ? 1 : 0);
}

// Per source: clone HEAD + fetch the pinned base, then merge every patched
// file upstream moved since the pin. Current patched files are skipped
// silently; removed-upstream patched files are left alone (keep-or-drop is a
// maintainer decision, not mechanics).
export function mergeSource(source, patchedSet, pins, excludedRoots, root, dryRun) {
  const r = { items: [], errors: [], head: null };
  const { tmp, cloneDir, pin, pinAvailable, error } = cloneAndFetchPin(source, pins);
  if (error) {
    r.errors.push(error);
    return r;
  }
  if (!pinAvailable && pin) {
    console.error(
      `  note: pinned commit ${pin} not fetchable for ${source.name} — fallback to local-vs-HEAD reconcile`,
    );
  }
  try {
    const head = spawnSync("git", ["-C", cloneDir, "rev-parse", "HEAD"], { encoding: "utf8" });
    if (head.status === 0) r.head = head.stdout.trim();
    for (const [repoRel, upstreamAbs] of enumerateManaged(source, excludedRoots, cloneDir)) {
      if (!patchedSet.has(repoRel)) continue;
      if (!patchedDiffers(cloneDir, upstreamAbs, repoRel, pin, pinAvailable, root)) continue;
      r.items.push(mergeOne({ cloneDir, upstreamAbs, repoRel, root, pin, pinAvailable }, dryRun));
    }
    return r;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// One file's three-way merge. Reads ours from the local copy, base/theirs from
// the clone's blobs, runs git merge-file, classifies the outcome, and writes
// the merged content only for a clean merge whose patch survived (and never in
// dry-run). Attention verdicts keep their temp dir (ours/base/theirs/merged,
// plus the diffs the human must review) so nothing the resolver needs is lost.
function mergeOne({ cloneDir, upstreamAbs, repoRel, root, pin, pinAvailable }, dryRun) {
  const tmpDir = mkdtempSync(join(os.tmpdir(), "my-skills-merge-file-"));
  const rel = relative(cloneDir, upstreamAbs).split(sep).join("/");
  const localAbs = join(root, ...repoRel.split("/"));
  const ours = readFileSync(localAbs);

  const theirsRes = catFile(cloneDir, `HEAD:${rel}`);
  if (theirsRes.status !== 0) {
    // Keep whatever evidence exists so the "kept in …" report stays truthful.
    writeFileSync(join(tmpDir, "ours"), ours);
    return { path: repoRel, verdict: "error", tmpDir, stderr: `HEAD:${rel} not readable` };
  }
  const theirs = theirsRes.stdout;

  // Pinned base unavailable (force-push / GC upstream): no three-way is
  // possible. Keep the local-vs-HEAD diff for the by-hand reconcile.
  if (!pinAvailable || !pin) {
    writeFileSync(join(tmpDir, "ours"), ours);
    writeFileSync(join(tmpDir, "theirs"), theirs);
    writeDiffFile(join(tmpDir, "ours"), join(tmpDir, "theirs"), join(tmpDir, "ours-vs-theirs.diff"));
    return { path: repoRel, verdict: "no-pin", tmpDir };
  }
  const baseRes = catFile(cloneDir, `${pin}:${rel}`);
  if (baseRes.status !== 0) {
    writeFileSync(join(tmpDir, "ours"), ours);
    writeFileSync(join(tmpDir, "theirs"), theirs);
    writeDiffFile(join(tmpDir, "ours"), join(tmpDir, "theirs"), join(tmpDir, "ours-vs-theirs.diff"));
    return { path: repoRel, verdict: "no-pin", tmpDir };
  }
  const base = baseRes.stdout;

  writeFileSync(join(tmpDir, "ours"), ours);
  writeFileSync(join(tmpDir, "base"), base);
  writeFileSync(join(tmpDir, "theirs"), theirs);
  // --diff3 only changes the conflict-marker style (adds the base view), so a
  // single run doubles as both the merged output and the resolver's view.
  const res = runMergeFile(join(tmpDir, "ours"), join(tmpDir, "base"), join(tmpDir, "theirs"), true);
  writeFileSync(join(tmpDir, "merged"), res.merged);

  // Prove the patch survived mechanically: the re-applied patch's changed
  // lines must equal the old patch's — only line numbers and context positions
  // may move.
  const oldLines = diffChangedLines(join(tmpDir, "base"), join(tmpDir, "ours"));
  const newLines = diffChangedLines(join(tmpDir, "theirs"), join(tmpDir, "merged"));
  const verdict = decideVerdict({ clean: res.clean, status: res.status, ours, theirs, oldLines, newLines });

  switch (verdict) {
    case "merged":
      if (!dryRun) writeFileSync(localAbs, res.merged);
      rmSync(tmpDir, { recursive: true, force: true });
      return { path: repoRel, verdict, written: !dryRun };
    case "adopted":
      rmSync(tmpDir, { recursive: true, force: true });
      return { path: repoRel, verdict };
    case "conflict":
      // Same content as `merged` (already in diff3 style); a distinct name so
      // the resolver's two views are obvious.
      copyFileSync(join(tmpDir, "merged"), join(tmpDir, "merged.diff3"));
      return { path: repoRel, verdict, tmpDir, stderr: res.stderr };
    case "reshaped":
      writeDiffFile(join(tmpDir, "base"), join(tmpDir, "ours"), join(tmpDir, "base-ours.diff"));
      writeDiffFile(join(tmpDir, "theirs"), join(tmpDir, "merged"), join(tmpDir, "theirs-merged.diff"));
      return { path: repoRel, verdict, tmpDir };
    default:
      return { path: repoRel, verdict, tmpDir, stderr: res.stderr };
  }
}

// Fetch one object from the clone (used for base/theirs blobs).
function catFile(cloneDir, rev) {
  return spawnSync("git", ["-C", cloneDir, "cat-file", "blob", rev]);
}

// Run git's native three-way file merge. Exit 0 = clean, 1 = conflict,
// anything else = a git failure. `diff3` only changes the conflict-marker
// style (base view added). Output stays raw bytes (no encoding option).
export function runMergeFile(oursAbs, baseAbs, theirsAbs, diff3 = false) {
  const args = ["merge-file", "-p"];
  if (diff3) args.push("--diff3");
  args.push(oursAbs, baseAbs, theirsAbs);
  const r = spawnSync("git", args);
  return {
    status: r.status,
    clean: r.status === 0,
    merged: r.stdout,
    stderr: (r.stderr ?? Buffer.alloc(0)).toString("utf8"),
  };
}

// Write `git diff --no-index a b` (exit 1 = differ, expected) to `outAbs` for
// the human to review; binary/broken output is written as-is.
function writeDiffFile(aAbs, bAbs, outAbs) {
  const r = spawnSync("git", ["diff", "--no-index", "--", aAbs, bAbs]);
  writeFileSync(outAbs, r.stdout ?? Buffer.alloc(0));
}

// The changed lines of a diff, marker byte stripped, header/context lines
// dropped — the portable, byte-exact equivalent of the skill body's old
// `git diff --no-index … | awk '/^[-+]/ && !/^[-+]{3}/ { print substr($0,2) }'`.
// Returns null when the changed lines can't be trusted (git failure, or a
// binary diff whose text would be meaningless) so the caller treats the patch
// as unproven instead of silently "merged". Line content stays raw bytes —
// never decoded, matching the file's byte-exact policy, so two different
// invalid-UTF-8 sequences can't compare equal.
export function diffChangedLines(aAbs, bAbs) {
  const r = spawnSync("git", ["diff", "--no-index", "--", aAbs, bAbs]);
  // Exit 1 = files differ (expected); 0 = identical; anything else is a git
  // failure.
  if (r.status === null || r.status > 1) return null;
  const out = r.stdout ?? Buffer.alloc(0);
  if (out.includes(Buffer.from("Binary files "))) return null;
  const lines = [];
  let start = 0;
  for (let i = 0; i <= out.length; i++) {
    if (i < out.length && out[i] !== 0x0a) continue;
    const line = out.subarray(start, i);
    start = i + 1;
    const b0 = line[0];
    if (b0 !== 0x2d && b0 !== 0x2b) continue; // not a changed line
    // Drop the --- / +++ file-header lines (first three bytes all +/-).
    if (line.length >= 3) {
      const b1 = line[1];
      const b2 = line[2];
      if ((b1 === 0x2d || b1 === 0x2b) && (b2 === 0x2d || b2 === 0x2b)) continue;
    }
    lines.push(line.subarray(1));
  }
  return lines;
}

// Order matters: the survival proof compares the re-applied patch's changed
// lines against the old patch's as sequences, exactly like the old `cmp`.
// null (untrustworthy lines) never equals anything — the patch is unproven.
export function patchLinesEqual(a, b) {
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;
  return a.every((line, i) => Buffer.from(line).equals(Buffer.from(b[i])));
}

// The single decision point for a merge outcome. Bytes are compared raw
// (Buffer.from normalizes string fixtures in tests); nothing is decoded, so
// two different invalid-UTF-8 sequences can't compare equal.
export function decideVerdict({ clean, status, ours, theirs, oldLines, newLines }) {
  if (!clean) return status === 1 ? "conflict" : "error";
  if (Buffer.from(ours).equals(Buffer.from(theirs))) return "adopted";
  return patchLinesEqual(oldLines, newLines) ? "merged" : "reshaped";
}

function log(action, path) {
  console.log(`  ${DRY_RUN ? "[dry-run] " : ""}${action.padEnd(8)} ${path}`);
}
