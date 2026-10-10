# What's actually in storage

```
browser_goto      url=<app url>
browser_eval      expression=Object.keys(localStorage)
browser_eval      expression=Object.fromEntries(Object.entries(localStorage))
browser_eval      expression=document.cookie
```

For Supabase specifically the session key is
`sb-<projectref>-auth-token`. If it's missing after login, the SDK never wrote
it (suspect storage adapter or a race). If it's present but stale, the SDK
isn't reading it on init.

