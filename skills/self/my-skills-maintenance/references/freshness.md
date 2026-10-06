# Branch: freshness — check for and close pending updates

Answer "is anything pending?" on demand and keep the pending-update issue
truthful. Detection itself stays where map #25 put it — the daily CI Vendor
freshness check (unattended, read-only); this branch is the on-demand read plus
the stale-close case, and routes repair to `vendor-sync.md`. Coverage:
edge-case inventory C1–C8.

The open issue lists the pending classes (added / updated / removed kept-local /
patched-differs / patched-removed + a latest-release context line); this branch
**re-derives, never trusts the issue body as ground truth** (C7).

## Steps

1. **Find the pending-update issue** — `gh issue list --state open
   --label pending-update`; view its body if open.
2. **Re-derive from a fresh dry-run** — `node scripts/vendor-sync.mjs
   --dry-run`; classify every pending item exactly as `vendor-sync.md` step 1
   does. (The freshness check itself refuses a non-dry-run summary; so does
   this branch.)
3. **Close stale** — nothing pending + an open issue anyway → close it as
   stale/completed in **one write** per `docs/agents/issue-tracker.md` (the #16
   case; C4). The create-on-pending (C1) and auto-close-on-current (C3) cases
   are CI's job — this branch only closes what CI cannot see.
4. **Report** — what is pending and where each item gets repaired: route to the
   vendor-sync branch when the user wants to act.

**Done when**: the user has an accurate pending picture, or the stale close —
proposed and confirmed — landed.

## Boundaries

- The skill never *creates* the pending-update issue (C1 stays in CI; the
  create-vs-open race is CI's accepted minute-per-day window, C2).
- Sync errors leave issues untouched (C5) — a failed dry-run reports and stops.