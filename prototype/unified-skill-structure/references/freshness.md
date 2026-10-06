# Branch: freshness (detect)

**Skeleton — full prose lands with the follow-up ticket.** This is the
detection-facing branch: read the pending-update issue, re-derive from a fresh
dry-run, and close stale issues. Detection itself stays where map #25 put it —
the daily CI Vendor freshness check (unattended, read-only); the skill is the
only *repair* entry and adds the on-demand read + the stale-close case. Coverage:
edge-case inventory C1–C8.

## Purpose

Answer "is anything pending?" on demand and keep the pending-update issue
truthful: open issue lists the pending classes (added / updated / removed
kept-local / patched-differs / patched-removed + latest-release context line,
C6); the skill re-derives, never trusts the issue body as ground truth (C7).

## Steps (outline)

1. **Find the pending-update issue** (`gh issue list --state open
   --label pending-update`); view its body if open.
2. **Re-derive from a fresh dry-run** — `node scripts/vendor-sync.mjs --dry-run`;
   classify every pending item. (C7, C8 — the freshness check itself refuses a
   non-dry-run summary; so does this branch)
3. **Close stale**: nothing pending + an open issue anyway → close it as
   stale/completed in one write, per docs/agents/issue-tracker.md (the #16
   case; C4). The create-on-pending (C1) and auto-close-on-current (C3) cases
   are CI's job — this branch only closes what CI cannot see.
4. **Report** — what is pending and where each item gets repaired (route to the
   vendor-sync branch when the user wants to act).

## Boundaries

- The skill never *creates* the pending-update issue (C1 stays in CI; the
  create-vs-open race is CI's accepted minute-per-day window, C2).
- Sync errors leave issues untouched (C5) — a failed dry-run reports and stops.
