# Auth flow not working

```
browser_goto      url=<login url>
browser_fill      selector=input[type=email]    value=<email>
browser_fill      selector=input[type=password] value=<password>
browser_click     selector=text=Sign in
browser_console                                          # any JS error?
browser_network   urlFilter=/auth     verbose=true       # what was POSTed, what came back?
browser_eval      expression=Object.keys(localStorage)   # did a session land?
```

If the network call to `/auth/v1/token` returns 200 but no session shows up in
localStorage, the bug is in the client SDK's storage adapter, not the server.
If the network call returns 400/401, the bug is upstream — read the response
status and the request body.

