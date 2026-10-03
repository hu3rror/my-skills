# Verify a frontend change end-to-end

This is the underused half of the kit. After making a code change that
affects behavior the user can see:

```
browser_goto      url=<changed page>            # fresh load
# drive the new behavior
browser_fill / browser_click as needed
browser_eval      expression=<assertion about resulting state>
browser_screenshot                              # if there's a visual claim
```

Don't say "done" if you haven't exercised the change. Reading source and
saying "this should work" is a strictly weaker claim than
"I drove it and observed the expected state."

