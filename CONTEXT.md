# Shared Skills

The version-controlled single home of every shared agent skill, organized by upstream source. Owns the distribution chain into the machine-local canonical skills store and the patch record for every deviation from upstream.

## Distribution & Ownership

**Aggregation repo**:
The version-controlled home of all shared skills, organized by upstream source; the only content source for the distribution chain.
_Avoid_: skills store (confused with the canonical skills store), my-skills (this repo's proper name, not the concept)

**Consolidated copy**:
A skill's file as it lives in the aggregation repo — the middle copy between the upstream original and the canonical-store copy, and the one that carries patches.
_Avoid_: copy (too generic), patched copy (used but undefined)

**Canonical skills store**:
The machine-local runtime directory (`~/.agents/skills`) that `npx skills` installs into from the aggregation repo. A derived distribution target — never edited directly, because the next update silently clobbers local edits.
_Avoid_: canonical source, canonical copies (reserve "canonical" for this store)

**Distribution chain**:
The pipeline `npx skills add <aggregation repo> -a pi universal -s '*' -g` → canonical skills store + pi junctions. The explicit `-a pi universal` targets pi only: a single `-a` argument flips the CLI into copy mode (real directories instead of junctions) and `--all` would link every agent detected on the machine. Works only while the aggregation repo stays the single configured source.
_Avoid_: install (a single hop, not the chain)

**Vendor sync**:
The upstream leg of the skill flow, opposite the distribution chain: the script (`scripts/vendor-sync.mjs`) that pulls upstream skills into the aggregation repo's consolidated copies.
_Avoid_: sync script (too generic)

**Junction**:
The link type in `~/.pi/agent/skills` that exposes canonical-store skills to pi without copying. The pi config hosts no skill copies — junctions only.
_Avoid_: symlink (a different Windows mechanism)

**Upstream**:
An external skill source vendored into the repo (mattpocock/skills, yetone/kill-ai-slop, cloudflare). Never consumed directly by the distribution chain. Provenance — the traced attribution of a skill to its upstream (`~/.agents/.skill-lock.json`) — decides the source directory; unattributed skills wait under `skills/other/`.
_Avoid_: source (too generic)

**pi-specific skill**:
A skill owned by this user's pi workflows (`npm-release`, `pi-extension-sync`); lives under `skills/self/` and must keep `disable-model-invocation: true` so other harnesses sharing the canonical store never auto-trigger it.
_Avoid_: pi skill (drops the other-harness visibility consequence)

## Update detection

**Vendor freshness check**:
The periodic inspection that determines whether an upstream source has content not yet present in its consolidated copy. Reports rather than modifies: findings land in a pending-update issue, never in changed files.
_Avoid_: update check, update watcher

**Pending update**:
A state in which an upstream source's current content differs from its consolidated copy — new or changed files, files upstream removed (kept for review), or a patched file that upstream modified.
_Avoid_: update, diff

**Pending-update issue**:
The GitHub issue that records a pending update for the maintainer to act on. Open while the update is pending; closed by the freshness check once the copies are current again.
_Avoid_: notification issue, alert

## Patches

**Patch manifest**:
`PATCHES.md`, the record of every deviation from upstream (file, patch summary, upstream counterpart, verification method). The sync script skips listed files and reports them as manual-merge required.
_Avoid_: patch list, changelog

**Snapshot import**:
The one-time act of importing the repo byte-identical from the canonical-store snapshot, which carried the four baseline patches into the repo as its baseline.
_Avoid_: seeding, seed source (the gardening metaphor; import is the operation)

**Baseline patch**:
A patch carried into the repo by the snapshot import (four: research/wayfinder push notes, quoted `@me`, kill-ai-slop `disable-model-invocation`).

**A-class patch**:
A must-fix platform patch applied to a consolidated copy (four: wizard, diagnosing-bugs, npm-release temp path, GitLab tracker quoting).

**B-class advisory note**:
A conditional environment issue recorded in the patch manifest, not patched into the skill body (four: jq, curl alias, rg, web-debug bash phrasing).
