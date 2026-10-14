// Contract assertions — robust checks on the CONTRACT, independent of exact
// serialization. Golden files (input/expected pairs) catch *any* drift; these
// catch the specific regressions the git history actually shipped, and won't
// flap on incidental whitespace/attribute-order changes.
//
// Each entry: { fixture, checks: [{ name, test(html, warnings) -> boolean }] }
// `fixture` names a *.input.html file (also runs as a golden test).

const has = (re) => (html) => re.test(html);
const not = (re) => (html) => !re.test(html);
const calloutFont = /<blockquote\b[^>]*style="font-family:\s*Arial, sans-serif;\s*font-size:\s*12px;"/;

export const assertions = [
  ...['word-table-page-layout', 'word-table-section'].map(fixture => ({
    fixture,
    checks: [
      { name: 'preserves the table and all three rows', test: h => (h.match(/<table\b/g) || []).length === 1 && (h.match(/<tr\b/g) || []).length === 3 },
      { name: 'preserves all six cells and the last cell text', test: h => (h.match(/<t[dh]\b/g) || []).length === 6 && /ITEM_COUNT does not match\./.test(h) },
      { name: 'preserves surrounding paragraph order', test: has(/Before the table\.[\s\S]*<table\b[\s\S]*<\/table>[\s\S]*After the table\./) },
      { name: 'keeps cell fonts from flattening the table to a heading or code block', test: not(/<h[1-6]\b|<pre\b/) },
      { name: 'keeps the table font and header colors', test: h => /<table[^>]*width:100%[^>]*font-family:Arial,sans-serif[^>]*font-size:12px/.test(h) && /<th[^>]*background:#0A0E33[^>]*color:#fff/.test(h) },
    ],
  })),
  {
    fixture: 'heading-h2',
    checks: [
      // The documented bug: "H2 converting to h3/Arial 16 instead of h2/Arial 18".
      { name: 'emits an <h2> (not <h3>)', test: has(/<h2\b/) },
      { name: 'h2 is 18px', test: has(/<h2[^>]*font-size:\s*18px/) },
      { name: 'h2 is NOT 16px', test: not(/<h2[^>]*font-size:\s*16px/) },
      { name: 'uses Arial', test: has(/font-family:\s*Arial/) },
    ],
  },
  {
    fixture: 'heading-mso',
    checks: [
      { name: 'promotes styled Word paragraph to <h2>', test: has(/<h2\b/) },
      { name: 'h2 is 18px', test: has(/font-size:\s*18px/) },
      { name: 'no MSO remnants', test: not(/mso-|MsoNormal/i) },
    ],
  },
  {
    fixture: 'native-word-list',
    checks: [
      { name: 'rebuilds an ordered list', test: has(/<ol\b/) },
      { name: 'has three list items', test: (h) => (h.match(/<li\b/g) || []).length === 3 },
      { name: 'no literal "1." marker leaked into text', test: not(/<li[^>]*>\s*1\./) },
      { name: 'no mso-list remnants', test: not(/mso-list/i) },
      { name: 'flagged as Word list rebuilt', test: (_h, w) => w.some((x) => /list rebuilt/i.test(x.title)) },
    ],
  },
  {
    fixture: 'word-online-list',
    checks: [
      // The documented bug: Word Online content collapsing to plain text on reconvert.
      { name: 'produces a real list, not a paragraph', test: has(/<ol\b/) },
      { name: 'nests the level-2 item as a <ul> sublist', test: has(/<ul\b/) },
      { name: 'top-level items survive (>= 3)', test: (h) => (h.match(/<li\b/g) || []).length >= 4 },
      { name: 'did not flatten to plain <p> text', test: not(/First step<\/p>/) },
    ],
  },
  {
    fixture: 'table',
    checks: [
      { name: 'table is 100% width', test: has(/<table[^>]*width:\s*100%/) },
      { name: 'cells have 0.5px borders', test: has(/border:\s*(?:0)?\.5px solid/) },
      { name: 'header row uses <th>', test: has(/<th\b/) },
      { name: 'header has the navy fill (#0A0E33)', test: has(/<th[^>]*#0A0E33/i) },
      { name: 'header text is bold', test: has(/<th[^>]*font-weight:\s*(?:bold|700)/) },
      { name: 'Arial 12px is defined once on the table', test: h => /<table[^>]*font-family:Arial,sans-serif;font-size:12px/.test(h) && (h.match(/font-family:/g) || []).length === 1 && (h.match(/font-size:/g) || []).length === 1 },
      { name: 'cell borders and padding are preserved', test: h => (h.match(/<t[dh] style="border:\.5px solid gray;padding:4px/g) || []).length === 6 },
      { name: 'omits cell font duplication and vertical alignment', test: not(/<t[dh][^>]*font-(?:family|size)|vertical-align/) },
    ],
  },
  {
    fixture: 'code-block',
    checks: [
      { name: 'wraps in a <pre>', test: has(/<pre\b/) },
      { name: 'uses a monospace font', test: has(/Courier New|Consolas|monospace/) },
      { name: 'preserves all three lines in one block', test: has(/function greet[\s\S]*Hello[\s\S]*\}/) },
    ],
  },
  {
    fixture: 'callout-with-bullets',
    checks: [
      { name: 'renders a blockquote', test: has(/<blockquote\b/) },
      { name: 'Note blockquote carries Arial 12px', test: has(calloutFont) },
      { name: 'bold "Note:" label', test: has(/<strong>Note:<\/strong>/) },
      // The bullets must be absorbed INSIDE the blockquote, not left as a sibling.
      { name: 'list lives inside the blockquote', test: has(/<blockquote\b[^>]*>[\s\S]*<ul[\s\S]*<\/ul>[\s\S]*<\/blockquote>/) },
    ],
  },
  {
    fixture: 'image',
    checks: [
      { name: 'image replaced with placeholder', test: has(/\[Insert image here\]/) },
      { name: 'no <img> tag survives', test: not(/<img\b/) },
      { name: 'raises an Image warning', test: (_h, w) => w.some((x) => /image/i.test(x.title)) },
    ],
  },
  {
    fixture: 'inline-formatting',
    checks: [
      { name: 'bold normalized to <strong>', test: has(/<strong>Convert<\/strong>/) },
      { name: 'italic normalized to <em>', test: has(/<em>review<\/em>/) },
      { name: 'safe https link preserved', test: has(/<a href="https:\/\/help\.example\.com">help guide<\/a>/) },
    ],
  },
  {
    // Regression: a Word Online full-document paste wraps its OutlineElements in
    // an outer SCXW div. The flatten step used to promote the table's
    // OutlineElement as a plain paragraph outline, keeping only the first <p> and
    // collapsing the whole table to its first cell's text ("Field").
    fixture: 'word-online-table',
    checks: [
      { name: 'table survives the SCXW flatten step', test: has(/<table\b/) },
      { name: 'did not collapse to the first cell', test: not(/<p[^>]*><strong>Field<\/strong><\/p>/) },
      { name: 'all three rows survive', test: (h) => (h.match(/<tr\b/g) || []).length === 3 },
      { name: 'all six cells survive', test: (h) => (h.match(/<t[dh]\b/g) || []).length === 6 },
      { name: 'last cell content survives', test: has(/Active or Inactive/) },
      { name: 'header row uses <th>', test: has(/<th\b/) },
      { name: 'surrounding paragraphs preserved', test: (h) => /The record exposes/.test(h) && /Contact your administrator/.test(h) },
    ],
  },
  {
    fixture: 'callout-warning',
    checks: [
      { name: 'renders a blockquote', test: has(/<blockquote\b/) },
      { name: 'Warning blockquote carries Arial 12px', test: has(calloutFont) },
      { name: 'Warning label is red', test: has(/<strong style="color:#c00000;">Warning:<\/strong>/) },
    ],
  },
  {
    fixture: 'callout-important',
    checks: [
      { name: 'Important blockquote carries Arial 12px', test: has(calloutFont) },
      { name: 'label and body retain bold markup', test: has(/<strong>Important:<\/strong>\s*<strong>Keep a copy<\/strong>/) },
      { name: 'Word font overrides are removed', test: not(/Times New Roman|Calibri|20px|16pt|MsoNormal/) },
    ],
  },
  {
    fixture: 'blockquote-ordinary',
    checks: [
      { name: 'ordinary blockquote wrapper remains unstyled', test: has(/^<blockquote><p/) },
    ],
  },
  {
    fixture: 'mixed-document',
    checks: [
      { name: 'paragraphs and sections stay in order', test: has(/Overview[\s\S]*Alpha[\s\S]*First[\s\S]*Between lists[\s\S]*Third[\s\S]*Field[\s\S]*Last paragraph/) },
      { name: 'nested and interrupted lists remain real lists', test: has(/<ol\b[\s\S]*<ul\b[\s\S]*<\/ul>[\s\S]*<\/ol>[\s\S]*Between lists[\s\S]*<ul\b/) },
      { name: 'merged and blank cells survive', test: has(/colspan="2"[\s\S]*<td[^>]*>&nbsp;<\/td>/) },
      { name: 'safe link survives inside a cell', test: has(/<a href="https:\/\/example\.com\/help">Guide<\/a>/) },
      { name: 'merged cell warning is shown', test: (_h, w) => w.some((x) => /Merged cells/.test(x.title)) },
    ],
  },
  {
    fixture: 'special-characters',
    checks: [
      { name: 'special characters are preserved without double escaping', test: (h) => /A &amp; B &lt; C &gt; D/.test(h) && /café, ©, ™, 한국어/.test(h) && !/&amp;amp;/.test(h) },
    ],
  },
  {
    fixture: 'whitespace',
    checks: [
      { name: 'empty paragraphs collapse without losing neighbors', test: (h, w) => (h.match(/<p\b/g) || []).length === 2 && /First[\s\S]*Second/.test(h) && w.some((x) => /Empty paragraphs collapsed/.test(x.title)) },
    ],
  },
  {
    fixture: 'unsafe-output',
    checks: [
      { name: 'unsafe tags, handlers, and links stay out of Salesforce HTML', test: (h, w) => !/<script|onclick|javascript:/i.test(h) && /Safe text link/.test(h) && w.some((x) => /Link protocol stripped/.test(x.title)) },
    ],
  },
];
