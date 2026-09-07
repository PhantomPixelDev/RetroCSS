# Security

## Reporting

Report a vulnerability through
[GitHub's private advisory form](https://github.com/phantompixeldev/retrocss/security/advisories/new)
rather than a public issue. You should get an acknowledgement within a few days.

## Supported versions

The latest major receives fixes. Earlier majors do not.

## Scope

RetroCSS is a CSS framework with an optional JavaScript bundle. It has **no
runtime dependencies**, makes no network requests, and reads no storage beyond
one `localStorage` key (`retro-theme`, guarded so blocked storage cannot throw).
That keeps the surface small, but two things are worth knowing:

- **`RetroCSS.toast.show()` escapes its message by default.** Passing
  `{ html: true }`, or putting `data-retro-toast-html` on a trigger, assigns the
  string with `innerHTML` and does not sanitise it. Never pass user input
  through that path. This is covered by a unit test.
- **Tooltip and toast content comes from data attributes.** If those attributes
  are rendered from untrusted input by your own templating, escape it there, as
  you would for any attribute.

Findings in development dependencies that cannot affect a consumer of the
published package are still welcome, but will be treated as maintenance rather
than as advisories.
