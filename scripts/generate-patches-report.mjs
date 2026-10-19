#!/usr/bin/env node
// generate-patches-report.mjs — render the patch manifest as a self-contained HTML.
//
// Scans patches/**/*.md (minus patches/README.md), parses each record's
// frontmatter + Why/Diff/Static-assert/Live-check sections, layers the current
// working-tree state (git status/diff) on top, and emits a single standalone
// HTML file — no CDN, no external assets — for humans to eyeball the patch
// situation at a glance.
//
// Read-only: never touches the repo working tree. Usage:
//   node scripts/generate-patches-report.mjs [out.html]
//
// Zero dependencies (Node built-ins only).

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(process.argv[2] ?? join(repoRoot, "patches-report.html"));

// ---------------------------------------------------------------- collection

/** Recursively collect every .md file under a dir, sorted by path. */
function collectMd(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...collectMd(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}

/** Minimal YAML-ish frontmatter parser: flat keys, nested source/path, folded summary. */
function parseFrontmatter(raw) {
  const fm = {};
  const lines = raw.split("\n");
  let inNested = null;
  let inSummary = false;
  const summaryLines = [];
  for (const line of lines) {
    if (inSummary) {
      if (/^\S/.test(line) || line.trim() === "") {
        if (line.trim() !== "" && !/^(origin|after|verification|id|file|upstream|summary):/.test(line)) {
          // summary ran into a sibling scalar without indentation — stop folding
          inSummary = false;
          fm.summary = summaryLines.join(" ").trim();
        } else if (line.trim() === "") {
          continue; // blank line inside folded scalar
        } else {
          // a new top-level key closes the folded summary; fold it now
          inSummary = false;
          fm.summary = summaryLines.join(" ").trim();
        }
      }
      if (inSummary) {
        summaryLines.push(line.trim());
        continue;
      }
    }
    const m = line.match(/^(\S+):(?:\s*(.*))?$/);
    if (inNested === "upstream") {
      // Inside an upstream block: an indented line is a nested key; a new
      // top-level key closes the block and is handled below.
      if (m) { inNested = null; } else {
        const sm = line.match(/^\s+(\S+):\s*(.*)$/);
        if (sm) fm.upstream[sm[1]] = sm[2];
        continue;
      }
    }
    if (!m) continue;
    const [, key, value] = m;
    if (key === "upstream") { inNested = "upstream"; fm.upstream = {}; continue; }
    if (key === "summary") {
      if (value === ">-" || value === ">") {
        inSummary = true;
        continue;
      }
      fm.summary = value;
      continue;
    }
    fm[key] = value ? value.replace(/^"(.*)"$/, "$1") : "";
  }
  if (inSummary) fm.summary = summaryLines.join(" ").trim();
  return fm;
}

/** Parse one record's text (frontmatter + body) into structured parts. */
export function parseRecord(text) {
  const parts = text.split(/^---\s*$/m);
  const fmRaw = parts[1] ?? "";
  const body = parts.slice(2).join("---\n") ?? "";
  const fm = parseFrontmatter(fmRaw);

  const section = (title) => {
    const lines = body.split("\n");
    const start = lines.findIndex((l) => l === `## ${title}`);
    if (start === -1) return null;
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (lines[i].startsWith("## ")) { end = i; break; }
    }
    return lines.slice(start + 1, end).join("\n").trim();
  };

  const diffBlock = (() => {
    const m = body.match(/```diff\n([\s\S]*?)\n```/);
    return m ? m[1] : null;
  })();

  const why = section("Why");
  const statics = section("Static assert (CI-runnable)");
  const live = section("Live check (human re-run)");

  return { fm, why, diff: diffBlock, statics, live };
}

