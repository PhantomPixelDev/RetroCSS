#!/usr/bin/env node
/**
 * RetroCSS shape gate.
 *
 * The framework is square. Rounding is opt-in, through one token:
 *
 *   :root { --retro-border-radius: 4px; }
 *
 * This script asserts that no component hardcodes a radius behind the token's
 * back. It exists because of a real regression: `_base.scss` used to carry
 * `* { border-radius: 0 !important }`, which silently suppressed 40-odd
 * non-zero radius declarations written by people who never saw them apply.
 * 3.0.0 dropped that `!important` -- correctly, since it also meant nothing in
 * a consuming app could round a corner -- and every one of those declarations
 * came alive at once, shipping a Windows 95 framework with 999px nav pills.
 *
 * The check is static rather than rendered on purpose. Several of the offenders
 * (.retro-divider-vertical, .retro-ascii-loader, the range-thumb vendor
 * prefixes) appear on no demo page, which is exactly how they accumulated
 * unseen. Compiling the CSS covers every rule the framework can emit.
 *
 * Exits non-zero on any failure. Run with `npm run check:radius`.
 */
import { compile } from 'sass';
import process from 'node:process';

/**
 * Selectors allowed to carry a hardcoded radius. Every entry needs a comment
 * saying why, and a matching comment at the declaration itself.
 */
const ALLOW = [
  // A pill is the shape the component is named for.
  '.retro-nav-pills',
  // A tag reads as a chip; its wrapper stays square.
  '.retro-tag',
  // Opt-in utilities. Rounding on request is the whole point of them.
  '.retro-rounded',
];

// Strip comments first. The SassDoc blocks in _variables.scss quote example
// rules verbatim, and a naive scan matches those before the real declarations.
const css = compile('src/scss/retro.scss', { style: 'expanded' }).css.replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/**
 * A value passes if every corner it sets is either zero or driven by the
 * radius token -- including mixed values such as
 * `0 0 var(--retro-border-radius-sm) var(--retro-border-radius-sm)`, which is
 * what .retro-modal-footer legitimately uses. Testing only that a value
 * *starts* with `var(` would wrongly flag it.
 */
const isSquareOrTokenised = (value) => {
  const corners = value
    .replace(/\s*!important\s*$/, '')
    // Split on whitespace that is not inside a var(...) call.
    .match(/var\([^)]*\)|\S+/g);
  if (!corners) return false;
  return corners.every(
    (c) => /^0(px)?$/.test(c) || /^var\(\s*--retro-border-radius/.test(c),
  );
};

const failures = [];
let checked = 0;

for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  // The selector is the last line of the captured run: anything before it
  // belongs to the preceding rule's closing brace.
  const selector = rule[1].trim().split('\n').pop().trim();
  if (ALLOW.some((a) => selector.includes(a))) continue;

  for (const decl of rule[2].matchAll(
    /border(?:-[a-z]+)*-radius\s*:\s*([^;]+);/g,
  )) {
    const value = decl[1].trim();
    checked += 1;
    if (isSquareOrTokenised(value)) continue;
    // A circle is a shape, not chrome: radio buttons, the spinner and list
    // bullets are round by design, and squaring them was the old bug.
    if (value === '50%') continue;
    failures.push({ selector, value });
  }
}

if (failures.length) {
  console.error(
    `\n✗ ${failures.length} of ${checked} radius declaration(s) bypass --retro-border-radius:`,
  );
  for (const f of failures) {
    console.error(`    ${f.selector.slice(0, 60).padEnd(62)} ${f.value}`);
  }
  console.error(
    '\n  Use var(--retro-border-radius) so consumers can round the framework,\n' +
      '  or add the selector to ALLOW in this script with a reason.\n',
  );
  process.exit(1);
}

console.log(
  `✓ all ${checked} radius declarations are square, tokenised, or allowlisted`,
);
