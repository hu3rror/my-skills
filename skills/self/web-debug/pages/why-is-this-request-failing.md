# Why is this request failing

```
browser_goto      url=<app url>
# reproduce the action that fires the failing request
browser_network   urlFilter=<route>   verbose=true
```

`verbose=true` shows the curated headers (`Authorization`, `apikey`,
`content-type`, etc.). For CORS, add `includeHeaders=["origin","access-control-request-method","access-control-request-headers"]`.

Common patterns the headers reveal:
- Missing or stale `Authorization` → check the auth flow above.
- `apikey` header missing on a Supabase call → the client wasn't constructed
  with the anon key.
- Wrong `content-type` → the client serialized the body unexpectedly.
- 403 with `prefer: return=representation` → RLS, not auth.

