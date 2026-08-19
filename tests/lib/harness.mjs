// Loads the real index.html into a jsdom window and hands back the page's own
// convertHTML(). We run the actual shipped code — not a copy — so fixtures test
// exactly what users get. The DOM-coupled init (event listeners on #expandPaste
// etc.) runs fine because those elements exist in the page; the APIs jsdom lacks
// (getSelection/execCommand/clipboard) are only touched inside event handlers,
// which never fire during a headless load.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = resolve(here, '../../index.html');

export async function loadConverter() {
  const html = readFileSync(INDEX, 'utf8');

  // Swallow the page's own console noise but surface real script errors.
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(e));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const { window } = dom;

  // Top-level `function convertHTML(){}` becomes a window global in a browser;
  // jsdom mirrors that. If init threw before the declaration, it'll be missing.
  const fn = window.convertHTML;
  if (typeof fn !== 'function') {
    const detail = errors.map((e) => e.detail || e.message || String(e)).join('\n');
    throw new Error(
      'window.convertHTML is not available after loading index.html.\n' +
      'Script init likely threw before the declaration:\n' + (detail || '(no jsdomError captured)')
    );
  }

  // convertHTML(source, useFallback, warnings) — pass a fresh warnings array and
  // return both the HTML and the collected warnings so assertions can inspect them.
  return {
    window,
    convert(source, { useFallback = false } = {}) {
      const warnings = [];
      const out = window.convertHTML(source, useFallback, warnings);
      return { html: out, warnings };
    },
    close() { window.close(); },
  };
}

// Whitespace-insensitive comparison. The converter's output has incidental
// newlines/indentation that shouldn't make a fixture flap; we compare the
// meaningful token stream, not byte-for-byte.
export function normalize(html) {
  return String(html)
    .replace(/\r\n/g, '\n')
    .replace(/>\s+</g, '><')   // collapse inter-tag whitespace
    .replace(/\s+/g, ' ')      // collapse runs of whitespace
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim();
}
