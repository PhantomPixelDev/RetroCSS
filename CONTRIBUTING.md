# Contributing

Thanks for looking. RetroCSS is a small framework with an unusual constraint:
it has to look like Windows 95 and behave like a modern component library at
the same time. Most review questions come down to one of those two.

## Getting set up

```bash
npm ci
npm run build
npm test
```

`npm ci` rather than `npm install` — the lockfile is committed and builds
should be reproducible.

## The gates

Five checks run on every push, and all of them run before a release publishes.
Run them locally before opening a pull request:

```bash
npm test && npm run check:a11y && npm run check:css && npm run check:pages && npm run check:keyboard
```

| Gate | What it protects |
| --- | --- |
| `npm test` | jsdom unit suite over the built bundle — the fast loop |
| `check:a11y` | every `var(--retro-*)` resolves; every text/surface pair clears WCAG AA in both themes |
| `check:css` | nothing hardcodes a corner behind `--retro-border-radius`; no shadow or scrim built from a token that inverts; no component class ships undemonstrated; no raw control bytes in the sources |
| `check:pages` | every page in the repo, both themes, five widths: no console errors, no overflow, one `h1`, rendered text clears AA, input glyphs centred, and the first paint is already the right theme |
| `check:keyboard` | every control the framework drives is reachable and named; roving-tabindex groups expose one tab stop; tooltips appear on focus; no unnamed form control |

`check:pages` and `check:keyboard` need Chromium once:
`npx playwright install chromium`.

Each gate exists because something shipped broken. If one fails, it has
probably found a real problem — read the message before adding an exception.
Exceptions are allowed, but every entry in an `ALLOW` list needs a comment
saying why.

## House style

- **Comment the why, not the what.** The code says what it does. A comment
  earns its place by explaining a decision, a constraint, or a bug that a
  future reader would otherwise reintroduce.
- **Measure before claiming.** If a change fixes a rendering problem, verify it
  in a browser rather than reasoning about the cascade.
- **Tokens, not values.** New colours go through the four-tier system (fill,
  `-fg`, `-text`, `-hover`/`-active`); corners go through
  `--retro-border-radius`; shadows and scrims use the fixed lighting tokens,
  never `--retro-black-rgb`, which inverts.
- **Every control is a control.** If script drives it, it needs to be in the
  tab order with an accessible name. A `<div>` with a click handler is a bug.

## Adding a component

1. Add the SCSS partial under `src/scss/components/` and import it in
   `src/scss/retro.scss`.
2. Demonstrate it on `index.html`. `check:css` fails on a class that ships
   without appearing on a page, which keeps the demo honest.
3. If it needs JavaScript, guard the binding with `bindOnce` from
   `src/js/util/bind.js` so `init()` stays idempotent.
4. Add a unit test for the logic and let the browser gates cover the rendering.

## Commits and releases

Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`). Releases are cut
with `npm version <patch|minor|major>`, which syncs the version into the pages,
and pushing the tag triggers the publish workflow — which re-runs every gate
before it publishes.
