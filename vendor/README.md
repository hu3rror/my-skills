# vendor/ — per-source meta (single home)

Machine-readable per-source data for the vendor sync machinery. Every vendored
(or manually forked) upstream source gets one file here; the sync script
(`scripts/vendor-sync.mjs`) and the migration read pins and exclusions from
these files instead of parsing `PATCHES.md` tables (map ticket #23).

This is **data, not code** — the same rule ADR-0006 already applied to the
exclusion list. Editing curation or pins is a change to a JSON file, never to
the script. The script refuses to run when a source's meta is missing or
invalid (a silently dropped pin or exclusion would unprotect a patch).

## Schema

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Source key; must match the file name (`<name>.json`) and the script's source name. |
| `repo` | yes | Upstream GitHub repo, `owner/repo`. Also the pins-map key the script uses. |
| `url` | yes | Clone URL (or repo URL for a manual fork). |
| `pin` | yes | Pinned upstream commit — the diff baseline the A-class patch rows verify against, and what lets the freshness check tell "upstream changed a patched file" (pending) from "our patch makes it differ" (current). |
| `exclusions` | no | Array of `{ path, reason }`: upstream-repo-relative paths the sync skips silently (curation, not drift — they never surface as pending updates). |
| `releaseRepo` | no | Repo whose latest release feeds the freshness check's per-source release line (release-tracked upstreams). |
| `kind` | no | `manual-fork` for a source the sync does not manage (`awesome-copilot`). Omit for synced sources. |
| `note` | no | Free-text provenance/rationale (why the pin exists, why a source is special). |

## Sources

| File | Source | Status |
|---|---|---|
| `mattpocock.json` | [mattpocock/skills](https://github.com/mattpocock/skills) | vendored; 5 excluded paths; release-tracked |
| `kill-ai-slop.json` | [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop) | vendored |
| `cloudflare.json` | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | vendored; ships unpatched (pin = provenance trace) |
| `awesome-copilot.json` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | manual fork, **not** in `vendor-sync.mjs` `SOURCES`; pin kept for provenance and the #10 diff baseline |

`skills/self/` has no meta file: self-authored skills have no upstream, and
their provenance travels in the per-patch records instead.

## Re-adding an excluded skill

To bring back a path listed under `exclusions`, install it directly from
upstream: `npx skills add mattpocock/skills --skill <name>` — space form only;
the equals form (`--skill=<name>`) is silently discarded by the CLI and falls
back to a full install (vercel-labs/skills#2039).
