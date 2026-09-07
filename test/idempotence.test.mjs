/**
 * `RetroCSS.init()` must be safe to call again.
 *
 * It is documented as the manual entry point for re-initialising after a DOM
 * change, which is what a single-page app does on every route change. It was
 * not idempotent: each call re-registered roughly 250 listeners on elements
 * that were already wired -- 66 blur, 46 keydown, 44 click, 29 focus, 28
 * mouseenter, 28 mouseleave, plus document-level handlers.
 *
 * Most duplicates were invisible, because running the same handler twice
 * usually sets the same attribute twice. One was not: every
 * `[data-retro-toast]` trigger fired one toast per init() call.
 *
 * These tests count listener registrations rather than watching behaviour,
 * because behaviour is exactly what hid the leak for so long.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePage, click } from './helpers/dom.mjs';

/** Markup touching every initialiser that binds to elements. */
const PAGE = `
  <nav class="retro-nav retro-nav-tabbed">
    <a class="retro-nav-item" href="#a">A</a>
    <a class="retro-nav-item" href="#b">B</a>
  </nav>
  <div class="retro-tab-pane"><div class="retro-tab-content" id="a">A</div>
    <div class="retro-tab-content" id="b">B</div></div>

  <button data-retro-toast="hello">Toast</button>
  <a href="#" data-retro-tooltip="Tip">Trigger</a>

  <form class="retro-form"><input class="retro-input" id="f1"><textarea id="f2"></textarea></form>

  <div class="retro-file-upload">
    <input type="file" id="fu" class="retro-file-input retro-sr-only">
    <label for="fu" class="retro-file-label">Browse</label>
    <span class="retro-file-filename">none</span>
    <div class="retro-file-drop">drop</div>
  </div>

  <div class="retro-search-bar"><input class="retro-search-input">
    <div class="retro-search-suggestions"><div>one</div></div></div>

  <div class="retro-tag-input"><div class="retro-tags">
    <span class="retro-tag">tag <span class="retro-tag-remove">x</span></span></div>
    <input class="retro-tag-text"></div>

  <div class="retro-rating"><span class="retro-rating-star">*</span>
    <span class="retro-rating-star">*</span></div>

  <div class="retro-carousel"><div class="retro-carousel-track">
    <div class="retro-carousel-slide">1</div><div class="retro-carousel-slide">2</div></div>
    <div class="retro-carousel-dots"><div class="retro-carousel-dot"></div>
    <div class="retro-carousel-dot"></div></div></div>

  <div class="retro-accordion"><div class="retro-accordion-item">
    <div class="retro-accordion-toggle">T</div>
    <div class="retro-accordion-content">C</div></div></div>

  <button class="retro-theme-toggle">Theme</button>
`;

/**
 * Count every addEventListener call the next `init()` makes, on elements and
 * on the document alike.
 */
function countListenersOnInit(window) {
  let n = 0;
  const onElement = window.Element.prototype.addEventListener;
  const onDocument = window.document.addEventListener.bind(window.document);

  window.Element.prototype.addEventListener = function counted(...args) {
    n += 1;
    return onElement.apply(this, args);
  };
  window.document.addEventListener = (...args) => {
    n += 1;
    return onDocument(...args);
  };

  window.RetroCSS.init();

  window.Element.prototype.addEventListener = onElement;
  window.document.addEventListener = onDocument;
  return n;
}

test('a repeat init() registers no new listeners', () => {
  const { window } = makePage({ html: PAGE });

  // The page has already auto-initialised, so every one of these is a repeat.
  assert.equal(countListenersOnInit(window), 0, 'second init() bound something');
  assert.equal(countListenersOnInit(window), 0, 'third init() bound something');
  assert.equal(countListenersOnInit(window), 0, 'fourth init() bound something');
});

test('a toast trigger fires exactly one toast however often init() runs', () => {
  const { window, document } = makePage({ html: PAGE });

  window.RetroCSS.init();
  window.RetroCSS.init();

  click(window, document.querySelector('[data-retro-toast]'));
  assert.equal(
    document.querySelectorAll('.retro-toast').length,
    1,
    'each init() used to add another handler, so this showed one toast per call',
  );
});

test('init() still wires elements added after the first call', () => {
  const { window, document } = makePage({ html: PAGE });

  const later = document.createElement('button');
  later.setAttribute('data-retro-toast', 'later');
  document.body.appendChild(later);

  // Guarding must not turn init() into a no-op for genuinely new markup.
  window.RetroCSS.init();
  click(window, later);

  assert.equal(document.querySelectorAll('.retro-toast').length, 1);
});
