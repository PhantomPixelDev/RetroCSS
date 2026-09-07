# Migrating to RetroCSS 4.x

## 4.0 — packaging, RTL, and three fixed bugs

### Breaking: the package entry point is now JavaScript

`main` pointed at `dist/retro.css`, so `require('@phantompixeldev/retrocss')`
returned a stylesheet and `import RetroCSS from '@phantompixeldev/retrocss'`
did not work at all — despite the source having had `export default` for
years. The package now ships real ESM and CJS builds behind an `exports` map:

```js
import RetroCSS from '@phantompixeldev/retrocss';        // ESM
const RetroCSS = require('@phantompixeldev/retrocss');    // CJS
import '@phantompixeldev/retrocss/css';                   // stylesheet
import '@phantompixeldev/retrocss/css/min';               // minified
@use '@phantompixeldev/retrocss/scss' as retro;           // Sass source
```

**If you imported the package for its CSS**, change that import to
`@phantompixeldev/retrocss/css`. Every deep path that worked before still
works — `.../dist/retro.min.css` and friends are mapped explicitly — so only
the bare specifier changed.

TypeScript definitions ship at `dist/retro.d.ts` and are picked up
automatically. The bundle is also SSR-safe now: importing it from Next, Remix
or Astro no longer throws `ReferenceError: window is not defined`.

### Fixed: the modal backdrop was a white scrim in dark mode

`rgba(var(--retro-black-rgb), 0.6)` rendered as `rgba(255,255,255,0.6)` in
dark, washing the page out instead of dimming it. Three tokens are fixed in
both themes now — `--retro-shadow-rgb`, `--retro-scrim-rgb` and
`--retro-sheen-rgb` — and a CI gate rejects any shadow, scrim or gloss built
from a token that inverts. `.retro-heading-variant`'s drop shadow had the same
bug and is fixed with it.

### Fixed: accordions broke when one was added dynamically

`RetroAccordion.init` re-bound every toggle on the page each time a new
accordion appeared, so after one addition a click opened *and* closed an item.
Binding is idempotent now, and the observer only walks the added subtree.

### Right-to-left support

Spacing, text alignment and start/end positioning use logical properties, so
`dir="rtl"` mirrors the layout. **The Win9x bevels deliberately do not
mirror** — the light source is fixed at the top-left, as it is in Windows
itself. See `examples/rtl.html`. LTR rendering is unchanged.

### Removed

- `.retro-sidebar-toggle`, `.retro-sidebar-toggle-icon` and
  `.retro-sidebar-overlay` — a mobile drawer with no JavaScript behind it, and
  a later rule in the same file set `display: none` on all of it anyway. On
  narrow screens the sidebar stacks above the content, as it already did.
- `.retro-tab`, `.retro-tab-list` and `.retro-nav-tabs` — orphaned styling for
  markup nothing used. Tabs are `.retro-nav-tabbed` with `.retro-tab-content`
  panes, which is what every example and `tabs.js` already used.

### Newly documented, not new

Several components already had size and layout modifiers that appeared on no
page: `.retro-btn-block`, `.retro-input-sm` / `-lg`, `.retro-card-compact` /
`-image`, `.retro-form-inline` / `-horizontal`, the progress bar variants,
`.retro-modal-lg` / `-xl` / `-scroll`, and the `data-tooltip-position` /
`data-tooltip-variant` attributes. They are demonstrated on the home page now,
and a CI gate fails the build if a component class ships without appearing
anywhere.

---

# Migrating to RetroCSS 3.x

## 3.1 — keyboard access, OS dark mode, and the rest of the radius token

Additive. Nothing was renamed and no class removed; existing markup keeps
working, because the fixes are applied by the JavaScript at init time rather
than by requiring new HTML. Three things are worth knowing:

**Dark mode now follows the operating system.** Previously the default was a
hardcoded `light`, so a visitor whose system was set to dark got a light page
until they found the toggle — on a framework that ships a full dark theme. Now
an explicit choice (anything stored under `retro-theme`) still wins; only when
there is none does `prefers-color-scheme` decide. To keep the old behaviour,
store a theme yourself before `RetroCSS.init()`:

```js
localStorage.setItem('retro-theme', 'light');
```

