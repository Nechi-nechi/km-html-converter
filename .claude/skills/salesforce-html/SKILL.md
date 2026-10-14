---
name: salesforce-html
description: The output contract for Salesforce Knowledge–ready HTML. Use whenever producing, editing, or reviewing HTML that will be pasted into the Salesforce Knowledge source editor — headings, tables, lists, callouts, links, images, or code. Emits fixed inline Arial styling so content survives the Salesforce paste unchanged. Trigger on "Salesforce Knowledge", "KM article", "source editor HTML", or edits to this converter's output.
---

# Salesforce Knowledge HTML contract

Salesforce Knowledge's source editor keeps *inline* styles and strips most everything
else. So the output must carry its formatting inline, using a small fixed vocabulary.
This is the authoritative spec the converter targets — keep `index.html`'s `convertHTML()`
output and any hand-edits on-contract.

## Global

- **Font: `Arial, sans-serif`** everywhere. Body text is **12px** (`SF_FONT =
  font-family: Arial, sans-serif; font-size: 12px;`). Code is `'Courier New',
  Consolas, monospace; font-size: 12px`. No other font families.
- Styles are **inline** on the element (`style="…"`). Do not rely on `<style>` blocks or
  classes — Salesforce discards them.
- No `<script>`, no `data-*`, no MSO/Word attributes, no `class` on output elements.

## Headings

| Element | Size | Weight |
|---|---|---|
| H2 | **18px** | bold |
| H3 | **16px** | bold |

> Known regression: an H2 once shipped as `<h3>`/16px. If H2 ≠ 18px bold, it's wrong.
Preserve the heading *hierarchy* from the source — do not flatten H2/H3 into paragraphs.

## Paragraphs & inline

- Body text: Arial, readable line spacing. Preserve bold/italic/underline as inline tags.
- Links: keep `href`; flag `javascript:`/unsafe schemes as a warning rather than emitting them.

## Code

- Monospace words within prose become inline `<code>`; keep surrounding prose in its paragraph.
- Standalone JSON objects/arrays and XML/HTML examples become `<pre><code>`, including
  normal-font input. Full monospace snippets also become blocks; single identifiers stay inline.
- Preserve code text, indentation and line breaks. Blocks carry
  `white-space:pre-wrap;overflow-wrap:anywhere`; inline code carries `overflow-wrap:anywhere`.
- Apply the same rules inside lists and table cells. Keep markup examples escaped as text.

## Lists

- Emit clean `<ul>`/`<ol>` with correct nesting and marker types.
- Reconstruct lists from *both* native Word and Word Online paste markup — never leave raw
  typed markers (`1.`, `a)`, `•`) as literal text.
- A list must survive a reconvert without collapsing to a plain paragraph.

## Tables

Verified against `processTable()` in `index.html`. Keep table output compact:

- Table: `border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px`
  (width adjustable by hand before copying). Font properties inherit into cells.
- All cells: `border:.5px solid gray;padding:4px`. Borders and padding stay on cells
  because those properties do not inherit. `gray` equals `#808080`.
- Omit redundant cell font declarations and vertical alignment. Omit the final
  semicolon in each style attribute.
- **Header cells** (`<th>` — first row, or any `<th>`, or a bold cell): add
  `background:#0A0E33;color:#fff;font-weight:700;text-align:center` (navy fill, white bold text).
- Preserve header rows, empty cells, uneven rows, nested and merged cells where possible.
  Merged cells, uneven rows, and nested tables each raise a warning.

## Callouts / notes / warnings

- Render as a **blockquote** structure. If a callout contains a bullet list, absorb the
  list *into* the blockquote rather than emitting it as a sibling.

## Images

- **Never converted.** Replace each image with the literal placeholder text
  `[Insert image here]` and push an `image` warning so the writer inserts the real image
  in Salesforce after pasting.

## Things that must produce a warning (not silent output)

`{ level: 'info' | 'warning' | 'error', title, msg }` — surface, don't hide:
images, nested tables, uneven tables, unsafe links, possible code blocks, plain-text
fallback, and any Word styling that was stripped.
