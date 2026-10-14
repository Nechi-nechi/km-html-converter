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
| `table` | 100% width, shared Arial 12px, compact cell borders and padding, navy `#0A0E33` bold header, omitted vertical alignment |
| `word-table-page-layout` | Word page-layout styles on tables, rows, cells and paragraphs preserve content; explicit page-break markers are removed |
| `word-table-section` | Word section and formatting divs preserve tables containing monospace text and large header fonts |
| `code-block` | multi-line monospace paragraphs → one `<pre><code>` |
| `code-inline-word` | Mixed Word fonts, single identifiers, placeholders, formatting and font overrides stay inline |
| `code-structured` | Normal-font JSON/arrays, quoted braces, XML and HTML become standalone code blocks |
| `code-containers` | Inline and block code inside native/Word lists and tables |
| `code-preserve-spacing` | Code indentation, multiple blank lines, long values and explicit blocks |
| `callout-with-bullets` | `Note:` blockquote that **absorbs** its bullet list |
| `callout-warning` | `Warning:` blockquote with the red label |
| `callout-important` | `Important:` blockquote with Word font overrides and bold body text |
| `blockquote-ordinary` | Ordinary quotation blockquote remains separate from callout styling |
| `mixed-document` | Headings, inline text, nested and interrupted lists, merged and blank table cells, links, and content order |
| `special-characters` | Entity handling and Unicode preservation |
| `whitespace` | Empty paragraph cleanup without dropping surrounding text |
| `unsafe-output` | Unsafe attributes, links, and scripts stay out of Salesforce HTML |
| `image` | `<img>` → `[Insert image here]` placeholder + warning |
| `inline-formatting` | `<b>`/`<i>` → `<strong>`/`<em>`, safe `https` link preserved |

The runner also checks plain-text callouts, heading reconversion, unsafe preview
markup, clipboard copy, and workspace reset without adding fixtures for UI state.
It also checks table paste, edit and replacement through the Convert button,
preview and clipboard synchronization, Word Online headings beside tables,
and wrapped nested tables with merged and empty cells.
Code checks compare exact text and whitespace, reconversion, plain-text fallback,
wrapping styles and the edited paste/preview/clipboard flow.

## Adding / updating

```bash
node run.mjs --update    # regenerate every *.expected.html from current output
git diff fixtures        # ALWAYS review — never freeze an unintended change as "expected"
```

When you fix a conversion bug: add the offending paste as a new `*.input.html`, `--update`,
review, and (if it has a crisp invariant) add a check to `assertions.mjs`.
