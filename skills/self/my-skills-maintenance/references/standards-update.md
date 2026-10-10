# Branch: standards update — roll a new baseline into consumer repos

The update path for `CODING_STANDARDS.md` files already generated in other
repos. When `setup-coding-standards`' baseline gains a version, bring each
target file up to it: replace the baseline region above the file's marker with
the new baseline, keep everything below the marker untouched, show the diff,
then write. Creation is `setup-coding-standards`' job (it stops when a file
exists); this branch is that existing file's update path.

This branch touches neither `skills/` nor the store, so the router's stray
pre-check does not apply to it.

## 1. Collect target repos

Take the repo list from the user, or scan a directory they name (one level
deep, looking for `CODING_STANDARDS.md`, e.g. under `C:\Users\Hue\Repos`).
Repos without that file are skipped — creating one is `setup-coding-standards`' job.

Done when the target list is fixed and shown to the user.

## 2. Classify each file by its stamp

The **stamp** is the marker line the file was generated with:
`<!-- end of baseline v<N>; ... -->`. The current version is the stamp inside
the source of truth:

```
grep -o 'baseline v[0-9]*' "$REPO/skills/self/setup-coding-standards/references/baseline.md" | tail -1
```

(Reading the version from `baseline.md` keeps one home for it; never hardcode
a version into this branch.)

Per file:

- **No stamp** — generated before stamps existed (legacy): not mechanically
  upgradeable. The first migration is a judgement merge — old baseline lines
  matched against the new sections by eye, with the user. Report it and stop
  for their call; never guess a merge.
- **vN ≥ current** — already current, skip.
- **vN < current** — upgrade candidate.

Done when every file has one class, shown to the user.

## 3. Compose the upgrade, show the diff, then write

For each candidate, the new file is exactly two parts:

```
baseline.md — verbatim, including its own stamp line
+ every line of the old file below its stamp line
```

Mechanically, in the target repo:

```
ML=$(grep -n 'end of baseline' CODING_STANDARDS.md | cut -d: -f1)
{ cat "$REPO/skills/self/setup-coding-standards/references/baseline.md"; \
  tail -n +$((ML+1)) CODING_STANDARDS.md; } > CODING_STANDARDS.md.new
```

Verify **before** showing the user — two byte-identity checks:

```
# the region above the new stamp is baseline.md exactly (stamp included)
head -n $(grep -n 'end of baseline' CODING_STANDARDS.md.new | cut -d: -f1) \
  CODING_STANDARDS.md.new | diff - "$REPO/skills/self/setup-coding-standards/references/baseline.md"
# the region below the new stamp equals the old file below its stamp
sed -n "$((ML+1)),\$p" CODING_STANDARDS.md | \
  diff - <(sed -n "$(($(grep -n 'end of baseline' CODING_STANDARDS.md.new | cut -d: -f1)+1)),\$p" CODING_STANDARDS.md.new)
```

Only then show the diff (`old file → `.new`) and wait for the user's go-ahead
**per repo** before writing. These are their files; the "existing standards
file is the human's to change" guardrail of `setup-coding-standards` applies
here at update time. Declined candidates stay untouched.

Done when every candidate is written or explicitly declined, and each written
file passes both byte-identity checks.

## 4. Report

List per repo: **skipped** (no file), **current** (stamp up to date), **upgraded**
(old vN → new vM), **legacy** (no stamp, needs the judgement merge), **declined**.
Committing is the user's call per repo — each commit belongs to its target
repo, not this one; offer to make them if asked.