// Throwaway prototype verifier v2 (ticket #22): reconstruct each patched file
// from its record hunks + the pinned upstream blob via `git apply`, byte-compare
// to the repo, plus format well-formedness checks. Not production code — proves
// the "diff vs pin equals the recorded patch lines" assertion mechanics on the
// sample records, using standard unified diff hunks.
import { createRequire } from 'node:module';
import { spawnSync, execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = process.env.MY_SKILLS_REPO || 'C:/Users/Hue/Repos/my-skills';
const require = createRequire(join(REPO, 'package.json'));
const YAML = require('yaml');

const ROOT = dirname(fileURLToPath(import.meta.url));
const SCRATCH = process.env.PROTOTYPE_SCRATCH || join(ROOT, 'scratch');
const RECORDS_DIR = join(ROOT, 'patches');

// source key -> clone URL, for the scratch bootstrap fetch
const SOURCE_URLS = {
  'mattpocock/skills': 'https://github.com/mattpocock/skills.git',
};

// bootstrap: init the scratch repo and fetch every distinct pinned commit
// (pins are inline in the records during the migration window)
function ensureScratch(records) {
  const seen = new Set();
  for (const r of records) {
    const u = r.fm.upstream;
    if (!u || seen.has(`${u.source}|${u.pin}`)) continue;
    seen.add(`${u.source}|${u.pin}`);
    const url = SOURCE_URLS[u.source];
    if (!url) throw new Error(`no URL for source ${u.source}`);
    if (!existsSync(join(SCRATCH, '.git', 'FETCH_HEAD'))) {
      mkdirSync(SCRATCH, { recursive: true });
      execSync(`git init -q "${SCRATCH}"`, { encoding: 'utf8' });
      execSync(`git -C "${SCRATCH}" remote add origin "${url}"`, { encoding: 'utf8' });
    }
    try {
      execSync(`git -C "${SCRATCH}" fetch --depth 1 origin ${u.pin}`, { encoding: 'utf8', stdio: ['ignore', 'ignore', 'inherit'] });
    } catch {
      // already fetched (duplicate pin) — ignore
    }
  }
}

const lf = (s) => s.replace(/\r\n/g, '\n');
let failures = 0;
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}

function parseRecord(path) {
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`no frontmatter: ${path}`);
  const fm = YAML.parse(m[1]);
  const d = text.match(/```diff\n([\s\S]*?)\n```/);
  const diff = d ? d[1] : null;
  return { path, fm, diff, text };
}

const records = walk(RECORDS_DIR).map(parseRecord);
console.log(`\nParsed ${records.length} records\n`);
ensureScratch(records);

// ---- well-formedness checks ----
console.log('== well-formedness ==');
const ids = new Set();
for (const r of records) {
  const { fm } = r;
  if (!fm.id) { fail(`${r.path}: missing id`); continue; }
  if (ids.has(fm.id)) fail(`duplicate id: ${fm.id}`);
  ids.add(fm.id);
  if (!fm.file) fail(`${fm.id}: missing file`);
  else if (!statSync(join(REPO, fm.file), { throwIfNoEntry: false })) fail(`${fm.id}: file not in repo: ${fm.file}`);
  if (!['diff', 'behavioral'].includes(fm.verification)) fail(`${fm.id}: bad verification ${fm.verification}`);
  if (fm.verification === 'diff' && !fm.upstream) fail(`${fm.id}: diff record without upstream`);
  if (fm.verification === 'diff' && !r.diff) fail(`${fm.id}: diff record without ## Diff block`);
  if (fm.verification === 'behavioral' && r.diff) fail(`${fm.id}: behavioral record with ## Diff block`);
  if (r.diff && !r.diff.startsWith('--- a/')) fail(`${fm.id}: diff block not unified diff (missing --- a/ header)`);
}
for (const r of records) {
  if (r.fm.after && !ids.has(r.fm.after)) fail(`${r.fm.id}: after: target ${r.fm.after} not found`);
}

// ---- reconstruction ----
const byFile = new Map();
for (const r of records) byFile.set(r.fm.file, [...(byFile.get(r.fm.file) || []), r]);

for (const [file, recs] of byFile) {
  console.log(`\n== ${file} (${recs.length} record(s)) ==`);
  const upstreams = new Set(recs.map((r) => r.fm.upstream).filter(Boolean).map((u) => `${u.source}|${u.path}|${u.pin}`));
  if (upstreams.size > 1) { fail('records disagree on upstream'); continue; }
  const up = upstreams.values().next().value;

  if (!up) {
    const behavioral = recs.every((r) => r.fm.verification === 'behavioral');
    behavioral ? ok('no upstream baseline; all records behavioral — static asserts below')
               : fail('file has no upstream but a record claims diff verification');
    continue;
  }
  const [, path, pin] = up.split('|');

  // scratch tree: pinned blob at the upstream path
  const target = join(SCRATCH, ...path.split('/'));
  mkdirSync(dirname(target), { recursive: true });
  const blob = lf(execSync(`git -C "${SCRATCH}" show ${pin}:${path}`, { encoding: 'utf8' }));
  writeFileSync(target, blob, 'utf8');

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
  if (applied.size < recs.length) { fail(`dependency cycle or missing after target on ${file}`); continue; }

  let stateOk = true;
  for (const r of order) {
    const patchFile = join(ROOT, `.tmp-${r.fm.id}.patch`);
    writeFileSync(patchFile, lf(r.diff) + '\n', 'utf8');
    const res = spawnSync('git', ['-C', SCRATCH, 'apply', '--whitespace=nowarn', patchFile], { encoding: 'utf8' });
    if (res.status !== 0) {
      fail(`${r.fm.id}: git apply failed: ${(res.stderr || '').trim().split('\n').slice(-2).join(' | ')}`);
      stateOk = false; break;
    }
    rmSync(patchFile, { force: true });
  }
  if (!stateOk) continue;

  const patched = lf(readFileSync(target, 'utf8'));
  const local = lf(readFileSync(join(REPO, file), 'utf8'));
  if (patched === local) ok(`reconstruction byte-identical to local (${recs.map((r) => r.fm.id).join(', ')})`);
  else {
    fail(`reconstruction ≠ local — ${file}`);
    const a = patched.split('\n'), b = local.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        console.log(`    line ${i + 1}:\n    rec: ${JSON.stringify(a[i] ?? '(missing)')}\n    loc: ${JSON.stringify(b[i] ?? '(missing)')}`);
        break;
      }
    }
  }
}

// ---- behavioral static asserts ----
console.log('\n== behavioral static asserts (write-release-notes) ==');
const wrn = readFileSync(join(REPO, 'skills/self/write-release-notes/SKILL.md'), 'utf8');
const npm = readFileSync(join(REPO, 'skills/self/npm-release/SKILL.md'), 'utf8');
wrn.includes('$env:TEMP\\release-notes-') ? ok('write-release-notes uses $env:TEMP\\release-notes-')
                                          : fail('write-release-notes lost the $env:TEMP form');
!wrn.includes('/tmp/release-notes') ? ok('write-release-notes has no /tmp/release-notes')
                                    : fail('write-release-notes still has /tmp/release-notes');
!npm.includes('--notes-file') ? ok('npm-release carries no --notes-file')
                              : fail('npm-release still carries --notes-file');
npm.includes('write-release-notes') ? ok('npm-release delegates to write-release-notes')
                                    : fail('npm-release lost the delegation');

console.log(failures === 0 ? '\nALL CHECKS PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
