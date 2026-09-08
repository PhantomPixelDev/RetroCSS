<div align="center">

# 🖥️ RetroCSS

**A Win9x-style CSS framework that brings the mid-90s desktop look to modern web applications.**

[![npm version](https://img.shields.io/npm/v/%40phantompixeldev%2Fretrocss?style=flat-square&color=0047AB&label=npm)](https://www.npmjs.com/package/@phantompixeldev/retrocss)
[![npm downloads](https://img.shields.io/npm/dm/%40phantompixeldev%2Fretrocss?style=flat-square&color=00A86B)](https://www.npmjs.com/package/@phantompixeldev/retrocss)
[![bundle size](https://img.shields.io/bundlejs/size/%40phantompixeldev%2Fretrocss?style=flat-square&label=bundle%20size)](https://bundlejs.com/?q=%40phantompixeldev%2Fretrocss)
[![npm unpacked](https://img.shields.io/npm/unpacked-size/%40phantompixeldev%2Fretrocss?style=flat-square&label=size&color=9cf)](https://www.npmjs.com/package/@phantompixeldev/retrocss)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/%40phantompixeldev%2Fretrocss?style=flat-square&label=jsDelivr%20hits&color=FF6B00)](https://www.jsdelivr.com/package/npm/@phantompixeldev/retrocss)
[![GitHub stars](https://img.shields.io/github/stars/PhantomPixelDev/RetroCSS?style=flat-square&color=FFD700)](https://github.com/PhantomPixelDev/RetroCSS/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/PhantomPixelDev/RetroCSS?style=flat-square&color=FF6B6B)](https://github.com/PhantomPixelDev/RetroCSS/issues)
[![license](https://img.shields.io/github/license/PhantomPixelDev/RetroCSS?style=flat-square&color=lightgrey)](https://github.com/PhantomPixelDev/RetroCSS/blob/main/LICENSE)
[![last commit](https://img.shields.io/github/last-commit/PhantomPixelDev/RetroCSS?style=flat-square&color=8A2BE2)](https://github.com/PhantomPixelDev/RetroCSS/commits/main)

**[📺 Live Demo](https://phantompixeldev.github.io/RetroCSS/) • [📖 Documentation](https://phantompixeldev.github.io/RetroCSS/documentation.html) • [📦 npm](https://www.npmjs.com/package/@phantompixeldev/retrocss) • [💻 GitHub](https://github.com/PhantomPixelDev/RetroCSS)**

</div>

---

## Features

- **Authentic Win9x chrome** — raised and sunken bevels, square corners, and a
  grey chassis, down to the light source sitting at the top-left.
- **Dark mode that follows the OS.** The dark palette ships under
  `prefers-color-scheme` as well as `[data-theme]`, so a dark-OS visitor is
  painted dark on the first frame with no flash. Using the toggle stores an
  explicit choice, which then wins.
- **WCAG AA in both themes, enforced.** All 370 text/surface pairs the
  framework produces are checked on every push, as is every rendered page.
- **Keyboard-operable.** Every control the JavaScript drives is in the tab
  order with an accessible name — carousel dots, rating stars, tag removes,
  sortable headers — and tooltips appear on focus, not only on hover.
- **Right-to-left.** Set `dir="rtl"` and the layout mirrors. The bevels
  deliberately do not, because Windows does not mirror them either.
- **One token rounds everything.** `--retro-border-radius` is `0` by default;
  set it once and the whole framework follows.
- **Ships ESM, CJS and TypeScript types** behind an `exports` map, and is safe
  to import during server-side rendering.
- **Data attribute API** for modals, toasts, tooltips and dropdowns — no
  JavaScript required to use them.
- **No runtime dependencies.** ~21 KB of CSS and ~8 KB of JavaScript, gzipped,
  and the JavaScript is optional.

## Installation

### NPM

```bash
npm install @phantompixeldev/retrocss
```

### CDN

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phantompixeldev/retrocss/dist/retro.min.css">

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/@phantompixeldev/retrocss/dist/retro.min.js"></script>
```

### With a bundler

The package ships ESM, CJS and a browser IIFE behind an `exports` map, so a
bare import resolves to JavaScript and the stylesheet has its own entry point.

```js
// JavaScript
import RetroCSS from '@phantompixeldev/retrocss';        // ESM
const RetroCSS = require('@phantompixeldev/retrocss');    // CJS

// Styles — pick one
import '@phantompixeldev/retrocss/css';                   // full
import '@phantompixeldev/retrocss/css/min';               // minified
```

Importing the bundle is safe during server-side rendering: it touches no
browser global until the DOM exists, so Next, Remix and Astro can import it at
the top level.

### Sass

```scss
@use '@phantompixeldev/retrocss/scss' as retro;
```

### TypeScript

Type definitions ship in the package and are picked up automatically — there is
no `@types` package to install.

```ts
import RetroCSS, { RetroTheme, RetroHue } from '@phantompixeldev/retrocss';

const theme: RetroTheme = 'dark';   // 'light' | 'dark'
const hue: RetroHue = 'success';    // every hue with a full token set

RetroCSS.applyTheme(theme);
RetroCSS.toast.show('Saved', { type: hue, duration: 0 });
```

### Download

Download the latest release from GitHub and include the CSS and JS files in your project:

```html
<link rel="stylesheet" href="path/to/retro.min.css">
<script src="path/to/retro.min.js"></script>
```

## Usage

RetroCSS provides a wide range of components and utilities to build retro-styled interfaces:

```html
<div class="retro-card">
  <div class="retro-card-header">System Properties</div>
  <div class="retro-card-content">
    <p>Welcome to RetroCSS!</p>
    <button class="retro-btn retro-btn-primary">OK</button>
  </div>
</div>
```

See the [documentation](https://phantompixeldev.github.io/RetroCSS/documentation.html) for detailed usage instructions and examples.

### Example Pages

Complete pages built from the framework and nothing else — no per-page
component CSS. Every one is checked in CI at five widths in both themes.

**[Browse them all](https://phantompixeldev.github.io/RetroCSS/examples/)**

| Example | What it shows |
| --- | --- |
| [Dashboard](https://phantompixeldev.github.io/RetroCSS/examples/dashboard.html) | Application shell: sidebar, stat tiles, activity feed |
| [Blog](https://phantompixeldev.github.io/RetroCSS/examples/blog.html) | Post listing, featured item, category badges |
| [Blog post](https://phantompixeldev.github.io/RetroCSS/examples/blog-post.html) | Long-form prose, pull quote, code block, comments |
| [Sign in](https://phantompixeldev.github.io/RetroCSS/examples/login.html) | Compact auth form with a show-password toggle |
| [Sign up](https://phantompixeldev.github.io/RetroCSS/examples/register.html) | Longer form with live password requirements |
| [Right-to-left](https://phantompixeldev.github.io/RetroCSS/examples/rtl.html) | The same components under `dir="rtl"` |
| [Theme matrix](https://phantompixeldev.github.io/RetroCSS/examples/theme-matrix.html) | Every hue on every surface, both themes |

## JavaScript Architecture & Data Attribute API

RetroCSS uses a modular JavaScript architecture with ES modules. All interactive components can be triggered via JavaScript or data attributes:

```javascript
// Import all components (bundled version)
import RetroCSS from '@phantompixeldev/retrocss';

// Initialize all components
RetroCSS.init();

// Use individual components
RetroCSS.modal.show('myModal');
RetroCSS.toast.show('Hello World', { type: 'success' });
```

**Data Attribute API Example:**

```html
<!-- Show a toast on click -->
<button data-retro-toast="Hello from RetroCSS!">Show Toast</button>

<!-- Show a modal on click -->
<button data-retro-modal="myModal">Open Modal</button>
```

## HTML Toasts

Show toast notifications with rich HTML content:

```html
<button 
  data-retro-toast="<b>Custom Toast</b><br>With <i>HTML</i> content!" 
  data-retro-toast-html>
  Show Custom Toast
</button>
```

Or via JavaScript:

```javascript
RetroCSS.toast.show('<b>Custom Toast</b><br>With <i>HTML</i> content!', { html: true });
```

> **Note:** Only use trusted HTML for toasts. HTML toasts get a `.retro-toast-html` class for custom styling.

## Customization

RetroCSS is customized through CSS variables, organised in four tiers per colour.
Picking the right tier matters: a value tuned as a background is usually unreadable
as text.

| Token | Role |
| --- | --- |
| `--retro-primary` | **Fill** — background of a filled badge, button or alert |
| `--retro-primary-fg` | **On-fill** — text placed *on* that fill |
| `--retro-primary-text` | **On-surface** — that hue used as text on a page background |
| `--retro-primary-hover` / `-active` | **States** — fill under `:hover` / `:active` |

All four exist for every hue (`primary, success, danger, warning, info, teal, tan,
pink, lime, cyan, orange, brown, violet, gray, maroon, gold, navy, olive, silver`).
Every pair clears WCAG AA (4.5:1) in both themes — `npm run check:a11y` verifies it.

```css
:root {
  --retro-primary: #0000aa;       /* fill */
  --retro-primary-fg: #ffffff;    /* text on that fill */
  --retro-primary-text: #000080;  /* that hue as text on a page background */
  --retro-body-bg: #c0c0c0;       /* page */
  --retro-bg: #ffffff;            /* raised surface */
  --retro-text: #000000;
  --retro-text-muted: #4b4b4b;
}

/* Dark mode */
[data-theme="dark"] {
  --retro-body-bg: #181818;
  --retro-primary: #4a90e2;
  --retro-primary-fg: #000000;    /* dark fills are light, so black sits on top */
  --retro-primary-text: #4b91e2;
}
```

Typography is tokenised the same way: `--retro-font`, `--retro-font-heading`,
`--retro-font-mono`, a `rem`-based `--retro-font-size-xs` … `-3xl` scale,
`--retro-line-height` and `--retro-font-weight-*`. Headings use the body stack by
default; for a modern heading font, set
`--retro-font-heading: 'Segoe UI', Tahoma, sans-serif;`.

Corners are square, because Windows 95 was. Every component routes its corners
through one token, so a single declaration rounds the whole framework —
buttons, cards, badges, inputs, navs and the rest together:

```css
:root { --retro-border-radius: 6px; }
```

`.retro-rounded` / `-lg` / `-full` still round one element at a time. Three
things keep their shape on purpose: `.retro-nav-pills` and `.retro-tag`, which
are named for it, and `.retro-badge-pixel`, whose whole point is being square.
Radio buttons and the spinner are circles, as they are in Windows. Tables stay
square because `border-collapse: collapse` — what merges their cell borders
into a single hairline — makes every engine ignore `border-radius`.

### Right-to-left

Set `dir="rtl"` and the layout mirrors. Spacing, text alignment and start/end
positioning use logical properties, so there is nothing to import and no
separate stylesheet.

```html
<html lang="ar" dir="rtl">
```

The bevels deliberately do **not** mirror. In the Win9x visual language the
light source is fixed at the top-left, and Windows keeps it there in RTL;
flipping the raised and sunken edges would make every button read as sunken on
the wrong side. Only the semantic accents move — an alert's stripe, a
blockquote's rule — because those mark where a line of text begins. See the
[RTL example](https://phantompixeldev.github.io/RetroCSS/examples/rtl.html).

Dark mode follows the operating system when the visitor has expressed no
preference of their own. The moment they use a `.retro-theme-toggle`, that
choice is stored and outranks the OS from then on.

This is done in CSS, not script — the dark palette is emitted both for
`[data-theme="dark"]` and under `@media (prefers-color-scheme: dark)` for
`:root:not([data-theme="light"])` — so a dark-OS visitor gets the right colours
on the very first paint, with no flash, even before the bundle loads.

The one case CSS cannot see is a *stored* choice that differs from the OS.
Add this to your `<head>` to cover it. It must be inline: an external or
`defer`red script runs after the first paint, which is the whole problem.

```html
<script>
  try {
    var retroTheme = localStorage.getItem('retro-theme');
    if (retroTheme) document.documentElement.setAttribute('data-theme', retroTheme);
  } catch (e) {}
</script>
```

> **Upgrading?** See [MIGRATION.md](https://github.com/phantompixeldev/retrocss/blob/main/MIGRATION.md).
> No class has ever been renamed. **6.0** changes three visual defaults and no
> API: `--retro-danger` is `#cc0000` with white text on it (it was `#ff0000`
> with black), the progress label sits on a plate so it survives a saturated
> bar, and the sidebar is drawn as a raised panel with a title bar. Each one is
> a one-line revert. **4.0** moves the package's main entry from a
> CSS file to JavaScript and adds an `exports` map — every existing deep path
> still resolves — and `--retro-border-radius` now reaches the core chrome, so
> if you had already set it, more will round than before. **3.0** raises the
> body text to 16px and drops the `!important` from the `border-radius` reset,
> both visible on every page, each with a one-line override. **On 3.0.0,
> upgrade to 3.0.1**: dropping that `!important` woke 31 dormant radius
> declarations and rounded eleven components. 2.0 restyled a few things to meet
> WCAG AA.

## Utilities

Atomic helpers driven by the same tokens as the components, all `retro-` prefixed.

| Group | Classes |
| --- | --- |
| Layout | `retro-main-layout`, `retro-flex`, `retro-flex-col`, `retro-flex-1`, `retro-items-center`, `retro-justify-between` |
| Spacing | `retro-m{t,b,l,r,x,y}-0…8`, `retro-p…`, `retro-gap-0…8`, `retro-mx-auto` (0, 4, 8, 12, 16, 24, 32, 40, 48px) |
| Sizing | `retro-w-full`, `retro-max-w-full`, `retro-max-w-prose`, `retro-max-w-{sm…xxl}` |
| Colour | `retro-bg-<hue>`, `retro-bg-<hue>-subtle`, `retro-text-<hue>`, `retro-border-<hue>` |
| Effects | `retro-raised`, `retro-sunken`, `retro-shadow-{sm,md,lg}`, `retro-rounded` |

`retro-bg-<hue>` sets the fill **and** its matching on-fill text colour, so a filled
panel is legible in both themes from a single class:

```html
<div class="retro-bg-primary retro-p-4">Readable in both themes</div>
<div class="retro-bg-success-subtle retro-p-4">Tinted callout</div>
```

Pick the tier by role: `retro-bg-*` to fill a surface, `retro-text-*` for text sitting
on a page surface. Putting an on-surface colour inside a filled panel paints the hue
on itself — that is the one combination to avoid.

## Accessibility

Every text/surface pair the framework produces clears WCAG AA (4.5:1) in both
themes. `npm run check:a11y` compiles the SCSS and asserts it, and fails the
build on a regression — it also catches any `var(--retro-*)` that resolves to
nothing.

That proves the *tokens* are sound. `npm run check:pages` proves the *pages*
are: it renders every page in the repo in real Chromium, in both themes, at
1200/980/760/420/360px, and fails on a console error, horizontal overflow, a
missing or duplicated `<h1>`, any rendered text below AA against the surface
actually painted behind it, or an input glyph off its field's centre line.

Neither can see whether a control can be *reached*, so `npm run check:keyboard`
asserts that too: every control the framework drives from script is in the tab
order and carries an accessible name, no form control ships without one,
roving-tabindex groups expose exactly one tab stop, and every tooltip appears on
focus and not only on hover. `npm run check:css` gates the stylesheet itself,
and `npm test` is a jsdom unit suite. All five run in CI on every push.

Beyond colour:

- **Focus rings are `:focus-visible`.** Keyboard and assistive-tech users get a
  ring; mouse clicks do not. Text inputs still show one on click, because
  browsers treat their focus as visible.
- **Modals are keyboard-safe.** Opening one sets `role="dialog"`,
  `aria-modal`, and names it from its header; focus moves inside and is trapped
  there, the rest of the page is made `inert`, and closing returns focus to
  whatever opened it.
- **Dropdowns are navigable.** `aria-haspopup` / `aria-expanded` on the toggle,
  `role="menu"` / `menuitem` on the menu, and Arrow / Home / End / Escape /
  Tab all behave. Escape returns focus to the toggle.
- **`prefers-reduced-motion` is honoured** — every animation and transition is
  neutralised, with the looping text effects switched off outright.
- **Sortable tables are operable.** `.retro-table-sortable` headers are
  focusable, sort on Enter and Space as well as click, and carry `aria-sort`.
  Add `data-sort="none"` to a column that should not sort.
- **Rating stars are a radiogroup.** Tab reaches the group, Arrow keys move and
  set the value, Home/End jump to the ends, and each star reports `aria-checked`.
- **Carousels are keyboard-driven.** Dots are real buttons with labels and
  `aria-current`; Left/Right arrows move between slides once focus is inside.
- **Tooltips appear on focus,** not only on hover, are dismissible with Escape,
  and are wired to their trigger with `aria-describedby` (WCAG 1.4.13).
- **Tabs use a roving tabindex.** Tab steps over the tablist into the panel;
  Arrow keys, Home and End move between tabs.
- **Dismiss controls meet the 24px target** WCAG 2.5.8 asks for. Inline text
  links are exempt, and the `-xs` / `-sm` button variants are opt-in.
- **`.retro-sr-only`** labels icon-only controls; `.retro-sr-only-focusable`
  gives you a skip link. Use it — not `.retro-hidden` — to hide a real form
  control you still want reachable, such as a styled `<input type="file">`:
  `display: none` takes it out of the tab order entirely.

```html
<button class="retro-btn">💾<span class="retro-sr-only">Save</span></button>
```

## Browser Support

RetroCSS supports all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Development

Clone the repository:

```bash
git clone https://github.com/phantompixeldev/retrocss.git
cd retrocss
npm install
```

Build the project:

```bash
npm run build
```

Watch for changes:

```bash
npm run watch
```

Run the gates:

```bash
npm test && npm run check:a11y && npm run check:css && npm run check:pages && npm run check:keyboard
```

`npm test` is the fast loop — a jsdom unit suite over the built bundle.
`check:a11y` gates the tokens (every `var(--retro-*)` resolves, every
text/surface pair clears WCAG AA), `check:css` gates the stylesheet statically
(nothing hardcodes a corner behind `--retro-border-radius`, nothing builds a
shadow or scrim from a token that inverts between themes, and no component
class ships without appearing on a page), `check:pages` gates the
rendered result across 10 pages × 2 themes × 5 widths — including that the first
paint is already the right theme with the bundle blocked, so a theme flash fails
the build — and `check:keyboard` gates operability: that every control the
framework drives can be reached and named, that roving-tabindex groups expose
exactly one tab stop, and that no form control ships without an accessible
name.

`check:pages` and `check:keyboard` need a browser once: `npx playwright install chromium`.

The SCSS carries SassDoc `///` comments throughout. The `sassdoc` renderer
was dropped in 5.0: unmaintained since 2022, its output was never published,
and it accounted for every security advisory in the dependency tree.

## Trademarks

RetroCSS imitates the visual style of mid-1990s desktop software. It is an
independent project, **not affiliated with, sponsored by, or endorsed by
Microsoft**. Windows is a trademark of Microsoft Corporation, named in this
documentation only to describe the look the framework reproduces. No Microsoft
artwork, icon, font or code is included.

## License

MIT
