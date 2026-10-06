#!/usr/bin/env node
// Maintenance budget guard (map ticket #27).
//
// The redesign's complexity budget must be a measurable upper bound, not a
// feeling: the new mechanism's code + tests must not grow past today's size,
// CI jobs must not increase, and per-operation step counts must only
// decrease. This file meters the two machine-verifiable halves of that
// budget and runs in the existing script-tests CI job — it adds no new
// workflow (the "CI jobs not increased" rule applies to the mechanism, and
// the metering must not break it to enforce it).
//
// Baselines measured at commit 7c0c3a4 (docs/maintenance-budget.md):
//   - scripts code + tests: 3059 lines (the 2350 cited in #27 was the
//     charting-day measure at 8bdc964; the +709 delta is the already-landed
//     #23 rehoming and #24 merge-subcommand prep — part of the new mechanism);
//   - CI jobs: 3, one per workflow (script-tests, vendor-freshness-check,
//     vendor-sync); #25 drops vendor-sync.yml at migration, so the
//     post-migration surface is 2. The budget anchors at today's count.
//
// Bumping either constant is a deliberate, documented act: change the value
// AND update docs/maintenance-budget.md with the date and reason. The guard
// excludes its own lines from the count — the meter is not the mechanism.
// Jobs are counted as `runs-on:` lines (every job has exactly one; no
// reusable jobs in this repo), so a second job added to an existing workflow
// trips the guard just like a new workflow would.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS = join(SCRIPTS, "..", ".github", "workflows");

const CODE_TESTS_BUDGET = 3059;
const JOBS_BUDGET = 3;

// wc -l parity: count newlines, not split chunks, so the number matches the
// measured baseline and stays correct under CRLF working-tree checkouts.
function lineCount(text) {
  return (text.match(/\n/g) || []).length;
}

function scriptLines() {
  const rows = [];
  let total = 0;
  for (const name of readdirSync(SCRIPTS).sort()) {
    if (!name.endsWith(".mjs")) continue;
    if (name === "maintenance-budget.test.mjs") continue; // the meter
    const lines = lineCount(readFileSync(join(SCRIPTS, name), "utf8"));
    rows.push(`    ${String(lines).padStart(5)} ${name}`);
    total += lines;
  }
  return { rows, total };
}

test("maintenance budget: scripts code+tests stay within the #27 upper bound", () => {
  const { rows, total } = scriptLines();
  console.log(`\n  script lines (code + tests, ${relative(process.cwd(), SCRIPTS)}/):`);
  console.log(rows.join("\n"));
  console.log(`  total: ${total} (budget ${CODE_TESTS_BUDGET})`);
  assert.ok(
    total <= CODE_TESTS_BUDGET,
    [
      `script lines ${total} exceed the #27 budget ${CODE_TESTS_BUDGET}.`,
      "Growing the maintenance machinery needs a deliberate, documented budget",
      "bump: raise CODE_TESTS_BUDGET and update docs/maintenance-budget.md",
      "with the date and reason (map #18 / ticket #27).",
    ].join("\n"),
  );
});

test("maintenance budget: CI job count is not increased", () => {
  let jobs = 0;
  for (const name of readdirSync(WORKFLOWS).filter((n) => n.endsWith(".yml"))) {
    jobs += (readFileSync(join(WORKFLOWS, name), "utf8").match(/runs-on:/g) || []).length;
  }
  assert.ok(
    jobs <= JOBS_BUDGET,
    [
      `CI jobs ${jobs} exceed the #27 budget ${JOBS_BUDGET}.`,
      "A new job is a maintenance-cost increase: fold the check into the",
      "existing script-tests job instead, or deliberately bump JOBS_BUDGET",
      "and document it (map #18 / ticket #27).",
    ].join("\n"),
  );
});
