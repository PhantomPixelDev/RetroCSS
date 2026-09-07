/**
 * A jsdom page with the built bundle loaded into it.
 *
 * These tests deliberately exercise `dist/retro.esm.js` rather than the files
 * under src/. That is the artifact consumers actually get, so a bundling
 * mistake -- the `--global-name` collision that once made every documented
 * `RetroCSS.*` call a TypeError, say -- shows up here rather than passing
 * against source and failing in the wild.
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const bundle = readFileSync(join(root, 'dist', 'retro.js'), 'utf8');

/**
 * @param {object}  [opts]
 * @param {string}  [opts.html]         body markup
 * @param {string}  [opts.storedTheme]  seeds localStorage before the bundle runs
 * @param {boolean} [opts.prefersDark]  what matchMedia reports
 * @param {boolean} [opts.breakStorage] make every localStorage access throw
 */
export function makePage({
  html = '',
  storedTheme = null,
  prefersDark = false,
  breakStorage = false,
} = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://example.test/',
  });
  const { window } = dom;

  if (breakStorage) {
    // A sandboxed iframe, or third-party storage blocked: touching localStorage
    // throws SecurityError. The bundle reads it during module evaluation, so an
    // unguarded access takes the whole framework down before init() ever runs.
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError: storage is not available');
      },
    });
  } else if (storedTheme) {
    window.localStorage.setItem('retro-theme', storedTheme);
  }

  // jsdom ships no matchMedia.
  window.matchMedia = (query) => ({
    matches: /prefers-color-scheme:\s*dark/.test(query) ? prefersDark : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });

  // The IIFE build assigns the globals itself; running it inside the jsdom
  // realm is what a <script> tag does.
  window.eval(bundle);

  // jsdom reports readyState 'loading' at this point, so the bundle registers
  // its auto-init on DOMContentLoaded rather than running it. Fire the event so
  // tests exercise the real auto-init path rather than calling init() directly.
  window.document.dispatchEvent(
    new window.Event('DOMContentLoaded', { bubbles: true, cancelable: false }),
  );

  return { dom, window, document: window.document };
}

/** Click through jsdom, which needs a real MouseEvent for delegated handlers. */
export function click(window, el) {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

/** Press a key on an element. */
export function press(window, el, key) {
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}
