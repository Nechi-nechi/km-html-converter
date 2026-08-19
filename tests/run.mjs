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

c.close();

// ---- SUMMARY ----------------------------------------------------------------
console.log(`\n${fail === 0 ? '✓' : '✗'} ${pass} passed, ${fail} failed`);
if (fail) {
  console.log('\nFailures:');
  for (const [name, detail] of failures) console.log(`\n• ${name}\n    ${detail}`);
  process.exit(1);
}

function indent(s) { return s.split('\n').map((l) => '      ' + l).join('\n'); }
