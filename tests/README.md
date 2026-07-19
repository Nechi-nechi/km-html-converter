# tests — conversion regression suite

Headless regression tests for `index.html`'s `convertHTML()`. The app itself stays
**zero-dependency**; `jsdom` lives here as a *test-only* devDependency.

## Run

```bash
cd tests
npm install     # first time only (installs jsdom)
npm test        # === node run.mjs
```

Exits non-zero on any failure. The runner loads the real `../index.html` into a jsdom
window and calls the page's own `window.convertHTML()` — it tests shipped code, not a copy.

## Layout

```
tests/
  run.mjs             the runner (golden fixtures + contract assertions)
  assertions.mjs      property checks pinning historically-regressed behaviour
  lib/harness.mjs     loads index.html in jsdom, exposes convert(), normalize()
  fixtures/
    <name>.input.html      a real Word / Word-Online clipboard paste
    <name>.expected.html   the Salesforce HTML it must produce (golden)
```

## Two kinds of check

- **Golden** — `normalize(convert(input)) === normalize(expected)`. Catches *any* drift.
  Whitespace/inter-tag-insensitive so it doesn't flap on formatting-only changes.
- **Contract assertions** — robust property checks (a size, a tag, "no `<img>` survives").
  These encode the actual historical bugs and won't break on attribute-order changes.

## Current fixtures

| Fixture | Exercises |
|---|---|
| `heading-h2` | native `<h2>` → h2 / **18px** Arial bold (the H2-vs-h3/16px regression) |
| `heading-mso` | a styled Word desktop paragraph promoted to `<h2>` |
| `native-word-list` | desktop Word `mso-list` numbered list → clean `<ol>` |
| `word-online-list` | Word Online `data-aria-level` list w/ interleaved-listid nested sublist |
| `table` | 100% width, `0.5px` borders, navy `#0A0E33` bold header |
| `code-block` | multi-line monospace paragraphs → one `<pre><code>` |
| `callout-with-bullets` | `Note:` blockquote that **absorbs** its bullet list |
| `callout-warning` | `Warning:` blockquote with the red label |
| `image` | `<img>` → `[Insert image here]` placeholder + warning |
| `inline-formatting` | `<b>`/`<i>` → `<strong>`/`<em>`, safe `https` link preserved |

## Adding / updating

```bash
node run.mjs --update    # regenerate every *.expected.html from current output
git diff fixtures        # ALWAYS review — never freeze an unintended change as "expected"
```

When you fix a conversion bug: add the offending paste as a new `*.input.html`, `--update`,
review, and (if it has a crisp invariant) add a check to `assertions.mjs`.
