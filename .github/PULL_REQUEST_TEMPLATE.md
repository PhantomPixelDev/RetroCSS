## What this changes

<!-- What behaviour differs afterwards, and why. -->

## How it was verified

<!-- Which gate covers it, or how you checked by hand. "Measured in a browser"
     beats "should work" -- several bugs in this repo's history were reasoning
     that turned out wrong. -->

- [ ] `npm test`
- [ ] `npm run check:a11y`
- [ ] `npm run check:css`
- [ ] `npm run check:pages`
- [ ] `npm run check:keyboard`

## Checklist

- [ ] New classes are demonstrated on a page (`check:css` enforces this).
- [ ] New colours go through the four-tier token system.
- [ ] Anything script-driven is keyboard-operable and named.
- [ ] New bindings use `bindOnce`, so `init()` stays idempotent.
- [ ] Breaking changes are noted in `MIGRATION.md` and `CHANGELOG.md`.
