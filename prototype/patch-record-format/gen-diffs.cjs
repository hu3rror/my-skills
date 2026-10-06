// Prototype helper: rewrite each diff record's `## Diff` block from the
// line-pair format to a standard unified diff (context lines + line numbers),
// computed from the actual pinned/intermediate state. Throwaway code.
const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { createRequire } = require('node:module');
const require2 = createRequire('C:/Users/Hue/Repos/my-skills/package.json');
const YAML = require2('yaml');
const { dirname, join } = require('node:path');

const ROOT = 'C:/Users/Hue/AppData/Local/Temp/patch-record-format-prototype';
const SCRATCH = join(ROOT, 'scratch');
const PIN = '4588b32ecab9ecc9fc8cc6b6c5e7d675b6004b0d';
const lf = (s) => s.replace(/\r\n/g, '\n');

const RECORDS = [
  'patches/mattpocock/engineering/wayfinder/load-skills-rewrite.md',
  'patches/mattpocock/engineering/wayfinder/step5-push-note.md',
  'patches/mattpocock/engineering/research/step3-repo-internal.md',
  'patches/mattpocock/engineering/research/pushed-completion.md',
];

function parse(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  const fm = YAML.parse(m[1]);
  const d = text.match(/```diff\n([\s\S]*?)\n```/);
  const pairs = [];
  if (d) {
    const block = lf(d[1]);
    if (block.startsWith('--- a/')) {
      // already unified diff: reparse -/+ lines, ignore headers/context
      let cur = null;
      for (const line of block.split('\n')) {
        if (line.startsWith('--- a/') || line.startsWith('+++ b/') || line.startsWith('@@')) continue;
        if (line.startsWith('-')) { cur = { from: line.slice(1), to: [] }; pairs.push(cur); }
        else if (line.startsWith('+')) { if (!cur) throw new Error('+ without -'); cur.to.push(line.slice(1)); }
        // context lines (leading space) are ignored
      }
    } else {
      let cur = null;
      for (const line of block.split('\n')) {
        if (line.startsWith('- ')) { cur = { from: line.slice(2), to: [] }; pairs.push(cur); }
        else if (line.startsWith('+ ') || line === '+') { if (!cur) throw new Error('+ without -'); cur.to.push(line.startsWith('+ ') ? line.slice(2) : ''); }
      }
    }
  }
  return { fm, pairs };
}

// build state after applying a record's pairs to a base
function applyPairs(base, pairs) {
  let state = base;
  for (const { from, to } of pairs) {
    const lines = state.split('\n');
    const hits = lines.map((l, i) => [l, i]).filter(([l]) => l === from);
    if (hits.length !== 1) throw new Error(`context not unique: ${JSON.stringify(from.slice(0, 50))}`);
    lines.splice(hits[0][1], 1, ...to);
    state = lines.join('\n');
  }
  return state;
}

// emit a unified diff for one pair applied to `state`
function linesOf(state) {
  const lines = state.split('\n');
  if (lines[lines.length - 1] === '') lines.pop(); // trailing newline phantom
  return lines;
}
function emitHunk(state, from, to) {
  const lines = linesOf(state);
  const i = lines.indexOf(from); // unique by construction
  const lead = i > 0 ? [lines[i - 1]] : [];
  const trail = i + 1 < lines.length ? [lines[i + 1]] : [];
  const oldStart = i + 1 - lead.length;
  const newStart = i + 1 - lead.length;
  const oldCount = 1 + lead.length + trail.length;
  const newCount = to.length + lead.length + trail.length;
  const out = [`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`];
  for (const c of lead) out.push(` ${c}`);
  out.push(`-${from}`);
  for (const t of to) out.push(`+${t}`);
  for (const c of trail) out.push(` ${c}`);
  return out.join('\n');
}

// per-file processing in dependency order
const byFile = new Map();
for (const rel of RECORDS) {
  const { fm, pairs } = parse(readFileSync(join(ROOT, rel), 'utf8'));
  if (!byFile.has(fm.file)) byFile.set(fm.file, []);
  byFile.get(fm.file).push({ rel, fm, pairs });
}

for (const [file, recs] of byFile) {
  const up = recs[0].fm.upstream;
  const base = lf(execSync(`git -C "${SCRATCH}" show ${up.pin}:${up.path}`, { encoding: 'utf8' }));
  // topo order by after
  const order = [];
  const applied = new Set();
  let guard = 0;
  while (applied.size < recs.length && guard++ < 100) {
    for (const r of recs) {
      if (applied.has(r.fm.id)) continue;
      if (r.fm.after && !applied.has(r.fm.after)) continue;
      applied.add(r.fm.id); order.push(r);
    }
  }
  // accumulate hunks as state advances
  let state = base;
  for (const r of order) {
    // group adjacent pairs (git apply matches all hunks against the original
    // file, so per-pair hunks whose context includes a sibling's result fail)
    const inputLines = linesOf(state);
    const groups = [];
    let cur = null;
    for (const p of r.pairs) {
      const i = inputLines.indexOf(p.from);
      if (i === -1) throw new Error(`context not found: ${JSON.stringify(p.from.slice(0, 50))}`);
      if (cur && i <= cur.last + 1) { cur.pairs.push(p); cur.last = Math.max(cur.last, i); }
      else { cur = { pairs: [p], first: i, last: i }; groups.push(cur); }
    }
    const hunks = [];
    for (const g of groups) {
      const lead = g.first > 0 ? [inputLines[g.first - 1]] : [];
      const trail = g.last + 1 < inputLines.length ? [inputLines[g.last + 1]] : [];
      const oldStart = g.first + 1 - lead.length;
      const newStart = g.first + 1 - lead.length;
      const oldCount = g.last - g.first + 1 + lead.length + trail.length;
      const newCount = g.pairs.reduce((n, p) => n + p.to.length, 0) + lead.length + trail.length;
      const out = [`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`];
      for (const c of lead) out.push(` ${c}`);
      for (const p of g.pairs) { out.push(`-${p.from}`); for (const t of p.to) out.push(`+${t}`); }
      for (const c of trail) out.push(` ${c}`);
      hunks.push(out.join('\n'));
    }
    // advance state for the next record's `after` target
    for (const { from, to } of r.pairs) {
      const lines = linesOf(state);
      const i = lines.indexOf(from);
      lines.splice(i, 1, ...to);
      state = lines.join('\n');
    }
    const header = `--- a/${up.path}\n+++ b/${up.path}`;
    const unified = `${header}\n${hunks.join('\n')}`;
    // splice into the record: replace the fenced block content (keep blank
    // trailing context lines — trimEnd would strip them and corrupt the hunk)
    const path = join(ROOT, r.rel);
    const text = readFileSync(path, 'utf8');
    const replaced = text.replace(
      /```diff\n[\s\S]*?\n```/,
      (m) => '```diff\n' + unified + '\n```',
    );
    writeFileSync(path, replaced, 'utf8');
    console.log(`wrote ${r.rel} (${r.pairs.length} hunk(s))`);
  }
}
console.log('done');
