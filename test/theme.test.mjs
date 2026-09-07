import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePage } from './helpers/dom.mjs';

test('an explicit stored choice outranks the OS setting', () => {
  const { window } = makePage({ storedTheme: 'light', prefersDark: true });
  assert.equal(window.RetroCSS.theme, 'light');
  assert.equal(window.document.documentElement.getAttribute('data-theme'), 'light');
});

test('with nothing stored, a dark OS gives the dark theme', () => {
  const { window } = makePage({ prefersDark: true });
  assert.equal(window.RetroCSS.theme, 'dark');
  assert.equal(window.document.documentElement.getAttribute('data-theme'), 'dark');
});

test('with nothing stored, a light OS gives the light theme', () => {
  const { window } = makePage({ prefersDark: false });
  assert.equal(window.RetroCSS.theme, 'light');
});

test('applyTheme writes data-theme="light" rather than removing the attribute', () => {
  // Removing it would hand a dark-OS visitor straight back to the system
  // preference, undoing a deliberate choice: the prefers-color-scheme rule is
  // scoped to :root:not([data-theme="light"]).
  const { window, document } = makePage({ prefersDark: true });
  window.RetroCSS.applyTheme('light');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
});

test('blocked localStorage does not take the bundle down', () => {
  // The theme is read during module evaluation. An unguarded access here threw
  // SecurityError before any component had been wired up.
  const { window } = makePage({ breakStorage: true });
  assert.equal(typeof window.RetroCSS, 'object');
  assert.equal(typeof window.RetroCSS.init, 'function');
  assert.equal(window.RetroCSS.theme, 'light');
});

test('the documented API surface is on the global, not an ESM namespace', () => {
  // Regression: building with esbuild's --global-name emitted an outer
  // `var RetroCSS = <namespace>`, so window.RetroCSS was { default: ... } and
  // every documented RetroCSS.* call in the docs was a TypeError.
  const { window } = makePage();
  for (const key of ['modal', 'toast', 'form', 'table', 'dropdown', 'events']) {
    assert.equal(typeof window.RetroCSS[key], 'object', `RetroCSS.${key} missing`);
  }
  assert.equal(typeof window.RetroCSS.toast.show, 'function');
  assert.equal(typeof window.RetroCSS.modal.show, 'function');
});
