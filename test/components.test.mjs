import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePage, click, press } from './helpers/dom.mjs';

const ACCORDION = `
  <div class="retro-accordion">
    <div class="retro-accordion-item">
      <div class="retro-accordion-toggle">One</div>
      <div class="retro-accordion-content">first</div>
    </div>
  </div>`;

const RATING = `
  <div class="retro-rating">
    <span class="retro-rating-star">*</span>
    <span class="retro-rating-star">*</span>
    <span class="retro-rating-star">*</span>
    <span class="retro-rating-star">*</span>
    <span class="retro-rating-star">*</span>
  </div>`;

/* ---------------------------------------------------------------- accordion */

test('an accordion toggles open and closed', () => {
  const { window, document } = makePage({ html: ACCORDION });
  const toggle = document.querySelector('.retro-accordion-toggle');
  const item = document.querySelector('.retro-accordion-item');

  click(window, toggle);
  assert.equal(item.classList.contains('active'), true, 'first click should open');
  click(window, toggle);
  assert.equal(item.classList.contains('active'), false, 'second click should close');
});

test('adding an accordion does not re-bind the ones already on the page', () => {
  // Regression. RetroAccordion.init installed a MutationObserver that called
  // `new RetroAccordion(selector)` against the whole document on every
  // addition, so each new accordion added another click listener to every
  // existing toggle. After one addition a click opened *and* closed an item,
  // so nothing appeared to happen; after two, the handlers flapped odd/even.
  const { window, document } = makePage({ html: ACCORDION });
  const toggle = document.querySelector('.retro-accordion-toggle');
  const item = document.querySelector('.retro-accordion-item');

  for (let i = 1; i <= 3; i += 1) {
    const extra = document.createElement('div');
    extra.className = 'retro-accordion';
    extra.innerHTML =
      '<div class="retro-accordion-item"><div class="retro-accordion-toggle">x</div>' +
      '<div class="retro-accordion-content">y</div></div>';
    document.body.appendChild(extra);

    click(window, toggle);
    assert.equal(item.classList.contains('active'), true, `open failed after ${i} addition(s)`);
    click(window, toggle);
    assert.equal(item.classList.contains('active'), false, `close failed after ${i} addition(s)`);
  }
});

test('calling init twice does not double-bind an accordion', () => {
  const { window, document } = makePage({ html: ACCORDION });
  window.RetroCSS.init();
  const toggle = document.querySelector('.retro-accordion-toggle');
  const item = document.querySelector('.retro-accordion-item');
  click(window, toggle);
  assert.equal(item.classList.contains('active'), true);
});

/* ------------------------------------------------------------------- rating */

test('rating exposes the radiogroup pattern', () => {
  const { document } = makePage({ html: RATING });
  const group = document.querySelector('.retro-rating');
  const stars = [...document.querySelectorAll('.retro-rating-star')];

  assert.equal(group.getAttribute('role'), 'radiogroup');
  assert.ok(group.getAttribute('aria-label'), 'group needs a name');
  for (const s of stars) {
    assert.equal(s.getAttribute('role'), 'radio');
    assert.ok(s.getAttribute('aria-label'), 'each star needs a name');
    assert.ok(s.hasAttribute('aria-checked'));
  }
  // Roving tabindex: the group is one tab stop, arrows move within it.
  assert.equal(stars.filter((s) => s.tabIndex === 0).length, 1);
});

test('arrow keys set the rating and clamp at both ends', () => {
  const { window, document } = makePage({ html: RATING });
  const group = document.querySelector('.retro-rating');
  const stars = [...document.querySelectorAll('.retro-rating-star')];

  // Nothing selected: the first press lands on the first star, not the second.
  press(window, stars[0], 'ArrowRight');
  assert.equal(group.getAttribute('data-rating'), '1');

  press(window, document.activeElement, 'ArrowRight');
  assert.equal(group.getAttribute('data-rating'), '2');

  press(window, document.activeElement, 'ArrowLeft');
  assert.equal(group.getAttribute('data-rating'), '1');

  // Clamp low.
  press(window, document.activeElement, 'ArrowLeft');
  assert.equal(group.getAttribute('data-rating'), '1');

  press(window, document.activeElement, 'End');
  assert.equal(group.getAttribute('data-rating'), '5');

  // Clamp high.
  press(window, document.activeElement, 'ArrowRight');
  assert.equal(group.getAttribute('data-rating'), '5');

  press(window, document.activeElement, 'Home');
  assert.equal(group.getAttribute('data-rating'), '1');
});

test('choosing a rating emits retro:rating', () => {
  const { window, document } = makePage({ html: RATING });
  const group = document.querySelector('.retro-rating');
  const seen = [];
  group.addEventListener('retro:rating', (e) => seen.push(e.detail));

  click(window, document.querySelectorAll('.retro-rating-star')[2]);
  assert.equal(seen.length, 1);
  // Compared field by field: the detail object comes from the jsdom realm, so
  // its prototype is not the one deepEqual checks identity against.
  assert.equal(seen[0].rating, 3);
  assert.equal(seen[0].max, 5);
});

/* -------------------------------------------------------------------- toast */

test('toast escapes its message by default', () => {
  // data-retro-toast is reachable from markup, so the default path must not be
  // an innerHTML sink.
  const { window, document } = makePage();
  window.RetroToast.show('<img src=x onerror="globalThis.__xss=1">');
  const body = document.querySelector('.retro-toast-body');
  assert.equal(body.querySelector('img'), null, 'markup must not be parsed');
  assert.match(body.textContent, /^<img/);
});

test('toast renders HTML only behind the explicit opt-in', () => {
  const { window, document } = makePage();
  window.RetroToast.show('<b>bold</b>', { html: true });
  assert.ok(document.querySelector('.retro-toast-body b'), 'html: true should parse markup');
});

test('the toast container is a live region', () => {
  const { window, document } = makePage();
  window.RetroToast.show('hello');
  const c = document.getElementById('retro-toast-container');
  assert.equal(c.getAttribute('role'), 'status');
  assert.equal(c.getAttribute('aria-live'), 'polite');
});

test('duration 0 disables the auto-dismiss timer', () => {
  const { window, document } = makePage();
  const handle = window.RetroToast.show('stays', { duration: 0 });
  assert.ok(document.querySelector('.retro-toast'));
  handle.dismiss();
  assert.equal(document.querySelector('.retro-toast'), null);
});
