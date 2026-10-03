# Blank screen

```
browser_goto      url=<page>
browser_console                                  # this is almost always the answer
browser_screenshot                               # confirm it's actually blank
browser_eval      expression=document.body.innerHTML.length
```

A blank screen with console errors is almost always a runtime JS error during
render (React/Vue/Svelte tear down the tree on uncaught errors). A blank
screen with *no* console errors and `innerHTML.length === 0` is a routing or
build issue — fetch the page with `web_fetch` and check the served HTML.

