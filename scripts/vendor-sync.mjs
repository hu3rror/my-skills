#!/usr/bin/env node
// Sync upstream skill repos into the per-source directories.
//
// Why this exists: `npx skills update` re-downloads from upstream and silently
// discards local patches. This repo ships the patched artifacts, so sync must
// never overwrite files listed in PATCHES.md — those are skipped and flagged
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
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PATCHES_PATH = join(ROOT, "PATCHES.md");
const DRY_RUN = process.argv.includes("--dry-run");

// Upstream sources. `targetRoot` is the repo directory this source owns (used
// to prune files upstream has removed). `skillRoots` maps each upstream skill
// directory to its repo-relative counterpart.
const SOURCES = [
  {
    name: "mattpocock",
    url: "https://github.com/mattpocock/skills.git",
    targetRoot: "skills/mattpocock",
    // Release-tracked upstream: the freshness check fetches its latest
    // release as context (see the per-source releaseRepo in the summary).
    releaseRepo: "mattpocock/skills",
    skillRoots: mattpocockSkillRoots,
  },
  {
    name: "kill-ai-slop",
    url: "https://github.com/yetone/kill-ai-slop.git",
    targetRoot: "skills/kill-ai-slop/kill-ai-slop",
    skillRoots: fixedSkillRoots([
      { upstream: "skill", target: "skills/kill-ai-slop/kill-ai-slop" },
    ]),
  },
  {
    name: "cloudflare",
    url: "https://github.com/cloudflare/security-audit-skill.git",
    targetRoot: "skills/cloudflare/security-audit",
    skillRoots: fixedSkillRoots([
      {
        upstream: "skills/security-audit",
        target: "skills/cloudflare/security-audit",
      },
    ]),
  },
];

main();

function main() {
  const patchedSet = parsePatchedFiles();
  if (patchedSet.size === 0) {
    console.error(
      "PATCHES.md: no A-class patched files found. Refusing to sync — proceeding would risk overwriting local patches.",
    );
    process.exit(1);
  }

  // Guard the skip set itself: an A-class row that fails to parse into a real
  // file path (e.g. the table gains a column) would silently shrink the set
  // this mechanism exists to protect. Refuse rather than risk an overwrite.
  const missing = [...patchedSet].filter((file) => !existsSync(toAbs(file)));
  if (missing.length > 0) {
    console.error(
      `PATCHES.md: ${missing.length} A-class file(s) listed but not present in the repo: ${missing.join(", ")}. Refusing to sync.`,
    );
    process.exit(1);
  }

  console.log(`Patched files listed in PATCHES.md: ${patchedSet.size}`);
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
    const r = syncSource(source, patchedSet);
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
    // manual merge. patched-but-unchanged files are not pending. The patched
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

function syncSource(source, patchedSet) {
  const r = {
    added: [],
    updated: [],
    removed: [],
    unchanged: 0,
    patched: [],
    errors: [],
  };
  const tmp = mkdtempSync(join(os.tmpdir(), "my-skills-vendor-"));
  const cloneDir = join(tmp, source.name);
  try {
    const clone = spawnSync(
      "git",
      ["clone", "--depth", "1", "--quiet", source.url, cloneDir],
      { encoding: "utf8" },
    );
    if (clone.status !== 0) {
      r.errors.push(`${source.name}: clone failed: ${(clone.stderr || "").trim()}`);
      return r;
    }

    // Enumerate every upstream skill file, mapped to its repo-relative path.
    const managed = new Map(); // repoRelPath -> absolute upstream path
    for (const { upstreamDir, targetRel } of source.skillRoots(cloneDir)) {
      for (const rel of walkFiles(upstreamDir)) {
        managed.set(`${targetRel}/${rel}`, join(upstreamDir, ...rel.split("/")));
      }
    }

    for (const [repoRel, upstreamAbs] of managed) {
      if (patchedSet.has(repoRel)) {
        r.patched.push({
          path: repoRel,
          differs: filesDiffer(upstreamAbs, toAbs(repoRel)),
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
    // local-only file would silently clobber content PATCHES.md cannot protect
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

function mattpocockSkillRoots(cloneDir) {
  const scan = join(cloneDir, "skills");
  const roots = [];
  for (const rel of walkFiles(scan)) {
    if (!rel.endsWith("SKILL.md")) continue;
    const skillRel = rel.slice(0, -"SKILL.md".length - 1); // drop trailing "/SKILL.md"
    // Mattpocock skill roots sit exactly at skills/<category>/<name>/SKILL.md;
    // deeper SKILL.md files are internals of a skill, not separate skills.
    if (skillRel.split("/").length !== 2) continue;
    roots.push({
      upstreamDir: join(scan, ...skillRel.split("/")),
      targetRel: ["skills", "mattpocock", ...skillRel.split("/")].join("/"),
    });
  }
  return roots;
}

function fixedSkillRoots(roots) {
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

// Extract the repo-relative file paths from PATCHES.md's A-class table (column
// "File (repo-relative)"). These are the files sync must never overwrite.
function parsePatchedFiles() {
  // Column index of "File (repo-relative)" in the A-class table.
  const FILE_COLUMN = 3;
  const text = readFileSync(PATCHES_PATH, "utf8");
  let inA = false;
  const files = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("## A-class")) {
      inA = true;
      continue;
    }
    if (inA && line.startsWith("## ")) break;
    if (inA && line.startsWith("|")) {
      const cells = line.split("|");
      if (cells.length <= FILE_COLUMN) continue;
      const file = (cells[FILE_COLUMN] || "").trim().replace(/`/g, "");
      if (file && file !== "File (repo-relative)" && !/^-+$/.test(file)) {
        files.add(file);
      }
    }
  }
  return files;
}

// One tri-state classification shared by the human summary and the machine
// summary so the two can never disagree about a patched file.
function patchedStatus(item) {
  if (item.removedUpstream) return "removed";
  if (item.differs) return "differs";
  return "unchanged";
}

function filesDiffer(a, b) {
  if (!existsSync(b)) return true;
  return !readFileSync(a).equals(readFileSync(b));
}

function toAbs(repoRel) {
  return join(ROOT, ...repoRel.split("/"));
}

function log(action, path) {
  console.log(`  ${DRY_RUN ? "[dry-run] " : ""}${action.padEnd(8)} ${path}`);
}
