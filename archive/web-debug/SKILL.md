---
name: web-debug
description: "Debug or verify frontend behavior by driving the live page with browser_* tools. Use when the user reports: broken login or auth, JWT/session issues, failed/401/403/CORS requests, form or button not working, blank screen, hydration mismatch, stale data, 'works locally / fails in prod', or asks to verify a frontend change end-to-end."
---

# Web debugging via the live page

You have a real headless browser. Use it. The default failure mode is reading
source, forming a hypothesis, and asking the user to verify in their devtools.
That's slow and wrong: the answer usually lives in runtime state (localStorage,
the actual `Authorization` header the SPA sent, a console error), not in source.

## When to reach for the kit

Pattern-match the user's wording to a playbook below. If their description
sounds like *anything* in this list, open the browser first, theorize second.

| User says something like… | First move |
|---|---|
| "I can't log in" / "login is broken" / "auth doesn't work" | [Auth flow](pages/auth-flow-not-working.md) |
| "I'm getting a 401 / 403 / CORS error from `/api/foo`" | [Bad request](pages/why-is-this-request-failing.md) |
| "The session isn't persisting" / "logged out on refresh" | [Storage inspection](pages/whats-actually-in-storage.md) |
| "This JWT looks weird" / "wrong claims" | [JWT decode](pages/decode-a-jwt-without-leaving-the-loop.md) |
| "The form does nothing" / "submit button doesn't work" | [Form not submitting](pages/form-not-submitting.md) |
| "Blank screen" / "page won't load" / "stuck loading" | [Blank screen](pages/blank-screen.md) |
| "Works on my machine" / "fails in prod" | [Reproduce in prod](pages/reproduce-in-prod.md) |
| "Can you verify this fix?" / "does my change work?" | [Verify a change](pages/verify-a-frontend-change-end-to-end.md) |

If none of those match but the bug is *behavioral* (something the user sees in
the browser), still open `browser_goto` first. You will learn more in three
tool calls than three rounds of source-reading.

## Core loop

Every playbook below is a variation on this:

1. `browser_goto` to the relevant URL.
2. Drive whatever action reproduces the bug (`browser_fill`, `browser_click`).
3. Drain observations: `browser_console`, `browser_network` (often with
   `verbose: true` and a `urlFilter`).
4. `browser_eval` to read runtime state that isn't visible from console/network.
5. Form a hypothesis. Make a code change. Re-run the loop to verify.

State (cookies, localStorage, IndexedDB) is persistent across `browser_*`
calls, across turns, and across pi restarts — a session you opened earlier
is still open now. That's a feature: don't `browser_close` between steps.

## Playbooks

Each playbook lives in its own file under `pages/`. Read *only* the one
the table above points to; the core loop above is shared by all of them.

## Pitfalls

These are the ones that have already bitten — internalize them.

- **`fetch()` without consuming the body** shows up as `ERR net::ERR_ABORTED`
  in `browser_network`, even when the JS side saw a 200. If you do quick
  checks, do `const r = await fetch(url); await r.text(); return r.status`.
- **DOM nodes don't JSON-serialize.** Return primitive properties:
  `.outerHTML`, `.textContent`, `.value`, `.checked`. Never return the node
  itself or `document.body`.
- **`button[type=submit]` is an HTML attribute selector**, not a DOM property
  selector. A `<button>Submit</button>` has DOM `.type === "submit"` by
  default, but no `type` attribute — the selector won't match. Use
  `text=Submit` or `role=button[name=Submit]`.
- **`browser_console` / `browser_network` drain the entire buffer by default.**
  If you want to read one thing without losing the rest, pass `clear: false`.
- **Top-level `return` and multi-statement bodies aren't expressions.** Wrap
  them in `(() => { ... })()` when passing to `browser_eval`.

## When *not* to reach for these tools

- If you only need to read static content from a public URL, `web_fetch` is
  faster (no browser launch, no profile state).
- If the question is purely about source code, read the source. The browser
  doesn't tell you why a function was written, only what it does at runtime.
- If you need to verify behavior across many URLs at scale, write a script
  and run it with `bash` — the browser kit is for interactive debugging, not
  batch crawling.
