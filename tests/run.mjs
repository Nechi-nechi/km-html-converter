#!/usr/bin/env node
// Conversion regression suite for index.html's convertHTML().
//
//   node run.mjs            run golden + contract checks, exit non-zero on any fail
//   node run.mjs --update   regenerate every *.expected.html from current output
//
// A fixture is a pair under fixtures/:  <name>.input.html  +  <name>.expected.html
// Golden test = normalized(convert(input)) must equal normalized(expected).
// Contract assertions (assertions.mjs) additionally pin the specific behaviours
// that regressed historically (H2 sizing, list-survives-reconvert, image
// placeholder, table styling, callout absorption, …).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { loadConverter, normalize } from './lib/harness.mjs';
import { assertions } from './assertions.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FIX = resolve(here, 'fixtures');
const UPDATE = process.argv.includes('--update');

const inputs = readdirSync(FIX).filter((f) => f.endsWith('.input.html')).sort();
const names = inputs.map((f) => f.replace(/\.input\.html$/, ''));
const read = (name, kind) => readFileSync(join(FIX, `${name}.${kind}.html`), 'utf8');

const c = await loadConverter();
let pass = 0, fail = 0;
const failures = [];

// ---- UPDATE MODE: (re)generate expected files, then stop --------------------
if (UPDATE) {
  for (const name of names) {
    const { html } = c.convert(read(name, 'input'));
    writeFileSync(join(FIX, `${name}.expected.html`), html.trim() + '\n');
    console.log(`  updated  ${name}.expected.html`);
  }
  c.close();
  console.log(`\nRegenerated ${names.length} expected file(s). Review the diff before committing.`);
  process.exit(0);
}

// ---- GOLDEN TESTS -----------------------------------------------------------
console.log('Golden fixtures');
for (const name of names) {
  let expected;
  try { expected = read(name, 'expected'); }
  catch { failures.push([name, 'no .expected.html — run: node run.mjs --update']); fail++; console.log(`  ✗ ${name}  (missing expected)`); continue; }

  const { html } = c.convert(read(name, 'input'));
  if (normalize(html) === normalize(expected)) { pass++; console.log(`  ✓ ${name}`); }
  else {
    fail++; console.log(`  ✗ ${name}`);
    failures.push([name, `output drifted from expected\n    --- expected\n${indent(expected.trim())}\n    --- actual\n${indent(html.trim())}`]);
  }
}

// ---- CONTRACT ASSERTIONS ----------------------------------------------------
console.log('\nContract assertions');
for (const spec of assertions) {
  const src = read(spec.fixture, 'input');
  const { html, warnings } = c.convert(src);
  for (const chk of spec.checks) {
    let ok = false, err = null;
    try { ok = !!chk.test(normalize(html), warnings); } catch (e) { err = e; }
    if (ok) { pass++; console.log(`  ✓ ${spec.fixture}: ${chk.name}`); }
    else {
      fail++; console.log(`  ✗ ${spec.fixture}: ${chk.name}`);
      failures.push([`${spec.fixture}: ${chk.name}`, err ? `threw: ${err.message}` : `assertion failed\n${indent(html.trim())}`]);
    }
  }
}

// Plain text uses buildNote(), while rich HTML uses buildNoteFromNode().
const plainCallouts = c.convert('Note: first\nImportant: second\nWarning: third', { useFallback: true }).html;
const plainBlocks = [...plainCallouts.matchAll(/<blockquote\b[^>]*>[\s\S]*?<\/blockquote>/g)].map((m) => m[0]);
const plainOk = plainBlocks.length === 3 && plainBlocks.every((block) =>
  /^<blockquote style="font-family: Arial, sans-serif; font-size: 12px;">/.test(block)
) && /<strong style="color:#c00000;">Warning:<\/strong>/.test(plainBlocks[2]);
if (plainOk) { pass++; console.log('  ✓ plain-text callouts: all three carry Arial 12px'); }
else { fail++; console.log('  ✗ plain-text callouts: Arial 12px'); failures.push(['plain-text callouts', plainCallouts]); }

