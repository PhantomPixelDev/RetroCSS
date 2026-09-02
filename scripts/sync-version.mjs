#!/usr/bin/env node
/**
 * Copies the package version into index.html's JSON-LD.
 *
 * Wired to the npm `version` lifecycle, so `npm version <x>` updates the
 * markup in the same step that bumps package.json. Without this the
 * softwareVersion in the structured data goes stale on the next release,
 * which is worse than omitting it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const file = 'index.html';
const html = readFileSync(file, 'utf8');

const pattern = /("softwareVersion":\s*")[^"]*(")/;
if (!pattern.test(html)) {
  console.error(`sync-version: no "softwareVersion" field found in ${file}`);
  process.exit(1);
}

const next = html.replace(pattern, `$1${version}$2`);
if (next !== html) {
  writeFileSync(file, next);
  console.log(`sync-version: ${file} -> ${version}`);
} else {
  console.log(`sync-version: already ${version}`);
}
