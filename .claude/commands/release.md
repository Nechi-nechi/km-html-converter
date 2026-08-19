---
description: Syntax-check index.html, copy it to the distribution filename, then optionally commit and push.
---

# /release

Ship the current `index.html`. Replaces the manual `cp index.html …/Downloads/km-paste-to-html-converter.html`
ritual that was previously approved as a raw Bash command every time.

Do this in order and stop on the first failure:

1. **Syntax gate.** Extract the inline script and run `node --check` on it. If it fails,
   report the error and STOP — do not copy a broken file.
2. **Copy to the distribution name.** Copy `index.html` to the user-facing filename
   `km-paste-to-html-converter.html`. On the user's local machine that lives in
   `Downloads/`; in any other environment, write it next to `index.html` and tell the
   user the path. Confirm the copy with a line count so it's obviously the full file.
3. **Offer to publish.** Ask whether to also commit and push (GitHub Pages serves the
   live copy). If yes: `git add index.html`, commit with a concise imperative subject
   describing the change, and `git push -u origin <current-branch>`.

If `$ARGUMENTS` contains a message, use it as the commit subject. If it contains
`--no-push`, do step 3 as a commit only.

Report: syntax OK/FAIL, the copy path + line count, and the commit/push result.