const headingsOnce = c.convert('<h2>Overview</h2><h3>Details</h3><h4>Step</h4>').html;
const headingsTwice = c.convert(headingsOnce).html;
if (normalize(headingsOnce) === normalize(headingsTwice)) { pass++; console.log('  ✓ heading levels survive reconversion'); }
else { fail++; console.log('  ✗ heading levels survive reconversion'); failures.push(['heading reconversion', headingsTwice]); }

const unsafe = '<p onclick="alert(1)">Click <a href="java&#x73;cript:alert(2)">here</a></p><iframe srcdoc="x"></iframe><img src="x" onerror="alert(3)">';
const cleanedPaste = c.window.cleanPastedHtml(unsafe);
const pasteSafe = !/onclick|onerror|javascript:|iframe|srcdoc/i.test(cleanedPaste) && /Click <a>here<\/a>/.test(cleanedPaste);
if (pasteSafe) { pass++; console.log('  ✓ paste preview removes executable markup'); }
else { fail++; console.log('  ✗ paste preview removes executable markup'); failures.push(['unsafe paste preview', cleanedPaste]); }

const preview = c.window.document.getElementById('previewArea');
preview.innerHTML = '<p>Safe baseline</p>';
c.window.applyHtmlToPreview(unsafe);
const previewSafe = preview.textContent === 'Safe baseline' &&
  c.window.validateEditedHtml(unsafe).some((issue) => issue.level === 'error' && issue.title === 'Unsafe HTML');
if (previewSafe) { pass++; console.log('  ✓ edited unsafe HTML pauses live preview'); }
else { fail++; console.log('  ✗ edited unsafe HTML pauses live preview'); failures.push(['unsafe edited preview', preview.innerHTML]); }

const nestingIssues = c.window.validateEditedHtml('<p>First</p>\n<div><b>Second</div>');
const lineOk = nestingIssues.some((issue) => issue.title === 'Improper nesting' && /line 2/.test(issue.msg));
if (lineOk) { pass++; console.log('  ✓ HTML validation reports the correct source line'); }
else { fail++; console.log('  ✗ HTML validation reports the correct source line'); failures.push(['validation line number', JSON.stringify(nestingIssues)]); }

const doc = c.window.document;
const paste = doc.getElementById('pasteRender');
paste.innerHTML = '<p>Note: first</p><p>Important: second</p><p>Warning: third</p>';
paste.dispatchEvent(new c.window.Event('input', { bubbles: true }));
c.window.runConvert(false);
const generated = doc.getElementById('htmlOutput').value;
const previewCallouts = [...doc.querySelectorAll('#previewArea blockquote')];
const previewOk = previewCallouts.length === 3 && previewCallouts.every((quote) =>
  quote.style.fontFamily === 'Arial, sans-serif' && quote.style.fontSize === '12px'
);
let copied = null;
Object.defineProperty(c.window.navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { copied = text; } } });
doc.getElementById('btnCopy').click();
await Promise.resolve();
await Promise.resolve();
const copyOk = copied === generated && doc.getElementById('btnCopy').dataset.copied === 'true';
doc.getElementById('btnClearAll').click();
const resetOk = !paste.innerHTML && !doc.getElementById('htmlOutput').value && !preview.innerHTML;
if (previewOk && copyOk && resetOk) { pass++; console.log('  ✓ callout preview, clipboard copy, and reset stay in sync'); }
else { fail++; console.log('  ✗ callout preview, clipboard copy, and reset stay in sync'); failures.push(['preview/copy/reset', generated]); }

