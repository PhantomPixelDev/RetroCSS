/**
 * Shared plumbing for the browser-based gates (check-pages, check-keyboard).
 *
 * Both need the same three things: a static server over the repo, the list of
 * demo pages, and a page opened with the theme primed before any script runs.
 * They were duplicated once; a second copy is where they start to drift.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

export const PAGES = [
  'index.html',
  'documentation.html',
  'examples/dashboard.html',
  'examples/login.html',
  'examples/register.html',
  'examples/blog.html',
  'examples/blog-post.html',
  'examples/theme-matrix.html',
];

export const THEMES = ['light', 'dark'];

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.map': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain',
};

/** Serve the repo root on an ephemeral port. Returns { origin, close }. */
export async function serveRepo(root = process.cwd()) {
  const server = createServer(async (req, res) => {
    // Strip the query and normalise before joining, so a request cannot walk
    // out of the repo root.
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[/\\]+/, '');
    const path = join(root, rel || 'index.html');
    if (!path.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  const port = await new Promise((r) =>
    server.listen(0, '127.0.0.1', () => r(server.address().port)),
  );
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  };
}

/**
 * Prime the theme the way a returning visitor's localStorage would, so nothing
 * initialises against the wrong palette. addInitScript runs at document-start,
 * before the parser has created <html>, so documentElement is null on the first
 * tick -- hence the DOMContentLoaded re-apply.
 */
export async function primeTheme(tab, theme) {
  await tab.addInitScript((t) => {
    try {
      localStorage.setItem('retro-theme', t);
    } catch {
      /* storage blocked; the attribute below still applies */
    }
    const apply = () => document.documentElement?.setAttribute('data-theme', t);
    apply();
    document.addEventListener('DOMContentLoaded', apply);
  }, theme);
}

/**
 * Freeze transitions and animations. Theme tokens are transitioned, and
 * getComputedStyle during a transition returns the *animating* value -- which
 * made striped list rows report their light-theme background while the page
 * was already dark. Measuring a moving target is not a test.
 */
export async function freezeMotion(tab) {
  await tab.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
}
