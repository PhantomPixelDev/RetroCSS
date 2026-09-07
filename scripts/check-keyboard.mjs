#!/usr/bin/env node
/**
 * RetroCSS keyboard-operability gate.
 *
 * The other three gates measure tokens (check-contrast), shape (check-radius)
 * and rendered layout (check-pages). None of them can see whether a control can
 * be *reached*, which is how the framework shipped a set of components built
 * out of <div> and <span> that a mouse could drive and a keyboard could not:
 *
 *   .retro-carousel-dot   0 of 3 tabbable, no role, no accessible name
 *   .retro-rating-star    0 of 5 tabbable -- an input with no keyboard at all
 *   .retro-tooltip        21 triggers, mouseenter/mouseleave only
 *   .retro-file-input     hidden with display:none, so the picker was
 *                         unreachable: a <label> is not focusable either
 *   .retro-tag-remove     a <span>, so a tag could be added but never removed
 *
 * That is WCAG 2.1.1 (Keyboard), 1.4.13 (Content on Hover or Focus) and 4.1.2
 * (Name, Role, Value).
 *
 * Exits non-zero on any failure. Run with `npm run check:keyboard`.
 * Requires a build first: the pages load dist/.
 */
import { chromium } from 'playwright';
import process from 'node:process';
import { PAGES, THEMES, serveRepo, primeTheme, freezeMotion } from './lib/harness.mjs';

/**
 * Controls the framework drives from script. Each must be reachable by keyboard
 * and carry an accessible name. `name: false` means the name comes from
 * somewhere this probe cannot read cheaply -- a file input is named by its
 * <label for>, not by anything on the element itself.
 */
const CONTROLS = [
  { sel: '.retro-carousel-dot', name: true },
  { sel: '.retro-rating-star', name: true },
  { sel: '.retro-tag-remove', name: true },
  { sel: '.retro-file-input', name: false },
  // data-sort="none" is the documented opt-out for a column that should not
  // sort, so those headers are meant to stay out of the tab order.
  { sel: '.retro-table-sortable th[data-sort]:not([data-sort="none"])', name: true },
];

/** Groups that use a roving tabindex: exactly one member is in the tab order. */
const ROVING = ['[role="tablist"]', '[role="radiogroup"]'];

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
  'select:not([disabled]),textarea:not([disabled]),iframe,' +
  '[contenteditable]:not([contenteditable="false"]),[tabindex]:not([tabindex="-1"])';

/* ---------- static server ---------- */
const { origin, close: closeServer } = await serveRepo();

/* ---------- in-page probe ---------- */
function auditPage({ controls, roving, focusable }) {
  const out = { unreachable: [], unnamed: [], roving: [], tooltip: [] };

  const label = (el) => {
    const cls = [...el.classList].find((c) => c.startsWith('retro-'));
    return cls ? `.${cls}` : el.tagName.toLowerCase();
  };

  for (const { sel, name } of controls) {
    for (const el of document.querySelectorAll(sel)) {
      // Members of a roving-tabindex group are deliberately tabindex="-1":
      // the group holds one tab stop and arrow keys move within it. Their
      // reachability is asserted by the roving check below instead.
      const roved = el.closest('[role="radiogroup"],[role="tablist"]');
      if (!roved && !el.matches(focusable)) out.unreachable.push(`${sel} -> ${label(el)}`);
      if (!name) continue;
      const named =
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.textContent.trim() ||
        el.getAttribute('title');
      if (!named) out.unnamed.push(`${sel} -> ${label(el)}`);
    }
  }

  for (const groupSel of roving) {
    for (const group of document.querySelectorAll(groupSel)) {
      const role = groupSel === '[role="tablist"]' ? 'tab' : 'radio';
      const items = [...group.querySelectorAll(`[role="${role}"]`)];
      if (items.length < 2) continue;
      const stops = items.filter((i) => i.tabIndex === 0).length;
      if (stops !== 1) {
        out.roving.push(`${groupSel} has ${stops} tab stops across ${items.length} ${role}s`);
      }
    }
  }

  // WCAG 1.4.13: anything revealed on hover must also appear on focus. Checked
  // by dispatching a real focus, not by reading for a handler.
  for (const trigger of document.querySelectorAll('[data-retro-tooltip]')) {
    const bubble = trigger.querySelector('.retro-tooltip');
    if (!bubble) {
      out.tooltip.push(`${label(trigger)}: no tooltip element built`);
      continue;
    }
    if (!trigger.matches(focusable)) {
      out.tooltip.push(`${label(trigger)}: trigger not focusable`);
      continue;
    }
    trigger.focus();
    if (!bubble.classList.contains('show')) {
      out.tooltip.push(`${label(trigger)}: hidden on focus`);
    }
    trigger.blur();
    if (!trigger.getAttribute('aria-describedby')) {
      out.tooltip.push(`${label(trigger)}: no aria-describedby`);
    }
  }

  // Every form control needs an accessible name. A <label> with no `for`, next
  // to an <input> with no id, associates nothing -- the field is announced as
  // "edit text" and clicking the label does not focus it. Three pages shipped
  // that way, including a checkbox list whose text sat beside the box as a
  // plain sibling.
  const CONTROLS_SEL =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]),select,textarea';
  for (const el of document.querySelectorAll(CONTROLS_SEL)) {
    const named =
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.closest('label') ||
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
      // A placeholder is a weak name, but it is a name, and the framework's own
      // demos lean on it for single-purpose fields.
      el.getAttribute('placeholder') ||
      el.getAttribute('title');
    if (!named) {
      out.unnamed.push(`form control ${el.tagName.toLowerCase()}[type=${el.type || '-'}]`);
    }
  }

  return out;
}

/* ---------- run ---------- */
const browser = await chromium.launch();
const failures = [];
let checked = 0;

for (const page of PAGES) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    const tab = await ctx.newPage();
    await primeTheme(tab, theme);
    await tab.goto(`${origin}/${page}`, { waitUntil: 'load' });
    await freezeMotion(tab);

    const res = await tab.evaluate(auditPage, {
      controls: CONTROLS,
      roving: ROVING,
      focusable: FOCUSABLE,
    });
    checked += 1;

    const where = `${page} [${theme}]`;
    for (const m of res.unreachable) failures.push(`${where}  not reachable by keyboard: ${m}`);
    for (const m of res.unnamed) failures.push(`${where}  no accessible name: ${m}`);
    for (const m of res.roving) failures.push(`${where}  roving tabindex: ${m}`);
    for (const m of res.tooltip) failures.push(`${where}  tooltip: ${m}`);

    await ctx.close();
  }
}

await browser.close();
closeServer();

if (failures.length) {
  console.error(`\n✗ ${failures.length} keyboard failure(s) across ${checked} page/theme loads:`);
  for (const f of failures) console.error(`    ${f}`);
  console.error(
    '\n  Every control the framework drives from script must be reachable by\n' +
      '  keyboard and carry an accessible name. Give it a real <button>, or a\n' +
      '  role plus a tab stop plus Enter/Space handling.\n',
  );
  process.exit(1);
}

console.log(`✓ ${checked} page/theme loads: every framework control is keyboard-operable`);