// Exercise the same clipboard event and Convert button used by writers, with
// previous output present so a silent failure cannot pass as fresh output.
for (const name of ['word-table-page-layout', 'word-table-section']) {
  for (const mode of ['fresh paste', 'edited paste', 'replace selection']) {
    doc.getElementById('btnClearAll').click();
    doc.getElementById('htmlOutput').value = '<p>Previous output</p>';
    c.window.onHtmlChanged('<p>Previous output</p>');
    if (mode === 'replace selection') {
      paste.innerHTML = '<p>Previous input</p>';
      const range = doc.createRange();
      range.selectNodeContents(paste);
      c.window.getSelection().removeAllRanges();
      c.window.getSelection().addRange(range);
    }
    const event = new c.window.Event('paste', { bubbles: true, cancelable: true });
    const source = read(name, 'input');
    Object.defineProperty(event, 'clipboardData', { value: {
      getData: type => type === 'text/html' ? source : 'Table text fallback',
    } });
    paste.dispatchEvent(event);
    if (mode === 'edited paste') {
      paste.querySelector('td').append(' revised');
      paste.dispatchEvent(new c.window.Event('input', { bubbles: true }));
    }
    doc.getElementById('btnConvert').click();
    const out = doc.getElementById('htmlOutput').value;
    copied = null;
    doc.getElementById('btnCopy').click();
    await Promise.resolve();
    await Promise.resolve();
    const tableOk = /<table\b/.test(out) && !out.includes('Previous output') &&
      doc.querySelectorAll('#previewArea tr').length === 3 &&
      doc.querySelectorAll('#previewArea th, #previewArea td').length === 6 &&
      preview.textContent.includes('ITEM_COUNT does not match.') && copied === out &&
      (mode !== 'edited paste' || preview.textContent.includes('revised'));
    if (tableOk) { pass++; console.log(`  ✓ ${name}: ${mode}, preview and copy`); }
    else { fail++; console.log(`  ✗ ${name}: ${mode}, preview and copy`); failures.push([`${name}: ${mode}`, out]); }
  }
}

const layoutHtml = c.convert(read('word-table-page-layout', 'input')).html;
const layoutOk = layoutHtml.includes('Next page content.') && !/<br\b|page-break|mso-/i.test(layoutHtml);
if (layoutOk) { pass++; console.log('  ✓ page layout removes break markers and retains paragraph content'); }
else { fail++; failures.push(['page layout content', layoutHtml]); }

// A heading beside a Word Online table must retain its accessibility heading
// level when table containers are unwrapped after outline promotion.
const onlineTable = '<div class="SCXW123"><div class="OutlineElement SCXW123"><p role="heading" aria-level="2">Overview</p></div><div class="OutlineElement SCXW123"><div class="TableContainer">' + read('table', 'input') + '</div></div></div>';
const onlineHtml = c.convert(onlineTable).html;
if (/<h2[^>]*font-size: 18px[^>]*>Overview<\/h2>[\s\S]*<table\b/.test(onlineHtml)) { pass++; console.log('  ✓ Word Online heading metadata survives beside a table'); }
else { fail++; failures.push(['Word Online heading beside table', onlineHtml]); }

const nestedHtml = c.convert('<div><table><tr><td colspan="2">Group</td></tr><tr><td rowspan="2"><div><table><tr><td>Nested</td></tr></table></div></td><td></td></tr><tr><td>Last</td></tr></table></div>').html;
if ((nestedHtml.match(/<table\b/g) || []).length === 2 && /colspan="2"/.test(nestedHtml) && /rowspan="2"/.test(nestedHtml) && /&nbsp;/.test(nestedHtml) && /Nested[\s\S]*Last/.test(nestedHtml)) { pass++; console.log('  ✓ wrapped nested tables, merged cells and empty cells survive'); }
else { fail++; failures.push(['wrapped nested table', nestedHtml]); }

c.close();

// ---- SUMMARY ----------------------------------------------------------------
console.log(`\n${fail === 0 ? '✓' : '✗'} ${pass} passed, ${fail} failed`);
if (fail) {
  console.log('\nFailures:');
  for (const [name, detail] of failures) console.log(`\n• ${name}\n    ${detail}`);
  process.exit(1);
}

function indent(s) { return s.split('\n').map((l) => '      ' + l).join('\n'); }
