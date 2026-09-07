#!/usr/bin/env node
/**
 * RetroCSS static CSS gate.
 *
 * Two invariants over the compiled stylesheet: shape (nothing hardcodes a
 * corner behind the radius token) and lighting (nothing models a light source
 * with a token that inverts between themes).
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
 * Exits non-zero on any failure. Run with `npm run check:css`.
 */
import { compile } from 'sass';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
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

/* ---------- lighting: tokens that invert must not model a light source ---- */
/**
 * --retro-black-rgb and --retro-white-rgb swap between themes (black <-> white,
 * white -> #3a3a3a). That is right for text and surfaces and wrong for anything
 * modelling a light source. Two shipped bugs came from exactly this:
 *
 *   .retro-modal           backdrop rendered rgba(255,255,255,0.6) in dark,
 *                          washing the page out instead of dimming it
 *   .retro-heading-variant drop shadow rendered as a white glow -- while the
 *                          text-shadow on the very next line used the fixed
 *                          token and stayed dark
 *
 * Use --retro-shadow-rgb, --retro-scrim-rgb or --retro-sheen-rgb instead; those
 * are fixed in both themes.
 */
const LIGHTING_ALLOW = [
  // A hairline divider is a surface tint, not a light source: it should read
  // dark on a light surface and light on a dark one, so inverting is correct.
  '.retro-alert-footer',
];

const lighting = [];
for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const selector = rule[1].trim().split('\n').pop().trim();
  if (LIGHTING_ALLOW.some((a) => selector.includes(a))) continue;
  for (const d of rule[2].matchAll(/rgba\(\s*var\(\s*--retro-(?:black|white)-rgb\s*\)[^)]*\)/g)) {
    lighting.push({ selector, snippet: d[0] });
  }
}

if (lighting.length) {
  console.error(
    `\n✗ ${lighting.length} declaration(s) build a colour from a token that inverts between themes:`,
  );
  for (const l of lighting) {
    console.error(`    ${l.selector.slice(0, 44).padEnd(46)} ${l.snippet}`);
  }
  console.error(
    '\n  A shadow, scrim or gloss must not follow the theme. Use\n' +
      '  --retro-shadow-rgb, --retro-scrim-rgb or --retro-sheen-rgb, or add the\n' +
      '  selector to LIGHTING_ALLOW with a reason.\n',
  );
  process.exit(1);
}

console.log(
  `✓ ${checked} radius declarations square or tokenised; ` +
    `no inverting colour used as a shadow, scrim or gloss`,
);

/* ---------- coverage: every component class is demonstrated somewhere ----- */
/**
 * A class that exists in the stylesheet but appears on no page and in no
 * script is undiscoverable: it works, but nobody can find out that it does.
 * An audit found 31 of them shipping at once -- modal sizes, input sizes,
 * .retro-btn-block, the form layouts, the progress variants -- all real
 * features, none of them documented or shown.
 *
 * Utilities are exempt: they exist for consumers to use and are not expected
 * to appear in the framework's own pages.
 */
const UTILITY = new RegExp(
  '^retro-(m[trblxy]?|p[trblxy]?|w|h|max|min|col|row|grid|flex|justify|align|items|self|' +
    'order|gap|bg|text|border|rounded|shadow|opacity|z|overflow|position|absolute|relative|' +
    'fixed|sticky|top|bottom|left|right|inset|d|hidden|visible|inline|block|float|clear|' +
    'cursor|select|pointer|transition|sr|font|cq|grow|shrink|h[1-6])(-|$)',
);

/** Names composed at runtime -- `retro-toast-${type}` never appears literally. */
const RUNTIME_COMPOSED = /^retro-(toast|tooltip)-/;

/**
 * Classes that only ever appear inside a parent component's markup, so an
 * author composes them from the docs rather than reaching for them alone.
 */
const COVERAGE_ALLOW = new Set([
  'retro-alert-icon', 'retro-alert-main',
  'retro-datetime-group', 'retro-datetime-separator',
  'retro-dropdown-arrow',
  'retro-infinite-item',
  'retro-label-text',
  'retro-sidebar-section-title',
  // Optional modal modifiers, documented in documentation.html.
  'retro-modal-backdrop', 'retro-modal-fade', 'retro-modal-slide',
  // Artefact: the scan matches `.retro-heading-*` inside a SassDoc example.
  'retro-heading-',
]);

const walk = (dir) =>
  readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sources = [
  'index.html',
  'documentation.html',
  ...readdirSync('examples').map((f) => join('examples', f)),
  ...walk('src/js'),
]
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const referenced = new Set([...sources.matchAll(/(retro-[a-z0-9-]+)/g)].map((m) => m[1]));
const defined = new Set([...css.matchAll(/\.(retro-[a-z0-9-]+)/g)].map((m) => m[1]));

const undocumented = [...defined]
  .filter((c) => !UTILITY.test(c) && !RUNTIME_COMPOSED.test(c))
  .filter((c) => !referenced.has(c) && !COVERAGE_ALLOW.has(c))
  .sort();

if (undocumented.length) {
  console.error(`\n✗ ${undocumented.length} component class(es) ship but appear on no page:`);
  for (const c of undocumented) console.error(`    .${c}`);
  console.error(
    '\n  Demonstrate it on index.html, or add it to COVERAGE_ALLOW with a\n' +
      '  reason if it only exists inside a parent component.\n',
  );
  process.exit(1);
}


/* ---------- source hygiene: no raw control bytes ---------- */
/**
 * A stray control character in a stylesheet is almost always an escape that
 * something ate on the way in. The sortable-table arrows shipped for a whole
 * major that way: `\\2195` reached the file as U+0011 followed by the
 * literal text `95`, so every sortable header rendered a tofu box and the
 * digits `95` instead of an up-down arrow. Sass passes it through happily and
 * the browser renders it, so nothing downstream notices.
 *
 * Tab, newline and carriage return are legitimate; nothing else is.
 */
const CONTROL_BYTE = new RegExp('[' + [
  '\\u0000-\\u0008',
  '\\u000b\\u000c',
  '\\u000e-\\u001f',
].join('') + ']');

const scssFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? scssFiles(join(dir, e.name)) : extname(e.name) === '.scss' ? [join(dir, e.name)] : [],
  );

const controlBytes = [];
for (const file of scssFiles('src/scss')) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const m = line.match(CONTROL_BYTE);
      if (!m) return;
      const code = m[0].codePointAt(0).toString(16).padStart(4, '0');
      controlBytes.push({ where: `${file}:${i + 1}`, code, line: line.trim().slice(0, 60) });
    });
}

if (controlBytes.length) {
  console.error(`\n\u2717 ${controlBytes.length} raw control byte(s) in the SCSS sources:`);
  for (const c of controlBytes) {
    console.error(`    ${c.where.padEnd(46)} U+${c.code.toUpperCase()}  ${c.line}`);
  }
  console.error(
    '\n  This is almost always an escape that was eaten before it reached the\n' +
      '  file. Write the codepoint escape you meant, and check it compiles to\n' +
      '  the glyph you expect.\n',
  );
  process.exit(1);
}

console.log(
  `✓ every component class is demonstrated (${COVERAGE_ALLOW.size} allowlisted sub-parts); ` +
    'no raw control bytes in the sources',
);
