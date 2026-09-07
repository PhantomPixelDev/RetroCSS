# Changelog

Notable changes per release. Breaking changes and how to handle them are in
[MIGRATION.md](MIGRATION.md); this file is the shorter view.

Versions follow [semver](https://semver.org): a major changes something you can
observe, a minor adds, a patch fixes.

## 5.0.0

**Fixed**

- Sortable table headers rendered a control character followed by `95` instead
  of a ↕ arrow. Three escapes in `_table.scss` had been mangled into raw control
  bytes, and it shipped for the whole 4.0 line. `check:css` now fails on any
  control byte in the SCSS sources.
- `RetroCSS.init()` re-registered roughly 250 listeners on every call — 66
  `blur`, 46 `keydown`, 44 `click`, 29 `focus`, 28 `mouseenter`, 28
  `mouseleave` — on elements that were already wired. It is documented as the
  entry point for re-initialising after a DOM change, so an app calling it per
  route accumulated them. A repeat `init()` now registers **zero**.
- Every `[data-retro-toast]` trigger fired one toast per `init()` call, so a
  page initialised three times showed three toasts on one click.
- Nested dialogs restored focus to the wrong element: a single `_lastFocused`
  slot could not describe a dialog opened from a dialog. It is a stack now.
- Dismiss controls (`.retro-alert-close`, `.retro-toast-close`) rendered 22×20
  and now meet the 24px target WCAG 2.5.8 asks for.
- Buttons placed directly in a `.retro-form` stretched the full width of the
  form, because the form is a flex column. They sit at their natural width;
  `.retro-w-full` still wins.

**Changed (breaking)**

- `RetroCarousel` and `RetroAccordion` are objects with `init()`, matching every
  other module. `new RetroCarousel(el)` and `new RetroAccordion(sel)` no longer
  work; `RetroCarousel.init()` is how the demos and documentation always called
  them. See MIGRATION.
- `sassdoc` and the `docs:api` script are gone. It was unmaintained since 2022,
  its output was never published, and it accounted for all 11 advisories in the
  dependency tree. The `///` comments stay in the source. The tree now reports
  **zero** vulnerabilities.

**Infrastructure**

- `package-lock.json` is committed and CI uses `npm ci`, so builds are
  reproducible and dependency drift is visible.
- The publish workflow runs the unit tests and all four gates before publishing.
  Previously a tag built and published without any gate seeing the commit.
- 36 unit tests, up from 16: modal focus management (trap, `inert`, restore,
  nesting), `init()` idempotence, dropdown keyboard navigation, and table
  sorting including the numeric sniff and `data-sort="none"`.

## 4.0.0

Packaged for bundlers: ESM, CJS and TypeScript definitions behind an `exports`
map, safe to import during server-side rendering. Added right-to-left support
via logical properties — the Win9x bevels deliberately do not mirror. Fixed a
white modal scrim in dark mode, accordions double-binding on every dynamically
added accordion, and ~70 lines of dead mobile-drawer CSS.

## 3.1.1

Removed the theme flash. The dark palette ships under `prefers-color-scheme` as
well as `[data-theme]`, so a dark-OS visitor is painted dark on the first frame
rather than after the bundle parses.

## 3.1.0

Made every control the JavaScript drives keyboard-operable: rating stars became
a radiogroup, carousel dots became buttons, tooltips appear on focus, tag
removes became buttons, tabs gained a roving tabindex. Completed the
`--retro-border-radius` token so one declaration rounds the whole framework.
Dark mode began following the operating system.

## 3.0.1

Returned the framework to square. Dropping the `!important` from the radius
reset in 3.0.0 woke 31 dormant declarations and rounded eleven components,
including 999px nav pills.

## 3.0.0

Body text to 16px, and `border-radius: 0` is no longer `!important` — both
visible on every page, each with a one-line override.

## 2.8.1

Repaired the shipped bundle. `window.RetroCSS` was the ESM namespace rather than
the object, so every documented `RetroCSS.*` call was a TypeError. Stopped the
search bar overwriting the host page's own markup.

## 2.5.0 – 2.8.0

The Win9x grey-chassis dark theme and a retuned text ramp; SEO metadata,
structured data and one `h1` per page; badges stopped shouting; the input glyph
was centred on its field; example pages stopped fighting the framework with
their own CSS.

## 2.0.0

The readability pass: a four-tier colour token system, and WCAG AA across both
themes with a CI gate asserting it.