The palette itself is applied in CSS, so there is **no theme flash**: the dark
tokens are emitted both for `[data-theme="dark"]` and, under
`@media (prefers-color-scheme: dark)`, for `:root:not([data-theme="light"])`.
A dark-OS visitor is painted dark before a line of JavaScript runs.

Two consequences:

- `applyTheme('light')` now writes `data-theme="light"` instead of *removing*
  the attribute. It has to: on a dark OS the attribute is the only thing that
  can hold a deliberate light choice in place. If you keyed any CSS off
  `:root:not([data-theme])` to mean "light", match `[data-theme="light"]`
  instead.
- To also cover a *stored* choice that differs from the OS — the one case CSS
  cannot see — add the inline `<head>` snippet documented in the README. Every
  page in this repo now ships it.

**`--retro-border-radius` now reaches the whole framework.** 3.0.1 wired 31
components to the token; the core chrome — card, button, badge, nav, progress,
alert, input, checkbox, accordion — still hardcoded `0`, so setting the token
rounded dropdowns but left buttons square. All of it follows the token now. The
default is unchanged (the token is `0`); but if you had already set
`--retro-border-radius`, more of the framework will round than before.

**Interactive components gained roles and keyboard handling.** Rating stars are
a `radiogroup` of `radio`s, carousel dots are `button`s with `aria-current`,
tooltips appear on focus and carry `aria-describedby`, tag removes are
`button`s, and tabs use a roving tabindex. If you styled any of these by tag
name (`span.retro-tag-remove`, `div.retro-carousel-dot`), switch to the class —
newly generated ones are `<button>`. If you hid a file input with
`.retro-hidden`, switch to `.retro-sr-only`: `display: none` removes it from the
tab order, leaving no keyboard route to the file picker.

---

# Migrating to RetroCSS 3.0

3.0 is a visual release. Nothing was renamed and no class was removed, but two
changes are visible on every page that consumes the framework, so they are
called out first.

