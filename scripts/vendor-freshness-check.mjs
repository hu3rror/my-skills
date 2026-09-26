#!/usr/bin/env node
// Open or close the pending-update issue for the vendor freshness check.
//
// Invoked by .github/workflows/vendor-freshness-check.yml after
// `vendor-sync.mjs --dry-run`: reads the machine-readable
// VENDOR_SYNC_SUMMARY line the sync script prints, then translates it into
// GitHub issue state:
//   - pending updates, no open pending-update issue -> create one (labeled,
//     assigned to the repo owner)
//   - pending updates, an open issue already exists -> do nothing (the open
//     issue is the dedup marker; new updates never spam)
//   - copies current, an open issue exists          -> close it as completed
// Assignment is what actually delivers the notification: repo owners are not
// auto-watchers of their own repos, so an unassigned issue may never ping them.
// The workflow runs with GH_TOKEN (github.token, issues:write) and the
// gh CLI preinstalled on runners.
//
// usage: node scripts/vendor-freshness-check.mjs <sync log> [--dry-run]
// env: GH_TOKEN (or any gh auth), GITHUB_REPOSITORY, GITHUB_RUN_ID (the
// last two come preset on Actions runners).
// --dry-run prints what it would do; read-only API queries still run so the
// parsing/state logic is exercised for real, but nothing is written.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LOG_PATH = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
const LABEL = "pending-update";
const LABEL_COLOR = "FBCA04";
const LABEL_DESCRIPTION =
  "Upstream skill sources have changes not yet vendored (auto-opened by the vendor freshness check)";
const REPO = process.env.GITHUB_REPOSITORY;
const RUN_ID = process.env.GITHUB_RUN_ID || "local";
const OWNER = REPO ? REPO.split("/")[0] : null;

if (!LOG_PATH) {
  console.error("usage: vendor-freshness-check.mjs <vendor-sync log> [--dry-run]");
  process.exit(2);
}
if (!REPO) {
  console.error("GITHUB_REPOSITORY is not set (expected owner/repo)");
  process.exit(2);
}

const summary = readSummary();
if (summary.dryRun !== true) {
  // Guard against feeding this a real-mode log (e.g. a manual
  // `vendor-sync.mjs | tee ...`): acting on already-applied changes would
  // open an issue for files that are already vendored.
  console.error("refusing to act on a non-dry-run summary; rerun vendor-sync with --dry-run");
  process.exit(1);
}
console.log(
  `summary: changed=${summary.changed} failed=${summary.failed} errors=${(summary.errors || []).length}`,
);

const open = findOpenPendingIssues();
console.log(`open pending-update issue(s): ${open.length ? `#${open.join(", #")}` : "none"}`);

if (summary.failed || (summary.errors || []).length > 0) {
  console.error("sync reported errors; leaving issues untouched");
  process.exit(1);
}

if (!summary.changed) {
  closeStale(open);
} else if (open.length > 0) {
  console.log(`pending updates already reported by #${open.join(", #")} — leaving as-is`);
} else {
  createIssue(summary);
}

function readSummary() {
  const text = readFileSync(LOG_PATH, "utf8");
  const line = text
    .split(/\r?\n/)
    .reverse()
    .find((l) => l.startsWith("VENDOR_SYNC_SUMMARY="));
  if (!line) {
    throw new Error(`no VENDOR_SYNC_SUMMARY line in ${LOG_PATH}`);
  }
  return JSON.parse(line.slice("VENDOR_SYNC_SUMMARY=".length));
}

function findOpenPendingIssues() {
  const out = runGh(
    ["api", `repos/${REPO}/issues?state=open&labels=${LABEL}&per_page=100`],
    "list open pending-update issues",
  );
  const issues = JSON.parse(out.trim() || "[]");
  return issues.filter((i) => !i.pull_request).map((i) => i.number);
}

function createIssue(s) {
  const title = `Pending update: ${s.sources
    .filter((src) => src.pending)
    .map((src) => src.name)
    .join(", ")}`;
  const body = buildBody(s);
  if (DRY_RUN) {
    console.log(`[dry-run] would create issue: ${title}`);
    console.log(`[dry-run] body:\n${body}`);
    return;
  }
  ensureLabel();
  const { dir, path } = writeTempFile(body);
  try {
    runGh(
      [
        "issue", "create",
        "--title", title,
        "--body-file", path,
        "--label", LABEL,
        "--assignee", OWNER,
      ],
      `create pending-update issue (assigned to ${OWNER})`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function closeStale(open) {
  if (DRY_RUN) {
    console.log(`[dry-run] would close: ${open.map((n) => `#${n}`).join(", ") || "none"}`);
    return;
  }
  for (const num of open) {
    runGh(
      [
        "issue", "close", String(num), "--reason", "completed",
        "--comment", "The vendor freshness check found the copies current again — closing.",
      ],
      `close pending-update issue #${num}`,
    );
  }
}

function ensureLabel() {
  runGh(
    ["label", "create", LABEL, "--color", LABEL_COLOR, "--description", LABEL_DESCRIPTION, "--force"],
    `ensure label ${LABEL}`,
  );
}

function buildBody(s) {
  const lines = [
    "Upstream skill sources have changes not yet vendored into this repo.",
    "",
    `Checked [run ${RUN_ID}](https://github.com/${REPO}/actions/runs/${RUN_ID}).`,
    "",
    "## Pending updates",
    "",
  ];
  for (const src of s.sources.filter((x) => x.pending)) {
    lines.push(`### ${src.name}`);
    bullet(lines, "add", src.added);
    bullet(lines, "update", src.updated);
    bullet(lines, "removed upstream (kept local)", src.removed);
    bullet(lines, "**manual merge** — patched file, upstream modified", src.patchedDiffers);
    bullet(lines, "**manual merge** — patched file, upstream removed", src.patchedRemoved);
    if (src.releaseRepo) {
      const rel = latestRelease(src.releaseRepo);
      if (rel) {
        lines.push(`- latest upstream release: \`${rel.tag_name}\` (${String(rel.published_at).slice(0, 10)})`);
      }
    }
    lines.push("");
  }
  lines.push("## What to do");
  lines.push("");
  lines.push("1. Fast path: have the `vendor-sync` skill drive this whole list — say \"resolve the pending update\"");
  lines.push("2. Preview: `node scripts/vendor-sync.mjs --dry-run`");
  lines.push("3. Sync: `node scripts/vendor-sync.mjs`, then review the diff");
  lines.push("4. Patched files are never overwritten by sync — merge them manually");
  lines.push("5. Commit & push; this issue closes automatically once the copies are current");
  return lines.join("\n");
}

function bullet(lines, label, paths) {
  for (const p of paths || []) lines.push(`- ${label}: \`${p}\``);
}

function latestRelease(fullName) {
  try {
    const rel = JSON.parse(runGh(["api", `repos/${fullName}/releases/latest`], `fetch latest release of ${fullName}`));
    return { tag_name: rel.tag_name, published_at: rel.published_at };
  } catch {
    return null; // no releases or API hiccup — omit the line rather than fail
  }
}

function writeTempFile(content) {
  const dir = mkdtempSync(join(tmpdir(), "vendor-update-"));
  const path = join(dir, "issue-body.md");
  writeFileSync(path, content, "utf8");
  return { dir, path };
}

function runGh(args, what) {
  const res = spawnSync("gh", args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`${what} failed (exit ${res.status}): ${(res.stderr || res.stdout || "").trim()}`);
  }
  return res.stdout || "";
}
