---
description: Run the Word→Salesforce conversion regression suite (golden fixtures + contract assertions) headlessly via jsdom.
---

# /verify-conversion

Regression safety for the converter. The app's whole value is output fidelity, and the
git history shows recurring fidelity regressions (e.g. "H2 converting to h3/Arial 16",
"reconvert collapsing Word Online content to plain text"). The suite turns those into
assertions that fail loudly instead of shipping.

## Run it

```bash
cd tests
npm install    # first time only — installs jsdom (test-only; the app stays zero-dependency)
node run.mjs   # or: npm test
```

The runner loads the **real** `index.html` into a jsdom window and calls the page's own
`window.convertHTML()` — it exercises shipped code, not a copy. It reports two groups and
exits non-zero if anything fails:

- **Golden fixtures** — `tests/fixtures/<name>.input.html` (a real Word / Word-Online paste)
  vs. `<name>.expected.html` (the Salesforce HTML it must produce), compared whitespace-insensitively.
- **Contract assertions** (`tests/assertions.mjs`) — property checks that pin the specific
  behaviours that regressed historically: H2 = 18px (never 16px/h3), Word/Word-Online lists
  stay real lists, image → `[Insert image here]`, tables at 100% width with `0.5px` borders and
  a navy `#0A0E33` header fill, `Note:`/`Warning:` callouts absorb their bullet lists, etc.

## When output legitimately changes

If a fixture fails because you *intended* to change the output, regenerate the golden files:

```bash
node run.mjs --update   # rewrites every *.expected.html from current output
git diff tests/fixtures  # REVIEW the diff — confirm each change is intended before committing
```

Never `--update` to make a red suite green without reading the diff — that's how a regression
gets frozen in as "expected."

## Whenever you fix a conversion bug

Add a fixture that captures it **before** closing the fix:

1. Save the offending Word paste as `tests/fixtures/<name>.input.html`.
2. Run `node run.mjs --update` and review the generated `<name>.expected.html`.
3. If the bug has a crisp invariant (a size, a tag, "no X in output"), add a check to
   `tests/assertions.mjs` too — assertions are whitespace/attribute-order proof and read as docs.

Your bug list becomes your test suite. Run `/verify-conversion` before every `/checkpoint`.
