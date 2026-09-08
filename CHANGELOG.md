# Changelog

Notable changes per release. Breaking changes and how to handle them are in
[MIGRATION.md](MIGRATION.md); this file is the shorter view.

Versions follow [semver](https://semver.org): a major changes something you can
observe, a minor adds, a patch fixes.

## 6.0.3

**Fixed**

- A dropdown menu could widen the page. Its items size to their longest label,
  and on a narrow viewport — or in RTL, where the menu opens toward the left
  edge — that pushed the document 35px past a 420px viewport and gave the page
  a horizontal scrollbar. The menu is capped at the viewport now, so the
  overflow happens inside it.

**Site**

- Every page on the site now carries the same chrome. The ten pages had three
  different navs — the home page and the docs had an Examples dropdown inside a
  centred shell, the seven examples had a flat link inside a full-bleed
  container, and the RTL page had four Arabic links inside its 900px content
  wrapper — and five different footer positions, from 322..1344 to a full-bleed
  0..1400. Nav, rule and footer are now one block at one width on all ten pages:
  56..1344 at a 1400px viewport, against a 40..1360 shell.
- `.example-footer` is drawn like `.site-footer` — same rule, same rhythm — so
  the examples stop looking like a different site from the one linking to them.
- Fixed an unclosed `.retro-main-layout` on the home page, which had swallowed
  the footer into the content column.

## 6.0.2

**Fixed**

- The current row in a sidebar nav lost its fill but kept its on-fill text
  colour, so a page marked with `aria-current` (or `.active`) rendered white
  text on the light panel at 1.14:1. 6.0.1 gave sidebar rows a transparent
  background at a specificity that outranked `.retro-nav-item`'s own state
  rules; the state is now restored at the same specificity. Caught by a
  consumer's contrast gate, not by this repo's: the demo pages set
  `aria-current` from a scroll observer, so nothing carries it at load.

## 6.0.1

**Fixed**

- The sidebar panel stretched to the full viewport (`height: calc(100vh - 32px)`),
  so a short contents list sat at the top of a tall empty box and a long one
  scrolled inside a panel that gave no sign it could. It is content-height now,
  capped at the viewport, and only scrolls when it would otherwise leave the
  screen.
- A panel that does scroll draws a Win9x scrollbar — square track, bevelled
  thumb, both from tokens — instead of the platform's thin modern overlay bar,
  which read as a piece of another operating system stapled inside a 1995
  window.
- A nav or a list inside the sidebar drew its own frame inside the panel's
  frame inside the column: three borders saying the same thing. The panel is
  the frame; its contents are separated by hairlines and by group bands bled to
  its edges.
- Sidebar rows were set at body size with the full nav padding, so a
  forty-link contents ran 1500px. They are list rows now.
- The title bar stays pinned while the panel scrolls, as a window's does.

**Site**

- The home page, the documentation and all eight examples share one
  `site.css`. They had a copy each of the same page CSS, which had drifted: the
  home page ran full-bleed while the docs were centred at 1320px, the heroes
  used different type scales, the footer was duplicated seven times and the
  whole sign-in layout twice. Every page now uses the same shell —
  `--retro-container-xxl` — and carries no inline style block at all.

## 6.0.0

Three things you can see, which is what makes this a major.

**Changed**

- **`--retro-danger` is `#cc0000`, and its on-fill text is white.** The fill was
  pure `#ff0000`, where white scores 4.00:1 and black 5.25:1 — so every danger
  button, badge, alert and toast carried *black* text. That passed the
  arithmetic and read like a label printed on a fire extinguisher. On `#cc0000`
  white scores 5.89:1. The hover and active states move with it. To keep the old
  pair: `:root { --retro-danger: #ff0000; --retro-danger-fg: #000; }`
- **The progress label carries a plate.** It straddles the filled bar and the
  empty track, which are always opposite in lightness, and a text-shadow halo
  was not enough: over the striped navy bar the glyphs and their fringe simply
  mixed. The label now sits on a small bordered plate in the track colour, so it
  is read against one known surface whatever is underneath it.
- **The sidebar is a panel, not a flat box.** It gets the framework's raised
  chassis, its header is a title bar painted like the one over a code block, a
  band that introduces a list is now the top of that list's box, and lists in a
  sidebar are framed like the navs beside them. One rhythm spaces the widgets,
  so a column of them stops reading as a pile of unrelated cards.

**Added**

- `[aria-current]` lights a `.retro-nav-item` the way `.active` does. Marking
  the current page the accessible way should not cost you the highlight.

**Documentation**

- A trademark notice. RetroCSS imitates the look of mid-1990s desktop software;
  it is independent, unaffiliated and unendorsed, and ships no Microsoft
  artwork, icon, font or code. Product-facing copy says Win9x or mid-90s
  desktop; the prose that explains how Windows itself behaved still names it,
  because that is what the sentences are about.

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
