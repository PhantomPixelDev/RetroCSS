#!/usr/bin/env node
/**
 * Copies the package version into the pages that state it.
 *
 * Wired to the npm `version` lifecycle, so `npm version <x>` updates the markup
 * in the same step that bumps package.json. Without this the version goes stale
 * on the next release, which is worse than omitting it -- and stale is exactly
 * what happened to the examples, which were still announcing "RetroCSS v1.0" at
 * 4.0.
 *
 * Two things are synced:
 *   1. "softwareVersion" in index.html's JSON-LD.
 *   2. Every <span data-version> across the site. Marking them up rather than
 *      hunting for version-shaped strings means a new one is picked up for
 *      free, and nothing else can be rewritten by accident.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const PAGES = [
  'index.html',
  'documentation.html',
  'examples/index.html',
  'examples/dashboard.html',
  'examples/blog.html',
  'examples/blog-post.html',
  'examples/login.html',
  'examples/register.html',
  'examples/theme-matrix.html',
  'examples/rtl.html',
];

const JSON_LD = /("softwareVersion":\s*")[^"]*(")/;
// Non-greedy, and anchored on the attribute, so only the marked spans move.
const SPAN = /(<span[^>]*\bdata-version\b[^>]*>)[^<]*(<\/span>)/g;

let changed = 0;
let sawJsonLd = false;

for (const file of PAGES) {
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    console.error(`sync-version: ${file} is listed but missing`);
    process.exit(1);
  }

  let next = html;
  if (JSON_LD.test(next)) {
    sawJsonLd = true;
    next = next.replace(JSON_LD, `$1${version}$2`);
  }
  next = next.replace(SPAN, `$1${version}$2`);

  if (next !== html) {
    writeFileSync(file, next);
    console.log(`sync-version: ${file} -> ${version}`);
    changed += 1;
  }
}

// The JSON-LD field is the one Google reads; losing it silently is the failure
// this script was written to prevent, so treat its absence as an error.
if (!sawJsonLd) {
  console.error('sync-version: no "softwareVersion" field found in any page');
  process.exit(1);
}

if (!changed) console.log(`sync-version: already ${version}`);
