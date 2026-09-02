#!/usr/bin/env node
/**
 * RetroCSS accessibility gate.
 *
 * Compiles src/scss/retro.scss, extracts the :root and [data-theme=dark] token
 * blocks, and asserts:
 *   1. every var(--retro-*) used without a fallback is actually defined, and
 *   2. every text/surface pair the framework produces clears WCAG AA.
 *
 * Exits non-zero on any failure. Run with `npm run check:a11y`.
 */
import { compile } from 'sass';
import process from 'node:process';

const AA = 4.5; // normal-weight body text
const AA_UI = 3.0; // non-text UI (borders, large text)

/* ---------- colour maths ---------- */
const parseHex = (h) => {
  h = h.trim().replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const luminance = (rgb) => {
  const [r, g, b] = rgb
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* ---------- extract token blocks ---------- */
// Strip comments up front: the SassDoc blocks in _variables.scss quote example
// `:root {` and `[data-theme="dark"] {` snippets verbatim, and a naive search
// finds those before the real rules.
const css = compile('src/scss/retro.scss', { style: 'expanded' }).css.replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

// Note: Sass emits the attribute selector unquoted, as `[data-theme=dark]`.
const blockOf = (selector) => {
  const needle = `\n${selector} {`;
  const start = css.indexOf(needle);
  if (start === -1) throw new Error(`missing token block: ${selector}`);
  const bodyStart = start + needle.length;
  const end = css.indexOf('\n}', bodyStart);
  const out = {};
  for (const d of css
    .slice(bodyStart, end)
    .matchAll(/(--retro-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[d[1]] = d[2].trim();
  }
  if (!Object.keys(out).length) throw new Error(`no tokens found in: ${selector}`);
  return out;
};

const light = blockOf(':root');
const darkOverrides = blockOf('[data-theme=dark]');
const dark = { ...light, ...darkOverrides };

// Resolve one level of var() aliasing, e.g. --retro-color-info -> --retro-info-text.
const resolve = (block, name, depth = 0) => {
  const v = block[name];
  if (v === undefined || depth > 4) return null;
  const alias = v.match(/^var\(\s*(--retro-[a-z0-9-]+)\s*\)$/);
  if (alias) return resolve(block, alias[1], depth + 1);
  return parseHex(v);
};

/* ---------- 0. sanity ---------- */
// Guards against the failure this script originally had: a selector that did
// not match left `dark` identical to `light`, so every dark pair silently
// "passed" while never being tested.
if (Object.keys(darkOverrides).length < 50) {
  throw new Error(
    `dark block looks wrong: parsed only ${Object.keys(darkOverrides).length} tokens`,
  );
}
console.log(
  `  parsed ${Object.keys(light).length} light tokens, ` +
    `${Object.keys(darkOverrides).length} dark overrides`,
);

/* ---------- 1. no undefined variables ---------- */
const defined = new Set(Object.keys(light));
// Only flag var() calls with no fallback: a consumer-supplied custom property
// (the grid utilities) is legitimately undefined at build time.
const used = new Set(
  [...css.matchAll(/var\(\s*(--retro-[a-z0-9-]+)\s*\)/g)].map((m) => m[1]),
);
const undef = [...used].filter((u) => !defined.has(u)).sort();

/* ---------- 2. contrast matrix ---------- */
const HUES = [
  'primary', 'success', 'danger', 'warning', 'info', 'teal', 'tan', 'pink',
  'lime', 'cyan', 'orange', 'brown', 'violet', 'gray', 'maroon', 'gold',
  'navy', 'olive', 'silver',
];
const SYNTAX = [
  'keyword', 'string', 'comment', 'function', 'number', 'operator',
  'variable', 'class', 'property', 'tag', 'attribute',
];

// Escape hatch for a pair that is knowingly allowed to fail, as `theme  label`
// (e.g. 'light  danger-fg on danger'). Empty on purpose: the whole matrix
// currently passes, and it should stay that way. Anything added here needs a
// matching note in _variables.scss saying why.
const EXCEPTIONS = new Set();

const failures = [];
const exceptionsHit = [];
let checked = 0;

const check = (theme, label, fg, bg, min) => {
  const a = resolve(theme === 'light' ? light : dark, fg);
  const b = resolve(theme === 'light' ? light : dark, bg);
  if (!a || !b) return;
  checked += 1;
  const ratio = contrast(a, b);
  if (ratio >= min) return;
  const key = `${theme.padEnd(5)}  ${label}`;
  (EXCEPTIONS.has(key) ? exceptionsHit : failures).push({
    key,
    ratio: ratio.toFixed(2),
    min,
  });
};

for (const theme of ['light', 'dark']) {
  const surfaces = [
    '--retro-bg', '--retro-body-bg', '--retro-card-content-bg',
    '--retro-light', '--retro-input-bg',
  ];

  for (const s of surfaces) {
    const on = s.replace('--retro-', '');
    check(theme, `text on ${on}`, '--retro-text', s, AA);
    check(theme, `text-muted on ${on}`, '--retro-text-muted', s, AA);
    for (const h of HUES) {
      check(theme, `${h}-text on ${on}`, `--retro-${h}-text`, s, AA);
    }
  }

  // -fg is painted on all three fill states, not just the base: badges and
  // buttons swap to -hover/-active on interaction, and the heading variants
  // run a base -> active gradient, so the far end of that gradient counts too.
  for (const h of HUES) {
    check(theme, `${h}-fg on ${h}`, `--retro-${h}-fg`, `--retro-${h}`, AA);
    check(theme, `${h}-fg on ${h}-hover`, `--retro-${h}-fg`, `--retro-${h}-hover`, AA);
    check(theme, `${h}-fg on ${h}-active`, `--retro-${h}-fg`, `--retro-${h}-active`, AA);
  }

  for (const t of SYNTAX) {
    check(theme, `syntax ${t}`, `--retro-syntax-${t}`, '--retro-bg', AA);
  }

  // A component needs a perceivable boundary, not specifically a dark one.
  // On the dark chassis the highlight edge does that job: no dark colour can
  // reach 3:1 against the #3a3a3a face (pure black manages 1.85). So require
  // that at least one border token clears AA_UI against the surface.
  {
    const bg = resolve(theme === 'light' ? light : dark, '--retro-bg');
    const edges = ['--retro-border-dark', '--retro-border-medium', '--retro-border-light']
      .map((t) => resolve(theme === 'light' ? light : dark, t))
      .filter(Boolean);
    if (bg && edges.length) {
      checked += 1;
      const best = Math.max(...edges.map((e) => contrast(e, bg)));
      if (best < AA_UI) {
        failures.push({
          key: `${theme.padEnd(5)}  no border edge reaches ${AA_UI}:1 on bg`,
          ratio: best.toFixed(2),
          min: AA_UI,
        });
      }
    }
  }
  check(theme, 'card header text', '--retro-card-header-text', '--retro-card-header-bg', AA);
  check(theme, 'card content text', '--retro-card-content-text', '--retro-card-content-bg', AA);
  check(theme, 'modal header text', '--retro-modal-header-text', '--retro-modal-header-bg', AA);
  check(theme, 'table header text', '--retro-table-header-text', '--retro-table-header-bg', AA);
  check(theme, 'alert text', '--retro-alert-text', '--retro-alert-bg', AA);
  check(theme, 'sidebar text', '--retro-sidebar-text', '--retro-sidebar-bg', AA);
  check(theme, 'dropdown text', '--retro-dropdown-text', '--retro-dropdown-bg', AA);
  check(theme, 'toast text', '--retro-toast-text', '--retro-toast-bg', AA);
  check(theme, 'badge text', '--retro-badge-text', '--retro-badge-bg', AA);
  check(theme, 'input text', '--retro-input-text', '--retro-input-bg', AA);
  check(theme, 'list text', '--retro-list-text', '--retro-list-bg', AA);
}

/* ---------- report ---------- */
let bad = false;

if (undef.length) {
  bad = true;
  console.error(`\n✗ ${undef.length} undefined --retro-* variable(s) used without a fallback:`);
  for (const u of undef) console.error(`    ${u}`);
} else {
  console.log(`✓ all ${used.size} referenced --retro-* variables are defined`);
}

if (failures.length) {
  bad = true;
  console.error(`\n✗ ${failures.length} of ${checked} contrast pairs fail:`);
  for (const f of failures) {
    console.error(`    ${f.key.padEnd(48)} ${f.ratio}:1  (needs ${f.min})`);
  }
} else {
  console.log(`✓ all ${checked} text/surface pairs meet WCAG AA`);
}

if (exceptionsHit.length) {
  console.log(`\n  ${exceptionsHit.length} known exception(s), documented in _variables.scss:`);
  for (const e of exceptionsHit) {
    console.log(`    ${e.key.padEnd(48)} ${e.ratio}:1  (AA-large only)`);
  }
}

process.exit(bad ? 1 : 0);
