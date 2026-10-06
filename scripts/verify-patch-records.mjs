#!/usr/bin/env node
// verify-patch-records.mjs — machine-verified patch records (map #18 migration).
//
// The patches/**/*.md glob (minus patches/README.md) is the patch manifest: one
// record per deviation from upstream, at patches/<source>/ (record format: map
// ticket #22, primary-source prototype on branch prototype/patch-record-format).
// This script is the mechanical assertion that replaces PATCHES.md's prose
// "git diff vs pinned upstream shows exactly N lines" Verification column — the
// migration's acceptance "re-derive every diff vs pin" is this script's pass.
//
// Per diff-verified record: resolve the pin from vendor/<source>.json (single
// home, map #23 — records never carry an inline pin), fetch the pinned upstream
// blob (clone + fetch — the same machinery vendor-sync.mjs uses), apply the
// record's unified-diff hunks in `after:` topological order via `git apply`,
// and byte-compare the reconstruction to the repo's local copy (LF-normalized).
// A multi-patch file passes only when all its records are present and
// consistent. Files a diff creates (new-file hunks — row #10's localized
// references/) are byte-compared too, so an added asset can't silently drift.
// Behavioral records (self-authored, no upstream diff baseline) are excluded
// from the reconstruction: frontmatter + `## Static assert` grep expectations
// are checked, and the `## Live check` recipe is printed for a human re-run.
//
// Well-formedness runs first and fails loudly: id unique, file present in the
// repo, verification ∈ {diff, behavioral}, `after:` targets exist, diff records
// have exactly one `--- `-prefixed unified-diff block, behavioral records have
// none and carry ≥1 parseable Static assert.
//
// Read-only: never writes the repo working tree (scratch clones + patch files
// live in the OS temp dir). Exit 0 = every record verifies, 1 = any failure.
//
// Injectable for tests: verifyAll({ root, patchesDir, metaDir }) drives fixtures
// offline (clones come from a local fixture git repo, never the network).

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { cloneAndFetchPin, loadSourceMeta } from "./vendor-sync.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PATCHES_DIR = join(ROOT, "patches");
const VENDOR_DIR = join(ROOT, "vendor");
const LF = (s) => s.replace(/\r\n/g, "\n");
const N_LF = (s) => (s.endsWith("\n") ? s : `${s}\n`);

// --- parsing ----------------------------------------------------------------

// Minimal YAML-frontmatter parser for the record subset: scalars, one level of
// nested maps (the `upstream:` block), `key: >-` folded scalars, `#` comments.
// Throws on anything it can't represent — a malformed record must fail the run,
// never silently drop a field (a dropped `file:` or `after:` unprotects a patch).
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) throw new Error("no `---` frontmatter block");
  const lines = m[1].split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      i++;
      continue;
    }
    const indent = raw.length - raw.trimStart().length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    const kv = raw.match(/^([^:]+?):(?:\s*(.*))?$/);
    if (!kv) throw new Error(`unparseable frontmatter line: ${JSON.stringify(raw)}`);
    const key = kv[1].trim();
    let rest = (kv[2] ?? "").trim();
    if (rest === ">-" || rest === ">") {
      const parts = [];
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim() || l.trim().startsWith("#")) break;
        if (l.length - l.trimStart().length <= indent) break;
        parts.push(l.trim());
        i++;
      }
      parent[key] = parts.length ? parts.join(" ") : "";
      continue; // `i` already points at the first non-folded line
    }
    if (rest === "") {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
      i++;
      continue;
    }
    // Strip matching surrounding quotes from a plain scalar (YAML allows
    // "quoted strings" — the real records quote origin: to keep the # safe).
    if (
      rest.length >= 2 &&
      ((rest.startsWith('"') && rest.endsWith('"')) ||
        (rest.startsWith("'") && rest.endsWith("'")))
    ) {
      rest = rest.slice(1, -1);
    }
    parent[key] = rest;
    i++;
  }
  return root;
}

// Extract the first ```diff fenced block from a record body.
export function extractDiff(text) {
  const m = text.match(/```diff\r?\n([\s\S]*?)\r?\n```/);
  return m ? m[1] : null;
}

// Split a body into its prose sections by `## ` heading. Keys drop any
// parenthetical suffix, so "Static assert (CI-runnable)" and "Live check
// (human re-run)" map to "Static assert" / "Live check".
function sectionsOf(text) {
  const out = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const hm = line.match(/^##\s+(\S.*)$/);
    if (hm) {
      current = hm[1].replace(/\s*\(.*\)\s*$/, "");
      out[current] = [];
    } else if (current) {
      out[current].push(line);
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join("\n")]));
}

