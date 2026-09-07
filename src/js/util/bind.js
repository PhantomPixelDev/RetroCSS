/**
 * Idempotence helpers.
 *
 * `RetroCSS.init()` is documented as the manual entry point for re-initialising
 * after a DOM change, which is exactly what a single-page app does on every
 * route change. It was not idempotent: each call re-registered roughly 250
 * listeners -- 66 blur, 46 keydown, 44 click, 29 focus, 28 mouseenter, 28
 * mouseleave -- on the elements that were already wired.
 *
 * Most of those duplicates were invisible, because running the same handler
 * twice usually sets the same attribute twice. One was not: every
 * `[data-retro-toast]` trigger fired one toast per init() call, so three calls
 * meant three toasts per click.
 *
 * The fix is the guard `infinite-scroll.js` already used, lifted somewhere the
 * other modules can share it.
 */

/**
 * Claim an element for one feature. Returns false if it was already claimed,
 * so a caller can bail before attaching anything.
 *
 * @param {Element} el
 * @param {string} key  camelCase, becomes `data-retro-<key>-bound`
 * @returns {boolean} true the first time, false afterwards
 *
 * @example
 *   el.querySelectorAll('.retro-thing').forEach((node) => {
 *     if (!bindOnce(node, 'thing')) return;
 *     node.addEventListener('click', …);
 *   });
 */
export function bindOnce(el, key) {
  const prop = `retro${key.charAt(0).toUpperCase()}${key.slice(1)}Bound`;
  if (el.dataset[prop] === 'true') return false;
  el.dataset[prop] = 'true';
  return true;
}

/**
 * The same idea for handlers that hang off `document` rather than an element.
 * Delegated listeners cannot use a dataset flag, and they are the ones whose
 * duplicates are hardest to notice: a second document-level click handler
 * calling `closest()` does the same work again and usually looks identical.
 *
 * @param {string} key  unique per module
 * @returns {boolean} true the first time, false afterwards
 */
const claimed = new Set();
export function claimGlobal(key) {
  if (claimed.has(key)) return false;
  claimed.add(key);
  return true;
}

/** Test seam: forget every global claim. Not part of the public API. */
export function resetGlobalClaims() {
  claimed.clear();
}
