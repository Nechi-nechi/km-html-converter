---
description: Run the Word→Salesforce conversion against checked-in fixtures headlessly (jsdom) and diff against expected output.
---

# /verify-conversion

Regression safety for the converter. The app's whole value is output fidelity, and the
git history shows recurring fidelity regressions (e.g. "H2 converting to h3/Arial 16",
"reconvert collapsing Word Online content to plain text"). This turns those into
one-line assertions instead of support tickets.

## If fixtures do not exist yet (bootstrap)

1. Create `tests/fixtures/`. Each fixture is a pair:
   - `<name>.input.html` — a real Word / Word-Online paste sample (raw clipboard HTML)
   - `<name>.expected.html` — the Salesforce HTML the converter should produce
2. Seed at least these cases from real bugs in the git log:
   - `heading-h2` — an H2 must emit **18px Arial bold**, not h3/16px
   - `word-online-list` — Word Online list must survive a reconvert (not collapse to text)
   - `native-word-list` — desktop Word nested list markers
   - `callout-with-bullets` — a note/callout that absorbs its bullet list into the blockquote
   - `table-basic` — 100% width, 1px borders, bold header row, no header fill
   - `image` — becomes the literal `[Insert image here]` placeholder
3. Write `tests/run.mjs`: load `index.html`'s inline script into a jsdom `window`, call
   `convertHTML(input, false, [])` for each fixture, normalize whitespace, and diff the
   result against `.expected.html`. Print PASS/FAIL per fixture and exit non-zero on any fail.
   Check whether `jsdom` is available first (`require.resolve('jsdom')`); if not, tell the
   user to `npm i -D jsdom` in a throwaway dir — do NOT add it to the repo (this stays
   dependency-free at runtime; jsdom is test-only).

## If fixtures exist

Run `node tests/run.mjs`, then report the PASS/FAIL table. On failure, show the diff
(expected vs. actual) for each failing fixture and propose the fix — but do not change
`index.html` unless asked.

Whenever a conversion bug is fixed, add a new fixture capturing it before closing out.