// `## Static assert` bullets are a small structured form the verifier enforces
// so a behavioral record can't silently drop coverage by mis-typing a line:
//   - `path` contains `needle`      (repo-relative path, literal needle)
//   - `path` contains no `needle`
export function parseStaticAsserts(section) {
  const asserts = [];
  for (const raw of (section || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("- `")) continue;
    const m = line.match(/^-\s*`([^`]+)`\s+contains\s+(no\s+)?`([^`]*)`$/);
    asserts.push(
      m
        ? { malformed: false, path: m[1], negated: m[2] === "no ", needle: m[3] }
        : { malformed: true, line },
    );
  }
  return asserts;
}

function walkRecords(dir, rel = "") {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkRecords(p, r));
    else if (r.endsWith(".md") && entry.name !== "README.md") out.push({ abs: p, rel: r });
  }
  return out;
}

// Parse one record file into its shape. Never throws: structural problems are
// reported through the well-formedness pass (failures, not a crash).
export function parseRecordFile(abs, root) {
  const text = readFileSync(abs, "utf8");
  const sections = sectionsOf(text);
  let fm;
  try {
    fm = parseFrontmatter(text);
  } catch {
    fm = {};
  }
  return {
    abs,
    rel: relative(root, abs).split(sep).join("/"),
    fm,
    diff: text.includes("## Diff") ? extractDiff(text) : null,
    staticAssert: sections["Static assert"],
    liveCheck: sections["Live check"],
  };
}

// --- helpers ----------------------------------------------------------------

// The scratch-relative paths a diff creates (new-file hunks, `--- /dev/null`).
function createdPaths(diff) {
  const out = [];
  const lines = diff.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("--- /dev/null")) {
      const next = lines[i + 1];
      const bm = next?.match(/^\+\+\+ b\/(.+)$/);
      if (bm) out.push(bm[1]);
    }
  }
  return out;
}

// Topologically order a file-group's records by their `after:` edges. Returns
// null on a cycle or a missing target (already caught by well-formedness; the
// guard is a second wall for non-deterministic inputs).
function topoOrder(group) {
  const result = [];
  const applied = new Set();
  const byId = new Map(group.map((r) => [r.fm.id, r]));
  let guard = 0;
  while (applied.size < group.length && guard++ < group.length * group.length) {
    let progressed = false;
    for (const r of group) {
      if (applied.has(r.fm.id)) continue;
      if (r.fm.after && !applied.has(r.fm.after)) continue;
      if (r.fm.after && !byId.has(r.fm.after)) continue;
      applied.add(r.fm.id);
      result.push(r);
      progressed = true;
    }
    if (!progressed) break;
  }
  return applied.size === group.length ? result : null;
}

// --- verification engine ----------------------------------------------------

