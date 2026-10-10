# Form not submitting

```
browser_goto      url=<page>
browser_eval      expression=`[...document.forms].map(f => ({ action: f.action, method: f.method, valid: f.checkValidity() }))`
browser_click     selector=text=Submit
browser_console                                  # validation error? handler threw?
browser_network                                  # did anything fire at all?
```

If `checkValidity()` is `false`, the form has an HTML validation constraint
blocking submit (often a hidden `required` field). If nothing fires on click,
there's no handler bound (hydration issue, or the button is outside the form).

