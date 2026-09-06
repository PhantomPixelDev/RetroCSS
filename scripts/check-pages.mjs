#!/usr/bin/env node
/**
 * RetroCSS rendered-page gate.
 *
 * check-contrast.mjs proves the *tokens* are sound. This proves the *pages*
 * are: it loads every demo page in a real browser, in both themes, at five
 * widths, and asserts the things that actually broke in production and were
 * caught only by hand.
 *
 * Per page, per theme:
 *   1. no console errors or page errors on load
 *   2. exactly one <h1>
 *   3. no horizontal overflow at 1200/980/760/420/360px
 *   4. every rendered text node clears WCAG AA against its painted backdrop
 *   5. input glyphs are vertically centred on their field
 *
 * Exits non-zero on any failure. Run with `npm run check:pages`.
 * Requires a build first: the pages load dist/.
 */
import { chromium } from 'playwright';
import process from 'node:process';
import { PAGES, THEMES, serveRepo, primeTheme, freezeMotion } from './lib/harness.mjs';

const WIDTHS = [1200, 980, 760, 420, 360];
// A few px of slop. Sub-pixel layout rounding reports scrollWidth one greater
// than clientWidth on elements that are not actually overflowing.
const OVERFLOW_SLOP = 2;

/* ---------- static server ---------- */
const { origin, close: closeServer } = await serveRepo();

/* ---------- in-page probes ---------- */
// This runs in the browser. Kept as one function so a page is only walked once.
const probe = (slop) => {
  const out = { overflow: [], headings: 0, contrast: [], glyphs: [] };

  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    return el.tagName.toLowerCase() + cls;
  };

  /* -- 2. h1 count -- */
  out.headings = document.querySelectorAll('h1').length;

  /* -- 3. overflow -- */
  const docWidth = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > docWidth + slop) {
    // Report the culprits, not just "the page is wide": every element whose
    // right edge lands past the viewport while its parent's does not.
    // An element inside a scroll container cannot widen the document -- the
    // container clips it. Without this the responsive tables' own buttons get
    // blamed for the page being wide, which hides the element that really is.
    const clipped = (el) => {
      for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        if (getComputedStyle(n).overflowX !== 'visible') return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= docWidth + slop) continue;
      if (clipped(el)) continue;
      const p = el.parentElement;
      if (p && p !== document.body && p.getBoundingClientRect().right > docWidth + slop) continue;
      out.overflow.push({ sel: label(el), right: Math.round(r.right), limit: docWidth });
      if (out.overflow.length >= 8) break;
    }
    // A wide page with no attributable child still has to fail.
    if (!out.overflow.length) {
      out.overflow.push({
        sel: '(document)',
        right: document.documentElement.scrollWidth,
        limit: docWidth,
      });
    }
  }

  /* -- 4. rendered contrast -- */
  const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
  const lum = (c) =>
    c.map((v) => v / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + [0.2126, 0.7152, 0.0722][i] * v, 0);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  // Walk up until something actually paints. `transparent` and rgba(_, 0) are
  // both "not painted"; without this every element reads as its own colour.
  // A gradient paints but reports `backgroundColor: transparent`, so reading
  // only that colour walks straight past it to the card underneath and scores
  // the text against a surface it is not actually sitting on. The heading
  // variants are all gradients. Return every stop and let the caller take the
  // worst: text has to clear AA across the whole run, not just at one end.
  const backdrop = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const stops = [...cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)]
          .map((m) => m[1].split(',').map((v) => parseFloat(v)))
          // A stop that is mostly transparent lets the layer below through;
          // it is not the surface.
          .filter((c) => c.length >= 3 && (c[3] === undefined || c[3] > 0.5))
          .map((c) => c.slice(0, 3));
        if (stops.length) return stops;
      }
      const c = rgb(cs.backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return [c.slice(0, 3)];
    }
    return [[255, 255, 255]];
  };

  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.5) continue;
    // Outline text is legible through its stroke, not its fill: measuring the
    // fill against the surface is measuring the wrong pair.
    if (cs.webkitTextStrokeWidth && parseFloat(cs.webkitTextStrokeWidth) > 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const fg = rgb(cs.color);
    if (fg[3] !== undefined && fg[3] < 0.5) continue;
    const size = parseFloat(cs.fontSize);
    const weight = +cs.fontWeight || 400;
    // WCAG "large text": >=24px, or >=18.66px when bold.
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const min = large ? 3.0 : 4.5;
    const got = Math.min(...backdrop(el).map((bg) => ratio(fg.slice(0, 3), bg)));
    if (got + 0.005 < min) {
      out.contrast.push({
        sel: label(el),
        text: n.nodeValue.trim().slice(0, 32),
        ratio: got.toFixed(2),
        min,
      });
      if (out.contrast.length >= 10) break;
    }
  }

  /* -- 5. input glyph centring -- */
  // The register page shipped with these anchored to the top of the wrapper,
  // 19.5px above the field's centre line.
  for (const wrap of document.querySelectorAll('.retro-input-icon')) {
    const field = wrap.querySelector('input, select, textarea');
    const glyph = wrap.querySelector('.icon, .retro-input-icon-glyph, i, svg');
    if (!field || !glyph || glyph.contains(field)) continue;
    const f = field.getBoundingClientRect();
    const g = glyph.getBoundingClientRect();
    if (f.height === 0 || g.height === 0) continue;
    const off = Math.abs(g.top + g.height / 2 - (f.top + f.height / 2));
    if (off > 3) out.glyphs.push({ off: off.toFixed(1), name: field.name || field.type || '?' });
  }

  return out;
};

