/**
 * Modal focus management.
 *
 * This is the largest piece of untested behaviour in the package and the least
 * forgiving: a focus trap that leaks, or a restore that returns focus to the
 * wrong element, strands a keyboard user with no way back. None of it is
 * visible in a screenshot, and the browser gates only assert that controls are
 * reachable -- not that focus goes where it should once a dialog opens.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePage, click, press } from './helpers/dom.mjs';

const PAGE = `
  <button id="opener" data-retro-modal="dlg">Open</button>
  <a href="#outside" id="outside">outside the dialog</a>

  <div class="retro-modal" id="dlg">
    <div class="retro-modal-content">
      <div class="retro-modal-header">Dialog</div>
      <div class="retro-modal-body">
        <input id="first" class="retro-input">
        <button id="middle">Middle</button>
        <button id="last" data-close="modal">Close</button>
      </div>
    </div>
  </div>
`;

const NESTED = `
  <button id="opener" data-retro-modal="outer">Open outer</button>

  <div class="retro-modal" id="outer">
    <div class="retro-modal-content">
      <div class="retro-modal-header">Outer</div>
      <button id="open-inner" data-retro-modal="inner">Open inner</button>
    </div>
  </div>

  <div class="retro-modal" id="inner">
    <div class="retro-modal-content">
      <div class="retro-modal-header">Inner</div>
      <button id="inner-close" data-close="modal">Close</button>
    </div>
  </div>
`;

test('opening a modal moves focus inside it', () => {
  const { window, document } = makePage({ html: PAGE });
  document.getElementById('opener').focus();

  click(window, document.getElementById('opener'));

  const dialog = document.getElementById('dlg');
  assert.ok(dialog.classList.contains('show'));
  assert.ok(
    dialog.contains(document.activeElement),
    `focus stayed outside the dialog, on ${document.activeElement.id || 'body'}`,
  );
});

test('an open modal names itself and takes the rest of the page out of the tree', () => {
  const { window, document } = makePage({ html: PAGE });
  click(window, document.getElementById('opener'));

  const dialog = document.getElementById('dlg');
  assert.equal(dialog.getAttribute('role'), 'dialog');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.ok(dialog.getAttribute('aria-labelledby'), 'dialog has no accessible name');

  // Everything alongside the dialog is inert while it is open, so Tab cannot
  // walk out of the dialog and into the page behind it.
  const outside = document.getElementById('outside');
  assert.ok(
    outside.hasAttribute('inert') || outside.getAttribute('aria-hidden') === 'true',
    'the page behind the dialog is still reachable',
  );
});

test('closing returns focus to whatever opened it', () => {
  const { window, document } = makePage({ html: PAGE });
  const opener = document.getElementById('opener');
  opener.focus();

  click(window, document.getElementById('opener'));
  click(window, document.getElementById('last'));

  assert.equal(document.activeElement, opener, 'focus was not restored to the opener');
  assert.ok(!document.getElementById('dlg').classList.contains('show'));
});

test('Escape closes the dialog and restores the page', () => {
  const { window, document } = makePage({ html: PAGE });
  const opener = document.getElementById('opener');
  opener.focus();
  click(window, opener);

  press(window, document.getElementById('dlg'), 'Escape');

  assert.ok(!document.getElementById('dlg').classList.contains('show'));
  assert.equal(document.activeElement, opener);
  assert.ok(
    !document.getElementById('outside').hasAttribute('inert'),
    'the page was left inert after the dialog closed',
  );
});

test('Tab wraps from the last control back to the first', () => {
  const { window, document } = makePage({ html: PAGE });
  click(window, document.getElementById('opener'));

  const last = document.getElementById('last');
  last.focus();
  press(window, last, 'Tab');

  assert.equal(
    document.activeElement,
    document.getElementById('first'),
    'Tab escaped the dialog instead of wrapping',
  );
});

test('Shift+Tab wraps from the first control back to the last', () => {
  const { window, document } = makePage({ html: PAGE });
  click(window, document.getElementById('opener'));

  const first = document.getElementById('first');
  first.focus();
  first.dispatchEvent(
    new window.KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );

  assert.equal(document.activeElement, document.getElementById('last'));
});

test('nested dialogs unwind focus in the right order', () => {
  const { window, document } = makePage({ html: NESTED });
  const opener = document.getElementById('opener');
  opener.focus();

  click(window, opener);
  const openInner = document.getElementById('open-inner');
  openInner.focus();
  click(window, openInner);

  // A single _lastFocused slot could not describe this: opening the inner
  // dialog overwrote the outer dialog's opener, so closing both returned focus
  // to the inner button rather than to the page.
  window.RetroModal.hide('inner');
  assert.equal(document.activeElement, openInner, 'inner dialog restored the wrong element');

  window.RetroModal.hide('outer');
  assert.equal(document.activeElement, opener, 'outer dialog restored the wrong element');
});

test('showing the same modal twice does not lose the opener', () => {
  const { window, document } = makePage({ html: PAGE });
  const opener = document.getElementById('opener');
  opener.focus();

  window.RetroModal.show('dlg');
  // The re-entry guard: a second show() must not record an element inside the
  // dialog as the thing to restore focus to.
  window.RetroModal.show('dlg');
  window.RetroModal.hide('dlg');

  assert.equal(document.activeElement, opener);
});
