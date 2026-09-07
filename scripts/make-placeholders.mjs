#!/usr/bin/env node
/**
 * Generates the example blog's cover art.
 *
 * The examples had no images at all, which is most of why they read as stubs
 * rather than as pages. These are committed SVGs rather than photographs or a
 * remote placeholder service, for three reasons: the pages must work offline
 * and on a locked-down CSP, a 90s framework wants 90s artwork rather than
 * stock photography, and SVG stays crisp at every width the gates test.
 *
 * Each cover is a Win9x desktop motif -- a bevelled frame, an ordered-dither
 * gradient in the manner of a 256-colour display, and one geometric subject.
 * Run with `npm run build:placeholders`; output goes to images/covers/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'images/covers';
const W = 600;
const H = 400;

/** Win9x-era palettes: a dark ground, a light ground, and an accent. */
const COVERS = [
  { name: 'theming', dark: '#000080', light: '#4a90e2', accent: '#ffd700', motif: 'sun' },
  { name: 'components', dark: '#004d00', light: '#2fa84f', accent: '#e8f5e9', motif: 'blocks' },
  { name: 'accessibility', dark: '#7a3d00', light: '#e08a1e', accent: '#fff3d6', motif: 'rings' },
  { name: 'dark-mode', dark: '#2b2b4f', light: '#6b6bb5', accent: '#c9c9ff', motif: 'moon' },
  { name: 'typography', dark: '#5c0a3a', light: '#c2417f', accent: '#ffd9ec', motif: 'grid' },
  { name: 'release', dark: '#00404d', light: '#1e9aad', accent: '#d6f7ff', motif: 'peaks' },
];

/**
 * A 4x4 ordered-dither ramp. Real 256-colour displays could not show a smooth
 * gradient, so they interleaved two colours in a fixed matrix; copying that is
 * what makes these read as period rather than as flat modern shapes.
 *
 * Emitted as five <pattern> tiles rather than one <rect> per dot. The first
 * version drew every 4x4 cell individually: 15,000 rects and 458 KB per image,
 * for a placeholder.
 */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** One pattern tile: the cells of the matrix below `level` are painted. */
function tile(id, colour, level) {
  let dots = '';
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (BAYER[r][c] < level) dots += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
    }
  }
  return (
    `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse" fill="${colour}">` +
    `${dots}</pattern>`
  );
}

// Nine steps rather than five. With five, levels 8 and above already read as
// solid at this scale, so the whole gradient collapsed into one hard band
// across the top and the rest was flat.
const STEPS = [0, 1, 2, 3, 5, 7, 9, 12, 16];

function dither(from, to, id) {
  const defs = STEPS.map((lv, i) => tile(`${id}-${i}`, to, lv)).join('');
  const bandH = Math.ceil(H / STEPS.length);
  const bands = STEPS.map(
    (_, i) =>
      `<rect x="0" y="${i * bandH}" width="${W}" height="${bandH}" fill="url(#${id}-${i})"/>`,
  ).join('');
  return { defs, body: `<rect width="${W}" height="${H}" fill="${from}"/>${bands}` };
}

const MOTIFS = {
  sun: (a) => `
    <circle cx="300" cy="200" r="62" fill="${a}"/>
    <rect x="200" y="286" width="200" height="7" fill="${a}" opacity="0.7"/>
    <rect x="216" y="304" width="168" height="6" fill="${a}" opacity="0.5"/>
    <rect x="238" y="320" width="124" height="5" fill="${a}" opacity="0.32"/>`,
  blocks: (a) => `
    <rect x="196" y="150" width="80" height="80" fill="${a}"/>
    <rect x="288" y="150" width="80" height="80" fill="${a}" opacity="0.72"/>
    <rect x="242" y="242" width="80" height="80" fill="${a}" opacity="0.45"/>`,
  rings: (a) => `
    <circle cx="300" cy="215" r="76" fill="none" stroke="${a}" stroke-width="10"/>
    <circle cx="300" cy="215" r="48" fill="none" stroke="${a}" stroke-width="10" opacity="0.65"/>
    <circle cx="300" cy="215" r="20" fill="${a}" opacity="0.9"/>`,
  moon: (a) => `
    <path d="M330 150a76 76 0 1 0 0 132 62 62 0 0 1 0-132z" fill="${a}"/>
    <circle cx="196" cy="140" r="4" fill="${a}"/>
    <circle cx="240" cy="188" r="3" fill="${a}" opacity="0.8"/>
    <circle cx="404" cy="176" r="4" fill="${a}" opacity="0.7"/>
    <circle cx="430" cy="248" r="3" fill="${a}" opacity="0.6"/>`,
  grid: (a) => {
    let g = '';
    for (let i = 0; i < 5; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        const op = 0.35 + ((i + j) % 3) * 0.28;
        g += `<rect x="${196 + i * 44}" y="${152 + j * 44}" width="34" height="34" fill="${a}" opacity="${op.toFixed(2)}"/>`;
      }
    }
    return g;
  },
  peaks: (a) => `
    <path d="M150 300 L245 175 L300 245 L370 150 L470 300 Z" fill="${a}"/>
    <path d="M245 175 L285 228 L205 228 Z" fill="#ffffff" opacity="0.55"/>`,
};

/** The raised Win9x frame every cover sits in. */
const bevel = () => `
  <rect x="0" y="0" width="${W}" height="4" fill="#ffffff" opacity="0.75"/>
  <rect x="0" y="0" width="4" height="${H}" fill="#ffffff" opacity="0.75"/>
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="#000000" opacity="0.55"/>
  <rect x="${W - 4}" y="0" width="4" height="${H}" fill="#000000" opacity="0.55"/>`;

mkdirSync(OUT, { recursive: true });

for (const { name, dark, light, accent, motif } of COVERS) {
  const { defs, body } = dither(dark, light, `d-${name}`);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ` +
    `role="img" shape-rendering="crispEdges">` +
    `<defs>${defs}</defs>` +
    body +
    MOTIFS[motif](accent) +
    bevel() +
    `</svg>`;
  const file = join(OUT, `${name}.svg`);
  writeFileSync(file, svg);
  console.log(`  ${file}  ${(svg.length / 1024).toFixed(1)} KB`);
}

console.log(`\n${COVERS.length} covers written to ${OUT}/`);