/** Order records so that every `after:` dependency precedes its stacker. */
export function orderByAfter(records) {
  const byFile = new Map();
  for (const r of records) {
    const key = r.fm.file ?? r.rel;
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push(r);
  }
  const ordered = [];
  for (const group of byFile.values()) {
    const placed = new Set();
    const done = new Set();
    const place = (r, chain = new Set()) => {
      if (done.has(r)) return;
      if (chain.has(r)) { ordered.push(r); done.add(r); return; }
      const afterId = r.fm.after;
      if (afterId && !placed.has(r)) {
        const dep = group.find((x) => x.fm.id === afterId);
        if (dep && dep !== r) place(dep, new Set([...chain, r]));
      }
      if (!done.has(r)) { ordered.push(r); done.add(r); placed.add(r); }
    };
    for (const r of group) place(r);
  }
  return ordered;
}

/** Aggregate the manifest-level statistics the report header shows. */
export function buildStats(ordered) {
  const stats = {
    total: ordered.length,
    bySource: {},
    byVerification: {},
    files: new Map(),
  };
  for (const r of ordered) {
    stats.bySource[r.source] = (stats.bySource[r.source] ?? 0) + 1;
    const v = r.fm.verification ?? "?";
    stats.byVerification[v] = (stats.byVerification[v] ?? 0) + 1;
    const key = r.fm.file ?? r.rel;
    if (!stats.files.has(key)) stats.files.set(key, []);
    stats.files.get(key).push(r.fm.id);
  }
  const multiPatchFiles = [...stats.files.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  const stacked = ordered.filter((r) => r.fm.after);
  return { ...stats, multiPatchFiles, stacked };
}

// ---------------------------------------------------------------- manifest

const patchesDir = join(repoRoot, "patches");
const records = collectMd(patchesDir)
  .filter((p) => relative(patchesDir, p) !== "README.md")
  .map((p) => {
    const rel = relative(repoRoot, p);
    const r = parseRecord(readFileSync(p, "utf8"));
    return {
      ...r,
      rel, // patches/... path of the record itself
      source: rel.split(sep)[1],
    };
  })
  .sort((a, b) => {
    const byFile = (a.fm.file ?? "").localeCompare(b.fm.file ?? "");
    if (byFile !== 0) return byFile;
    return (a.fm.id ?? "").localeCompare(b.fm.id ?? "");
  });

// order siblings on the same file by `after:` topology (stable fallback: id)
const ordered = orderByAfter(records);

// ---------------------------------------------------------------- working tree

function git(...args) {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" });
  } catch (e) {
    return "";
  }
}
const statusShort = git("status", "--short");
const diffStat = git("diff", "--stat").trim();
const diffText = git("diff").trim();
const untrackedCount = statusShort.split("\n").filter((l) => l.startsWith("??")).length;
// ---------------------------------------------------------------- stats

const stats = buildStats(ordered);
// ---------------------------------------------------------------- html helpers

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** Render a unified-diff block with line-level highlighting. */
function renderDiff(diff) {
  if (!diff) return "";
  const rows = diff.split("\n").map((line) => {
    let cls = "ctx";
    let text = line;
    if (line.startsWith("@@")) cls = "hunk";
    else if (line.startsWith("+")) cls = "add";
    else if (line.startsWith("-")) cls = "del";
    return `<div class="dl ${cls}"><span class="mark">${esc(text[0] ?? " ")}</span><span class="code">${esc(text.slice(1))}</span></div>`;
  });
  return `<div class="diff">${rows.join("")}</div>`;
}