> **If you are on 3.0.0, upgrade to 3.0.1.** 3.0.0 shipped a regression that
> rounded eleven components. See [section 2](#2-border-radius-is-no-longer-important).

## 1. Body text is 16px

`--retro-font-size` moves from `0.875rem` (14px) to `1rem` (16px). The rest of
the scale is expressed in `rem` against the root, so headings, buttons, badges
and inputs all move with it.

14px is the authentic Win9x metric and 16px is not. The trade was made
deliberately: the framework is used to build things people read, and 14px is
below the size at which most people read comfortably. One line puts it back:

```css
:root { --retro-font-size: 0.875rem; }
```

Expect layouts that were tuned to the pixel at 14px to need a little room. If
you pinned a width in `px` to fit a specific string, it will now clip.

## 2. `border-radius: 0` is no longer `!important`

The reset was `* { border-radius: 0 !important }`, which meant nothing in a
consuming application could round a corner — including `.retro-rounded`, which
had to fight the reset, and `_modal.scss`, which needed its own `!important` to
get 4px back. The default is still square:

```css
* { border-radius: 0; }
```

If you were relying on the reset to flatten a third-party widget's corners,
that widget's own radius now wins, and you will need to zero it yourself.

### The 3.0.0 regression, fixed in 3.0.1

Dropping the `!important` had a consequence nobody caught: the reset had been
suppressing 31 hardcoded `border-radius` declarations scattered through the
components, written over the years by people who never saw them take effect.
All of them came alive at once. **3.0.0 renders these rounded**, and 3.0.1
returns them to square:

| Component | 3.0.0 | 3.0.1 |
| --- | --- | --- |
| `.retro-nav-pills .retro-nav-item` | 999px | 999px *(kept, see below)* |
| `.retro-tag` | 12px | 12px *(kept, see below)* |
| `.retro-list` / `.retro-list li` | 6px / 4px | 0 |
| `.retro-rating-star` | 6px | 0 |
| `.retro-tag-input`, `.retro-search-bar`, `.retro-file-upload`, `.retro-tooltip`, `.retro-sidebar`, `.retro-tab` | 4px | 0 |
| `.retro-breadcrumbs`, `.retro-dropdown-menu`, `.retro-pagination .retro-btn`, `.retro-divider-vertical` | 2px | 0 |

Those declarations now read `var(--retro-border-radius)`, which is `0` by
default. So the fix is not a second reversal — it is the radius system finally
being wired up. **You can round all of them at once:**

```css
:root { --retro-border-radius: 4px; }
```

`.retro-nav-pills` and `.retro-tag` keep their shapes deliberately: a pill and
a chip are the shapes those components are named for, and they are the one
place the framework spends a modern idiom on purpose.

Note that the core Win9x chrome — card, button, badge, table, input, modal,
alert, progress, carousel — sets `border-radius: 0` directly and does **not**
follow the token. Rounding those too is a change under consideration; if you
need it today, override them yourself.

`scripts/check-radius.mjs` now runs in CI and fails the build on any new
hardcoded radius, so this cannot recur.

### Radio buttons and the spinner are round again

The same reset had been squaring six declarations that were never chrome:
`.retro-radio` and its checked dot, `input[type="radio"].retro-input` and its
dot, `.retro-spinner`, and the `.retro-list` bullet. A Windows 95 radio button
is a circle, so squaring them was a long-standing bug. They are circular from
3.0.0 onward and stay that way. If you were relying on square radios, set
`border-radius: 0` on them yourself.

## 3. On-fill text follows the theme

If you built a component that pairs a RetroCSS hue fill with white text:

```css
/* before */
.my-chip { background: var(--retro-primary); color: var(--retro-white); }
```

...that pair breaks in dark mode. `--retro-white` inverts to `#3a3a3a` while
the fill *lightens* to `#4a90e2`, so both move and the contrast collapses —
this was measuring 3.45:1 on the framework's own active nav items. Use the
`-fg` token, which is defined as "text on this fill" and is contrast-gated in
both themes:

```css
/* after */
.my-chip { background: var(--retro-primary); color: var(--retro-primary-fg); }
```

The `--retro-black` / `--retro-white` pair is still fine *together* — both
invert, so a black chip with white text simply becomes a white chip with dark
text.

## 4. Tooltips are instant

`.retro-tooltip` toggles `display` rather than `opacity` + `visibility`, so the
0.2s fade is gone. This was not a style choice: a hidden tooltip kept its box in
the page's scrollable overflow region, so a `.retro-tooltip-right` on a trigger
near the viewport edge widened the whole page while invisible. Instant tooltips
are period-correct anyway.

If you were animating `.retro-tooltip` yourself, animate a child instead.

## Smaller changes

- **Nav variants and breadcrumbs wrap.** `.retro-nav-tabbed`,
  `.retro-nav-underlined`, `.retro-nav-buttons` and `.retro-breadcrumbs` were
  single unwrapped flex rows, so a long set of labels pushed the page sideways
  on narrow viewports. They wrap onto a second line now.
- **`.retro-nav-vertical`** is capped at `max-width: 100%`; it was sized to its
  longest label with `width: max-content`.
- **`.retro-alert-close`** inherits the alert's own text colour and no longer
  renders at `opacity: 0.7`.
- **Unfilled `.retro-rating-star`** uses `--retro-text-muted` instead of
  `--retro-border-dark`, which was invisible on the dark chassis.
- **`.retro-heading-variant`** drops its `letter-spacing`. Uppercase plus
  monospace already carries the emphasis.

## Removed

Everything here was already dead: unreachable, uninitialised, or compiling to
nothing. If you were using any of it, it was not doing what its name implied.

- **`window.RetroSidebar` / `src/js/sidebar.js`** — 234 lines that were bundled
  but never initialised. Wiring it in would have injected a toggle button and a
  full-screen overlay into every consuming page, hijacked every sidebar link
  with smooth scrolling and `history.pushState`, overwritten whichever link the
  author had marked `.active`, and bound an unthrottled `scroll` listener that
  re-queried `section[id], div[id]` across the whole document on every event.
  That is application logic, not framework logic. The CSS stays —
  `.retro-sidebar`, `.retro-sidebar-toggle` and `.retro-sidebar-overlay` are all
  still styled, so the same UI is a few lines of your own JS.
- **Eleven `@container` blocks** in `utilities/_container-queries.scss`:
  `.retro-cq-sm`, `-md`, `-lg`, `-xl`, `-wide`, `-tall`, `-landscape`,
  `-portrait`, `-size-sm`, `-size-md`, `-size-lg`. Every one had a comment for a
  body and compiled to nothing. The blocks with real declarations
  (`.retro-cq-hide`, `-show`, `-text-lg`, `-text-xl`, `-flex-row`, `-flex-col`,
  `-p-4`, `-p-6`, `-grid-2`, `-grid-3`) are untouched.
- **Five Sass mixins**: `retro-border`, `retro-hover`, `retro-active`,
  `retro-transition`, `retro-z-index`. None was called from anywhere in the
  framework. Their values are all reachable directly as custom properties —
  `--retro-border-dark`, `--retro-border-sunken`, `--retro-z-index-modal` and so
  on — which is what the components use. `retro-box-shadow`, `retro-focus`,
  `retro-focus-ring` and `retro-breakpoint` are still here.
- **Five devDependencies**: `concat-cli`, `copyfiles`, `mkdirp`, `onchange`,
  `uglify-js`. No script, workflow or config invoked any of them.

## New

- **Sortable tables actually work.** `.retro-table-sortable` had working JS and
  no styles, no markup anywhere in the repo, and no way to reach it from the
  keyboard. Headers are now focusable and respond to Enter and Space, carry
  `aria-sort`, and show a direction indicator. Columns are sniffed as numeric or
  text, or declared:

  ```html
  <table class="retro-table retro-table-sortable">
    <thead>
      <tr>
        <th>Name</th>
        <th data-sort="number">Size</th>
        <th data-sort="none">Actions</th>
      </tr>
    </thead>
    <tbody>...</tbody>
  </table>
  ```

  A cell can carry `data-sort-value` to sort a formatted value ("2 days ago",
  "$1,204.00") by what it means. The numeric sniff is deliberately strict: a
  loose `parseFloat` reads `2023-09-01` as `2023` and `SKU-001` as `-1`, which
  quietly sorts a date column by year and an ID column by the digits after the
  first dash.

- **Code blocks get a copy button.** `code-copy.js` was bundled but never
  initialised, so `.retro-code-copy` existed only in the stylesheet. It now runs
  from `RetroCSS.init()`. Outside a secure context, where
  `navigator.clipboard` is undefined, it selects the code and says
  `Press Ctrl+C` rather than failing silently.

- **`npm run docs:api`** renders the SassDoc blocks the SCSS has always carried
  to `docs/api/`. `sassdoc` was installed and never wired up.

## Verifying your own pages

`npm run check:pages` renders every page in the repo in real Chromium, in both
themes, at 1200/980/760/420/360px, and fails on console errors, horizontal
overflow, a missing or duplicated `h1`, contrast below AA on any rendered text,
or an input glyph off-centre. It is worth pointing at your own pages.

---

# Migrating to RetroCSS 2.0

2.0 is an accessibility and readability release. Nothing was renamed and no
class was removed — every 1.x class still works. What changed is how things
**look**, because a lot of 1.x was genuinely unreadable: `.retro-text-info`
measured 1.25:1 against white, and the `.keyword` colour in a dark-mode code
block measured 1.02:1.

Every text/surface pair the framework produces now clears WCAG AA (4.5:1) in
both themes. `npm run check:a11y` asserts it on every build.

## The one-line escape hatches

Most of the visual changes can be reverted with a custom property. Put these in
your own stylesheet, after RetroCSS:

```css
:root {
  /* Restore Segoe UI headings */
  --retro-font-heading: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  /* Restore white-on-red danger — but darken the fill so it still passes AA.
     White on pure #ff0000 is only 4.00:1. */
  --retro-danger: #cc0000;
  --retro-danger-fg: #ffffff;

  /* Restore the tighter 1.x body leading */
  --retro-line-height: 1.4;
}
```

## What changed, and why

### Colour tokens now come in four tiers

The 1.x palette did double duty: `--retro-info` was both the background of a
filled badge and the colour of `.retro-text-info`. Those two roles need
different values, which is why the text utilities were unreadable.

| Token | Role |
| --- | --- |
| `--retro-primary` | **Fill** — background of a filled badge, button, alert |
| `--retro-primary-fg` | **On-fill** — text placed *on* that fill |
| `--retro-primary-text` | **On-surface** — that hue used as text on a page background |
| `--retro-primary-hover` / `-active` | **States** — fill under `:hover` / `:active` |

All four exist for every hue: `primary, success, danger, warning, info, teal,
tan, pink, lime, cyan, orange, brown, violet, gray, maroon, gold, navy, olive,
silver`.

**The fill values are unchanged from 1.x.** If you overrode `--retro-primary`,
that still works exactly as before. What you may also want to override now is
the matching `-text` and `-fg`.

`--retro-black` and `--retro-white` still work and still invert between themes,
but `--retro-text` / `--retro-text-inverse` say what they mean. Prefer those.

### Visible changes

1. **`.retro-text-*` colours changed.** They now use the accessible `-text`
   ramp instead of the raw fill. This is the headline fix.
2. **Headings use the body font.** `h1`–`h6` were hardcoded to Segoe UI while
   `body` was MS Sans Serif. Override `--retro-font-heading` to get it back.
3. **`--retro-danger` filled components use black text.** White on `#ff0000` is
   4.00:1 and fails AA. See the escape hatch above.
4. **Inputs regained the Win9x bevel.** A rule in 1.x re-declared
   `border: 1px solid #b0b0b0; border-radius: 4px` over the tokenized 2px
   bevel, flattening every field and freezing its border at a light-mode hex.
5. **Focus rings use `:focus-visible`.** They no longer fire on mouse clicks.
   Text inputs still ring on click — browsers treat their focus as visible.
6. **Body line-height is 1.5** (was 1.4).
7. **Font sizes are a `rem` scale.** `html` was `16px` while `body` was `14px`
   in px, so every `em` in the framework measured against the wrong base and
   nested ems compounded. `--retro-font-size-*` keep their computed px values;
   `html` is now `font-size: 100%`, so the scale honours the reader's browser
   setting.
8. **Button line-heights normalized.** 1.x grew leading with size (1.2 → 1.7),
   making the xxl button needlessly tall. All sizes now share one value.
9. **Heading margins are a fixed rhythm** rather than `em`-relative, which had
   given `h1` a larger gap than `h6` — backwards for a hierarchy.
10. **`.retro-heading-*` render as the beveled gradient.** 1.x shipped two
    blocks defining these at the same specificity; the later flat-pastel one
    silently shadowed the gradient one. The gradient version survived.
11. **`.retro-toast` lost its hardcoded `#ffffcc`.** It was defined twice —
    once from light-only SCSS variables, once tokenized. The tokenized
    definition survived; it now follows the theme. Override
    `--retro-toast-bg` / `--retro-toast-text` if you want the yellow back.

### Behaviour changes

- **Modals are keyboard-safe.** Opening one sets `role="dialog"` and
  `aria-modal`, names it from its header, moves focus inside and traps it,
  makes the rest of the page `inert`, and restores focus on close. If you were
  relying on being able to Tab out of an open modal, that no longer happens.
- **Dropdowns respond to Arrow / Home / End / Escape / Tab**, and carry
  `aria-haspopup` / `aria-expanded` / `role="menu"` / `role="menuitem"`.
- **`[data-retro-modal]` triggers fire once.** 1.x bound both a delegated and a
  per-element click handler, so every trigger opened its modal twice.
- **`prefers-reduced-motion` is honoured.** Animations and transitions are
  neutralised; the looping text effects switch off entirely.

### Removed

- `--retro-letter-spacing`. Defined since 1.0, referenced by zero rules.
- The duplicate `.retro-toast` rule in `_base.scss` and the `$retro-toast-*`
  SCSS variables that fed it.
- Unreachable toast icon styles in `_alert.scss`, already dead behind
  `display: none !important`.

### Added

- `.retro-sr-only` and `.retro-sr-only-focusable` for labelling icon-only
  controls and building skip links.
- `.retro-prose` — an opt-in long-form container that caps the measure and
  opens up leading.
- `--retro-text`, `--retro-text-muted`, `--retro-text-inverse`,
  `--retro-font-heading`, `--retro-font-mono`, `--retro-font-size-xs`…`-3xl`,
  `--retro-line-height-tight`, `--retro-font-weight-*`, `--retro-measure`, and
  per-theme syntax-highlighting tokens.
- Fifteen custom properties that 1.x referenced in `var()` but never defined,
  so those declarations did nothing at all: `--retro-text-muted`,
  `--retro-shadow-light`, `--retro-font-weight-bold`, `--retro-primary-dark`,
  `--retro-gray-100`, `--retro-transition-base`,
  `--retro-box-shadow-outset-button` and others. Defining them means rules that
  were previously inert now render — the sidebar hamburger becomes visible,
  `.retro-text-bold` actually bolds, form validation rings appear, and dropdown
  hover works.
