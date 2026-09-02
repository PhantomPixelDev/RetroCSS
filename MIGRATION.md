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