export function verifyAll({ root = ROOT, patchesDir = PATCHES_DIR, metaDir = VENDOR_DIR } = {}) {
  const failures = [];
  const report = [];
  const fail = (msg) => {
    failures.push(msg);
    report.push(`  ✗ ${msg}`);
  };

  // 0. discover + parse
  const recordFiles = walkRecords(patchesDir);
  report.push(`parsed ${recordFiles.length} patch record(s)\n`);
  let records;
  try {
    records = recordFiles.map((f) => parseRecordFile(f.abs, root));
  } catch (err) {
    fail(`could not parse a record file: ${err.message}`);
    return { failures, report: report.join("\n") };
  }

  // 1. well-formedness
  report.push("== well-formedness ==");
  const ids = new Set();
  for (const r of records) {
    if (r.fm.id) ids.add(r.fm.id);
  }
  for (const r of records) {
    const fm = r.fm;
    if (!fm.id) fail(`missing id: ${r.rel}`);
    else if (records.filter((o) => o.fm.id === fm.id).length > 1) fail(`duplicate id ${fm.id}: ${r.rel}`);
    if (!fm.file) fail(`missing file: ${r.rel}`);
    else if (!existsSync(join(root, fm.file))) fail(`file not in repo: ${fm.file} (${r.rel})`);
    if (!["diff", "behavioral"].includes(fm.verification)) {
      fail(`verification "${fm.verification}": ${r.rel}`);
    }
    if (fm.verification === "diff") {
      if (!fm.upstream?.source || !fm.upstream?.path) {
        fail(`diff record without upstream.source/path: ${fm.id ?? r.rel}`);
      }
      const fences = (readFileSync(r.abs, "utf8").match(/```diff/g) || []).length;
      if (!r.diff) fail(`diff record without a diff block: ${fm.id}`);
      else if (fences !== 1) fail(`expected exactly one diff block, found ${fences}: ${fm.id ?? r.rel}`);
      else if (!r.diff.trimStart().startsWith("---")) fail(`diff block not a unified diff: ${fm.id}`);
    } else if (fm.verification === "behavioral") {
      if (r.diff) fail(`behavioral record with a ## Diff block: ${fm.id}`);
      const asserts = parseStaticAsserts(r.staticAssert);
      if (asserts.length === 0) fail(`behavioral record without a ## Static assert bullet: ${fm.id}`);
      if (asserts.some((a) => a.malformed)) fail(`malformed ## Static assert bullet: ${fm.id}`);
    }
    // deref after: — must name an existing sibling record in the same file
    if (fm.after) {
      if (!ids.has(fm.after)) fail(`after: target ${fm.after} not found: ${fm.id ?? r.rel}`);
      else if (!records.some((o) => o.fm.id === fm.after && o.fm.file === fm.file)) {
        fail(`after: target ${fm.after} is not a record on the same file: ${fm.id ?? r.rel}`);
      }
    }
  }
  if (failures.length > 0) return { failures, report: report.join("\n") };

  // 2. behavioral static asserts (no network)
  const behavioral = records.filter((r) => r.fm.verification === "behavioral");
  if (behavioral.length > 0) {
    report.push("\n== behavioral static asserts ==");
    for (const r of behavioral) {
      const asserts = parseStaticAsserts(r.staticAssert);
      let bOk = true;
      for (const a of asserts) {
        if (a.malformed) continue;
        const body = existsSync(join(root, a.path)) ? readFileSync(join(root, a.path), "utf8") : "";
        const hit = body.includes(a.needle);
        if (a.negated ? hit : !hit) {
          fail(`${r.fm.id}: "${a.path}" ${a.negated ? "should not" : "should"} contain \`${a.needle}\``);
          bOk = false;
        }
      }
      if (bOk) {
        report.push(`  ✓ ${r.fm.id} — static asserts hold`);
        if (r.liveCheck) report.push(`    (live check — human re-run when ${r.fm.file} is edited)`);
      }
    }
    if (failures.length > 0) return { failures: [...failures], report: report.join("\n") };
  }

  // 3. diff reconstruction per file group (clones as needed)
  const diffRecords = records.filter((r) => r.fm.verification === "diff");
  if (diffRecords.length > 0) {
    report.push("\n== diff reconstruction vs pinned upstream ==");
    // repo key -> { source, url, pin } from vendor meta (per-source single home).
    const sourceByRepo = new Map();
    for (const name of readdirSync(metaDir).filter((n) => n.endsWith(".json"))) {
      const meta = loadSourceMeta(name.slice(0, -5), metaDir);
      sourceByRepo.set(meta.repo, { name, url: meta.url, pin: meta.pin });
    }

    const groups = new Map();
    for (const r of diffRecords) {
      groups.set(r.fm.file, [...(groups.get(r.fm.file) || []), r]);
    }

    // Each source is cloned + pin-fetched once, reused across its file groups.
    const scratch = new Map(); // repo -> { tmp, cloneDir, pin, pinAvailable, error }
    const withSource = (repo) => {
      if (scratch.has(repo)) return scratch.get(repo);
      const src = sourceByRepo.get(repo);
      if (!src) return { error: `no vendor meta for upstream.source "${repo}"` };
      const { tmp, cloneDir, pinAvailable, error } = cloneAndFetchPin(
        { name: src.name, url: src.url, repo },
        new Map([[repo, src.pin]]),
      );
      scratch.set(repo, { tmp, cloneDir, pin: src.pin, pinAvailable, error });
      return scratch.get(repo);
    };

    try {
      for (const [file, group] of groups) {
        const reportGroup = () =>
          group.map((g) => g.fm.id).join(", ") + ` — ${file}`;
        const upstreams = [...new Set(group.map((r) => `${r.fm.upstream.source}|${r.fm.upstream.path}`))];
        if (upstreams.length > 1) {
          fail(`grouped records disagree on upstream: ${reportGroup()}`);
          continue;
        }
        const [source, path] = upstreams[0].split("|");
        const h = withSource(source);
        if (h.error) {
          fail(`${reportGroup()}: upstream clone failed: ${h.error}`);
          continue;
        }
        if (!h.pinAvailable) {
          fail(`${reportGroup()}: pinned commit ${h.pin} not fetchable`);
          continue;
        }

        // Lay down the pinned blob at its upstream path in the scratch clone.
        const scratchFile = join(h.cloneDir, ...path.split("/"));
        mkdirSync(dirname(scratchFile), { recursive: true });
        const blob = readPinnedBlob(h, source, path);
        if (blob === null) {
          fail(`${reportGroup()}: pinned blob ${h.pin}:${path} unreadable`);
          continue;
        }
        writeFileSync(scratchFile, N_LF(LF(blob.toString("utf8"))), "utf8");

        const order = topoOrder(group);
        if (!order) {
          fail(`${reportGroup()}: after: dependency cycle`);
          continue;
        }

        // Reconstruct: git-apply each record's hunks in topo order.
        let stateOk = true;
        const appliedCreated = [];
        for (const r of order) {
          const patchAbs = join(os.tmpdir(), `my-skills-record-${r.fm.id.replace(/[^\w.-]/g, "_")}.patch`);
          writeFileSync(patchAbs, N_LF(LF(r.diff)), "utf8");
          const res = spawnSync("git", ["-C", h.cloneDir, "apply", "--whitespace=nowarn", "--", patchAbs], { encoding: "utf8" });
          const tail = (res.stderr || "").trim().split("\n").slice(-2).join(" | ");
          rmSync(patchAbs, { force: true });
          if (res.status !== 0) {
            fail(`${r.fm.id} (${file}): git apply failed: ${tail}`);
            stateOk = false;
            break;
          }
          appliedCreated.push(...createdPaths(r.diff));
        }
        if (!stateOk) continue;

        const re = LF(readFileSync(scratchFile, "utf8"));
        const local = LF(readFileSync(join(root, file), "utf8"));
        if (re === local) {
          report.push(`  ✓ ${file} — reconstructed byte-identical (${group.map((r) => r.fm.id).join(", ")})`);
        } else {
          fail(`${file}: reconstruction ≠ local — ${reportGroup()}`);
          const a = re.split("\n");
          const b = local.split("\n");
          for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if (a[i] !== b[i]) {
              report.push(`    line ${i + 1}:\n      rec: ${JSON.stringify(a[i] ?? "(missing)")}\n      loc: ${JSON.stringify(b[i] ?? "(missing)")}`);
              break;
            }
          }
          continue;
        }

        // New-file hunks (e.g. create-readme's references/) must be byte-exact too.
        for (const relPath of new Set(appliedCreated)) {
          const sc = join(h.cloneDir, ...relPath.split("/"));
          if (!existsSync(sc)) continue;
          const scRe = LF(readFileSync(sc, "utf8"));
          const locAbs = join(root, relPath);
          const locRe = existsSync(locAbs) ? LF(readFileSync(locAbs, "utf8")) : null;
          if (locRe === null || scRe !== locRe) {
            fail(`${relPath}: new-file reconstruction ≠ local (record ${group.map((r) => r.fm.id).join(",")})`);
          }
        }
      }
    } finally {
      for (const s of scratch.values()) rmSync(s.tmp, { recursive: true, force: true });
    }
  }

  const summary = failures.length === 0 ? "\nALL CHECKS PASS" : `\n${failures.length} FAILURE(S)`;
  report.push(summary);
  return { failures, report: report.join("\n") };
}

// `git cat-file` the pinned upstream blob (LF-normalized text). Rejects
// non-existent paths so a mis-typed `upstream.path` fails loudly, not silently.
function gitIn(cloneDir, args) {
  return spawnSync("git", ["-C", cloneDir, ...args]);
}

function readPinnedBlob(h, source, path) {
  const res = gitIn(h.cloneDir, ["cat-file", "blob", `${h.pin}:${path}`]);
  if (res.status !== 0) return null;
  return res.stdout;
}

// --- CLI --------------------------------------------------------------------

function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`Usage: node scripts/verify-patch-records.mjs

Reconstructs every diff-verified patch record at patches/<source>/ from its
unified-diff hunks applied to the pinned upstream blob, byte-compares to the
repo, and runs the well-formedness + behavioral static-assert checks. Exits 1
on any failure. Read-only (scratch lives in the OS temp dir).`);
    return;
  }
  const { failures, report: text } = verifyAll();
  console.log(text);
  process.exit(failures.length > 0 ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}