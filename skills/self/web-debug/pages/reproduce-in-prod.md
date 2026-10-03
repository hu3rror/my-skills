# Reproduce in prod

The persistent profile means a session you've already authenticated stays
authenticated. So:

```
browser_goto      url=<prod url>
# you may already be logged in from a previous turn — check first
browser_eval      expression=Object.keys(localStorage)
# if not, run the auth playbook against prod
```

Then reproduce the failing action and compare its `browser_network` output
against the same action in dev.

