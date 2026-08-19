# CLAUDE.md — km-html-converter

Project memory for Claude Code. Read before changing `index.html`.

## What this is

A single-file, **zero-dependency vanilla-JS** browser app that converts Microsoft
Word content (pasted from the clipboard) into **Salesforce Knowledge–ready HTML**
for KM writers. No framework, no build step, no backend, no package.json. The whole
app is `index.html` (~4,000 lines: inline `<style>`, HTML body, inline `<script>`).

Distributed as a plain file — users open it in a browser. The GitHub Pages copy is
at https://nechi-nechi.github.io/km-html-converter/.

## The one rule

**Everything ships in `index.html`.** Do not add dependencies, a bundler, a
`package.json`, or split into modules without an explicit ask. `node` is used only
for headless syntax-checking and jsdom-based conversion tests — never as a runtime.

## Architecture map

The `<script>` has ~196 functions. Major subsystems (line numbers drift — grep the
function name):

- **RTE toolbar** (`#rteToolbar`) — bold/italic/underline, heading levels, lists,
  font size, links, code marking, undo/redo, indent/outdent. Big IIFE around
  `updateState()`, `applyListStyle()`, `toggleListType()`, `doIndentOutdent()`.
- **Paste ingestion** — `handlePaste()` → `cleanPastedHtml()` → renders into the
  editable paste preview (`#pasteRender`).
- **Word list reconstruction — TWO paths, keep them distinct:**
  - `buildPreviewWordOnlineLists()` — Word *Online* (Office 365 web) markup
  - `buildPreviewLists()` + `classifyWordRun()` / `classifyWordMarker()` /
    `normalizeWordMarker()` — native desktop Word list markup
  Regressions here are the app's #1 historical bug source. Touch with tests.
- **Conversion pipeline** — `convertHTML(source, useFallback, warnings)` is the main
  entry; `serializeList()`, `convertPlainText()` for fallbacks. Emits the Salesforce
  style contract (see below) and pushes `warnings`.
- **HTML output + highlight mirror** — `#htmlOutput` (textarea) sits on top of
  `#htmlMirror` (tag-highlight overlay). **Invariant:** their box metrics
  (font, padding, line-height, wrap) MUST stay identical or highlights drift off the
  text. Comments in the CSS literally warn "PAIRED TEXT METRICS … MUST stay in sync."
- **Live preview** (`#previewArea`) — re-renders from the HTML output as you edit;
  `reconvertIfGenerated()` / `onHtmlChanged()` gate side effects.
- **Validation / warnings panel** (`#warningsPanel`) — `validateEditedHtml()` and the
  `warnings.push({ level, title, msg })` calls (levels: `info`, `warning`, `error`).
- **Expand modals** — each panel opens in `#fieldModal`; edits sync back live.
- **Undo** — custom stack via `createUndo(getState, setState, onChange)`.

## Salesforce HTML output contract (do not drift)

The generated HTML uses fixed inline styling so it pastes cleanly into the Salesforce
Knowledge source editor. Authoritative spec: `.claude/skills/salesforce-html/SKILL.md`.
Key values:

- Font: **Arial, sans-serif** throughout
- **H2 → 18px bold**, **H3 → 16px bold** (a past bug shipped H2 as h3/16px — regression-test this)
- Tables: `width:100%`, `1px solid` borders, header rows **bold, no background fill**
- Images: never converted — replaced with the literal placeholder `[Insert image here]`
- Callouts/notes → blockquote structure (bullet lists get absorbed into the blockquote)

## Dev loop

```bash
# regression suite: loads the real index.html in jsdom, runs convertHTML() on
# fixtures + contract assertions. DO THIS before every checkpoint.
cd tests && npm install   # first time only (jsdom is test-only; app stays zero-dep)
cd tests && npm test      # === node run.mjs ; exits non-zero on any failure
cd tests && node run.mjs --update   # regenerate golden expected files (review the diff!)

/verify-conversion   # same suite, via slash command (see .claude/commands)
/checkpoint          # commit in the "Phase N step X.Y" style (runs verify first)
/release             # syntax-check → copy to the distribution filename → optional commit+push
```

Add a fixture (`tests/fixtures/<name>.input.html` + `.expected.html`) whenever you fix a
conversion bug — your bug list is the test suite. Details: `tests/README.md`.

## Conventions

- Preserve the existing inline section comments (`/* OUTPUT GRID */` etc.) — they're the map.
- Commits follow `Phase N step X.Y: <what>` during refactors, or a plain imperative subject otherwise.
- **`.claude/settings.local.json` is local-machine state — it should be gitignored, not committed.**
  (Historically it was committed repeatedly; see `docs/claude-code-review/`.)
