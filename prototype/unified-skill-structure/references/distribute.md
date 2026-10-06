# Branch: distribute (distribution chain)

**Skeleton — full prose lands with the follow-up ticket.** The distribution
chain is the pipeline `npx skills add <aggregation repo> -a universal -s '*' -g`
→ canonical skills store (`~/.agents/skills`), which every harness reads
directly. The chain owns the lock file (`~/.agents/.skill-lock.json`);
consolidation and this branch never edit it by hand.

## Steps (outline)

1. **Gate: zero strays.** The mandatory stray check (router step 1) must read
   zero new/modified strays — a distribution with a stray present clobbers it.
   Any stray → settle via `stray-recovery.md` first.
2. **Distribute** with the CLI **pinned** (decision, ticket #26 — accept-drift
   rejected):

   ```
   npx skills@1.7.0 add hu3rror/my-skills -a universal -s '*' -g -y
   ```

   The pin is deliberate — see the decision & rationale in the prototype
   README (decision 5; accept-drift rejected). Bump the version here
   deliberately when a needed behavior or fix lands; verify with `skills
   --version` first.
3. **Verify** — the canonical store and lock now match the repo (`npx skills ls`
   / spot-check `~/.agents/skills`); content change → lock's `skillFolderHash`
   entries reflect the new copies.
4. **Retiring a skill from the store** — deleting it from the repo is not
   enough: `npx skills add` does **not** prune the canonical store (the install
   loop iterates the selected skills only; the deleted-skill cleanup lives in
   `update` — see the full evidence in prototype README decision 4 / R1). Retire
   = `git rm` the repo copy **and** `npx skills remove <name>` on the store side
   (exact `remove` invocation re-verified at migration, CLI churn).

## Cross-branch touches

- Content change (new/modified skill in the repo) is what triggers a
  distribution — any branch that edits `skills/` ends by proposing one.
- The mandatory stray dry-run (router step 1) is what gates a distribution here;
  its rationale is map #25 (see the prototype README design notes).
