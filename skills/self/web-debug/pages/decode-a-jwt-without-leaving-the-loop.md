# Decode a JWT without leaving the loop

```
browser_eval expression=`(() => {
  const raw = localStorage.getItem('sb-<projectref>-auth-token');
  if (!raw) return null;
  const tok = JSON.parse(raw).access_token;
  const [h, p] = tok.split('.').slice(0, 2).map(s => JSON.parse(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
  return { header: h, payload: p, expiresIn: p.exp - Math.floor(Date.now()/1000) };
})()`
```

Useful when the user reports "I'm logged in but the API thinks I'm anon" —
inspect `role`, `aud`, `exp` directly.

