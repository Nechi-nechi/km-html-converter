// Contract assertions — robust checks on the CONTRACT, independent of exact
// serialization. Golden files (input/expected pairs) catch *any* drift; these
// catch the specific regressions the git history actually shipped, and won't
// flap on incidental whitespace/attribute-order changes.
//
// Each entry: { fixture, checks: [{ name, test(html, warnings) -> boolean }] }
// `fixture` names a *.input.html file (also runs as a golden test).

const has = (re) => (html) => re.test(html);
const not = (re) => (html) => !re.test(html);

export const assertions = [
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
      { name: 'cells have 0.5px borders', test: has(/border:\s*0\.5px solid/) },
      { name: 'header row uses <th>', test: has(/<th\b/) },
      { name: 'header has the navy fill (#0A0E33)', test: has(/<th[^>]*#0A0E33/i) },
      { name: 'header text is bold', test: has(/<th[^>]*font-weight:\s*bold/) },
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
      { name: 'bold "Note:" label', test: has(/<strong>Note:<\/strong>/) },
      // The bullets must be absorbed INSIDE the blockquote, not left as a sibling.
      { name: 'list lives inside the blockquote', test: has(/<blockquote>[\s\S]*<ul[\s\S]*<\/ul>[\s\S]*<\/blockquote>/) },
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
    fixture: 'callout-warning',
    checks: [
      { name: 'renders a blockquote', test: has(/<blockquote\b/) },
      { name: 'Warning label is red', test: has(/<strong style="color:#c00000;">Warning:<\/strong>/) },
    ],
  },
];