/** Render a markdown-ish list block (lines starting with "- " or "1. ") as <li>. */
function renderList(block) {
  if (!block) return "";
  const items = block
    .split("\n")
    .map((l) => l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
    .filter((l) => l.trim() !== "");
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

const VERIFICATION_META = {
  diff: { label: "diff-verified", cls: "v-diff", title: "reconstructed against the pinned upstream blob by verify-patch-records.mjs" },
  behavioral: { label: "behavioral", cls: "v-beh", title: "self-authored — no upstream diff baseline; static assert + human re-run" },
};

function recordCard(r, index) {
  const fm = r.fm;
  const vmeta = VERIFICATION_META[fm.verification] ?? { label: fm.verification, cls: "v-other" };
  const upstream = fm.upstream?.source ? `${fm.upstream.source} · ${fm.upstream.path}` : "self-authored";
  const idAnchor = `rec-${(fm.id ?? r.rel).replace(/[^A-Za-z0-9._-]/g, "-")}`;
  const afterId = fm.after;
  const afterBadge = afterId
    ? `<a class="badge badge-after" href="#rec-${afterId.replace(/[^A-Za-z0-9._-]/g, "-")}" title="stacks on top of another record on the same file — click to jump">after: ${esc(afterId)}</a>`
    : "";
  const details = [];
  if (r.diff) details.push(renderDiff(r.diff));
  if (r.statics) details.push(`<div class="sec-label">Static assert (CI-runnable)</div>${renderList(r.statics)}`);
  if (r.live) details.push(`<div class="sec-label">Live check (human re-run)</div>${renderList(r.live)}`);
  if (r.why) details.push(`<div class="sec-label">Why</div><p class="why">${esc(r.why)}</p>`);
  return `
  <details class="rec" id="${idAnchor}">
    <summary>
      <div class="rec-head">
        <span class="rec-id">${esc(fm.id ?? slugOf(r))}</span>
        <span class="badge ${vmeta.cls}" title="${esc(vmeta.title)}">${vmeta.label}</span>
        ${afterBadge}
        <span class="rec-file">${esc(fm.file ?? r.rel)}</span>
      </div>
      <div class="rec-up">${esc(upstream)}</div>
      ${fm.summary ? `<p class="rec-summary">${esc(fm.summary)}</p>` : ""}
    </summary>
    <div class="rec-body">${details.join("")}</div>
  </details>`;
}

function slugOf(r) {
  const parts = (r.fm.id ?? "").split(".");
  return parts[parts.length - 1] ?? r.fm.id;
}

function sourceBlock(source, recordsInSource, index) {
  const label =
    source === "self" ? "self-authored skills" : `upstream: ${source.replace("-", "/")}`;
  return `
  <section class="src" id="src-${index}">
    <h2><span class="src-name">${esc(source)}</span><span class="src-count">${recordsInSource.length}</span></h2>
    <p class="src-label">${esc(label)}</p>
    ${recordsInSource.map((r, i) => recordCard(r, i)).join("")}
  </section>`;
}

// ---------------------------------------------------------------- page

const bySourceName = {};
for (const r of ordered) {
  (bySourceName[r.source] ??= []).push(r);
}
const sourceOrder = [...new Set(ordered.map((r) => r.source))].sort(
  (a, b) => (bySourceName[b] ?? []).length - (bySourceName[a] ?? []).length
);

const statCard = (n, label, sub) => `
  <div class="stat"><div class="stat-n">${n}</div><div class="stat-l">${label}</div>${sub ? `<div class="stat-s">${sub}</div>` : ""}</div>`;

const multiPatchRows = stats.multiPatchFiles
  .map(([file, ids]) => `<tr><td class="mp-file">${esc(file)}</td><td class="mp-n">${ids.length}</td><td class="mp-ids">${esc(ids.join(" · "))}</td></tr>`)
  .join("");

const worktreeHtml = (() => {
  if (!statusShort) return `<p class="clean">Working tree clean — everything committed.</p>`;
  const rows = statusShort.split("\n").filter(Boolean).map((l) => {
    const flag = l.slice(0, 2).trim(); // "??" or "M" (worktree column)
    const p = l.slice(3);
    const isUntracked = flag === "??";
    const flagLabel = isUntracked ? "untracked" : "modified";
    return `<tr><td><span class="badge st-${isUntracked ? "un" : "mod"}">${flagLabel}</span></td><td class="mp-file">${esc(p)}</td></tr>`;
  });
  return `
    <p>${rows.length} change(s) in the working tree:</p>
    <table class="wt">${rows.join("")}</table>
    ${diffStat ? `<details class="wt-diff"><summary>diff --stat</summary><pre>${esc(diffStat)}</pre></details>` : ""}
    ${diffText ? `<details class="wt-diff"><summary>full diff (${diffText.split("\n").length} lines)</summary><pre>${esc(diffText)}</pre></details>` : ""}`;
})();

const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
const headCommit = git("log", "-1", "--format=%h %s").trim();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>my-skills — patch manifest</title>
<style>
  :root{
    --bg:#f6f7f9; --card:#ffffff; --ink:#1c2333; --muted:#5b6472; --line:#e3e6ec;
    --src:#eef1f6; --accent:#2f6feb;
    --add-bg:#e7f7ec; --add:#1a7f37; --del-bg:#fdeef0; --del:#cf222e; --hunk:#ddf0ff; --hunk-ink:#0969da;
    --ctx:#fafbfc; --code:#24292f;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 "Segoe UI",system-ui,-apple-system,sans-serif}
  header.hero{background:linear-gradient(135deg,#101828 0%,#1c3a63 100%);color:#fff;padding:34px 40px 30px}
  header.hero h1{margin:0 0 6px;font-size:26px;font-weight:650;letter-spacing:.2px}
  header.hero p{margin:0;color:#c7d2e0;font-size:14px}
  header.hero .meta{margin-top:10px;font-size:12.5px;color:#93a5c0}
  header.hero .meta code{background:#ffffff14;padding:1px 6px;border-radius:4px;color:#dbe5f2}
  main{max-width:1080px;margin:0 auto;padding:26px 28px 60px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:22px 0 8px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .stat-n{font-size:26px;font-weight:700;line-height:1.1}
  .stat-l{font-size:13px;color:var(--muted);margin-top:2px}
  .stat-s{font-size:12px;color:var(--muted);margin-top:1px}
  h2{font-size:17px;margin:30px 0 4px;display:flex;align-items:center;gap:8px}
  .src{background:var(--src);border:1px solid var(--line);border-radius:12px;padding:14px 16px 16px;margin-top:14px}
  .src h2{margin:0 0 2px}
  .src-name{font-weight:700}
  .src-count{background:#fff;border:1px solid var(--line);border-radius:999px;padding:1px 10px;font-size:12.5px;color:var(--muted);font-weight:600}
  .src-label{color:var(--muted);font-size:12.5px;margin:0 0 12px}
  .rec{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:0}
  .rec summary{list-style:none;cursor:pointer;padding:12px 16px}
  .rec summary::-webkit-details-marker{display:none}
  .rec summary:hover{background:#fbfcfe}
  .rec[open] summary{border-bottom:1px solid var(--line);border-radius:10px 10px 0 0}
  .rec-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rec-id{font-weight:650;font-size:14.5px}
  .badge{display:inline-block;border-radius:999px;padding:1px 9px;font-size:11.5px;font-weight:600;white-space:nowrap}
  .v-diff{background:#e5f2ea;color:#1a7f37}
  .v-beh{background:#fdf3e2;color:#9a6700}
  .badge-after{background:#eef0f7;color:#57606a}
  .st-mod{background:#e5f2ea;color:#1a7f37}
  .st-un{background:#fdf3e2;color:#9a6700}
  .rec-file{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;color:var(--muted);margin-left:auto}
  .rec-up{font-size:12px;color:var(--muted);margin-top:3px;font-family:ui-monospace,Consolas,monospace}
  .rec-summary{margin:8px 0 0;font-size:13.5px;color:#333c4e}
  .rec-body{padding:12px 16px 14px}
  .sec-label{font-size:12px;font-weight:650;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin:10px 0 6px}
  .sec-label:first-child{margin-top:0}
  .why{font-size:13.5px;color:#333c4e;margin:0}
  .diff{border:1px solid var(--line);border-radius:8px;overflow:hidden;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.5}
  .dl{display:flex;white-space:pre-wrap;word-break:break-word}
  .dl .mark{width:1.6em;flex:none;text-align:center;color:#aab;user-select:none}
  .dl .code{flex:1;padding-right:8px}
  .dl.add{background:var(--add-bg)} .dl.add .code{color:var(--add)}
  .dl.del{background:var(--del-bg)} .dl.del .code{color:var(--del)}
  .dl.hunk{background:var(--hunk);color:var(--hunk-ink);font-weight:600}
  .dl.ctx{background:var(--ctx);color:var(--code)}
  ul{margin:0;padding-left:20px}
  ul li{margin:3px 0;font-size:13.5px}
  table.mp{border-collapse:collapse;width:100%;margin:8px 0 4px;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  .mp th,.mp td{padding:7px 12px;text-align:left;font-size:13px;border-bottom:1px solid var(--line)}
  .mp th{background:#f0f2f6;font-weight:650;font-size:12px;text-transform:uppercase;letter-spacing:.3px;color:var(--muted)}
  .mp tr:last-child td{border-bottom:none}
  .mp-file{font-family:ui-monospace,Consolas,monospace;font-size:12.5px}
  .mp-n{font-weight:700;text-align:center}
  .mp-ids{color:var(--muted);font-size:12px;font-family:ui-monospace,Consolas,monospace}
  section.worktree{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-top:26px}
  .clean{color:#1a7f37;font-weight:600;margin:0}
  details.wt-diff{margin-top:10px}
  details.wt-diff summary{cursor:pointer;font-weight:600;font-size:13px;color:var(--accent)}
  details.wt-diff pre{background:#101828;color:#dbe5f2;border-radius:8px;padding:12px;overflow:auto;font-size:12px;white-space:pre-wrap;word-break:break-word}
  .foot{color:var(--muted);font-size:12px;margin-top:34px;text-align:center}
  a.badge-after{text-decoration:none}
  a.badge-after:hover{box-shadow:0 0 0 2px #c9d4f0}
  html{scroll-behavior:smooth}
</style>
</head>
<body>
<header class="hero">
  <h1>my-skills — patch manifest</h1>
  <p>Every deviation from upstream, record by record. Generated from <code>patches/</code>.</p>
  <div class="meta">generated <code>${esc(generatedAt)}</code> · head <code>${esc(headCommit)}</code> · out <code>${esc(relative(repoRoot, outPath))}</code></div>
</header>
<main>
  <div class="stats">
    ${statCard(stats.total, "patch records", "patches/**/*.md")}
    ${Object.entries(stats.byVerification).map(([k, v]) => statCard(v, k === "diff" ? "diff-verified" : "behavioral", k === "diff" ? "reconstructed vs pinned upstream" : "self-authored, no diff baseline")).join("")}
    ${statCard(stats.stacked.length, "stacked", "records with an `after:` dependency")}
    ${statCard(stats.multiPatchFiles.length, "multi-patch files", "files carrying &gt;1 patch")}
  </div>

  <section class="worktree">
    <h2>Working tree — uncommitted changes</h2>
    ${worktreeHtml}
  </section>

  ${stats.multiPatchFiles.length ? `
  <h2>Files patched the most</h2>
  <table class="mp">
    <thead><tr><th>local file</th><th>#patches</th><th>record ids</th></tr></thead>
    <tbody>${multiPatchRows}</tbody>
  </table>` : ""}

  <h2>Records by source</h2>
  ${sourceOrder.map((s, i) => sourceBlock(s, bySourceName[s], i)).join("")}

  <p class="foot">Generated by <code>scripts/generate-patches-report.mjs</code> — re-run to refresh. Click any record to expand its diff / assertions.</p>
</main>
<script>
  // Expand the target record when navigating via an after: link (hash jump).
  function openTarget() {
    const id = location.hash.replace(/^#/, "");
    if (!id.startsWith("rec-")) return;
    const el = document.getElementById(id);
    if (el) { el.open = true; el.scrollIntoView({ block: "start" }); }
  }
  window.addEventListener("hashchange", openTarget);
  openTarget();
</script>
</body>
</html>
`;

// Write the report only when run directly — importing the module (tests)
// must stay side-effect-free. `process.argv[1]` holds the entry script path.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(outPath, html);
  const sizes = {
    records: records.length,
    diffRecords: ordered.filter((r) => r.diff).length,
    behavioralRecords: ordered.filter((r) => r.fm.verification === "behavioral").length,
    htmlBytes: Buffer.byteLength(html, "utf8"),
  };
  console.log(`wrote ${outPath} (${sizes.htmlBytes} bytes, ${sizes.records} records: ${sizes.diffRecords} diff + ${sizes.behavioralRecords} behavioral)`);
}