/* ---------- run ---------- */
const browser = await chromium.launch();
const failures = [];
let checks = 0;

const fail = (where, msg) => failures.push(`${where}\n      ${msg}`);

for (const page of PAGES) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: WIDTHS[0], height: 900 } });
    const tab = await ctx.newPage();

    const errors = [];
    tab.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    tab.on('pageerror', (e) => errors.push(String(e)));

    await primeTheme(tab, theme);
    await tab.goto(`${origin}/${page}`, { waitUntil: 'load' });
    await freezeMotion(tab);
    await tab.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    // Let fonts settle: text metrics drive both the overflow and glyph checks.
    await tab.evaluate(() => document.fonts?.ready);

    for (const width of WIDTHS) {
      await tab.setViewportSize({ width, height: 900 });
      await tab.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      const r = await tab.evaluate(probe, OVERFLOW_SLOP);
      const where = `${page}  ${theme}  ${width}px`;
      checks += 1;

      for (const o of r.overflow) {
        fail(where, `overflow: ${o.sel} right ${o.right} > ${o.limit}`);
      }
      // Widths past the first only re-check layout; these are width-invariant.
      if (width === WIDTHS[0]) {
        if (r.headings !== 1) fail(where, `${r.headings} <h1> on the page, expected exactly 1`);
        for (const c of r.contrast) {
          fail(where, `contrast ${c.ratio}:1 (needs ${c.min}) on ${c.sel} "${c.text}"`);
        }
      }
      for (const g of r.glyphs) {
        fail(where, `input glyph ${g.off}px off centre on field "${g.name}"`);
      }
    }

    if (errors.length) {
      fail(`${page}  ${theme}`, `console: ${[...new Set(errors)].slice(0, 4).join(' | ')}`);
    }
    await ctx.close();
  }
}

await browser.close();
closeServer();

if (failures.length) {
  console.error(`\n✗ ${failures.length} page failure(s) across ${checks} checks:\n`);
  for (const f of failures) console.error(`    ${f}`);
  process.exit(1);
}
console.log(
  `✓ ${PAGES.length} pages x ${THEMES.length} themes x ${WIDTHS.length} widths: ` +
    `${checks} checks clean`,
);
