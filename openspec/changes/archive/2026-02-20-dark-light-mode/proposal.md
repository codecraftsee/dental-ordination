## Why

Users work in different lighting environments — a dark mode reduces eye strain during evening sessions while a light mode suits clinical bright-room use. The existing brand token system (CSS custom properties) makes this straightforward to add without touching any component logic.

## What Changes

- Add a `ThemeService` that manages the current theme (`light` | `dark`), persists the choice to `localStorage`, and respects the OS `prefers-color-scheme` preference on first visit
- Add dark-mode overrides as a `[data-theme="dark"]` attribute on `<html>`, redefining the CSS color tokens
- Add a theme toggle button to the navbar

## Capabilities

### New Capabilities

- `theme-toggle`: Toggle button in navbar to switch between light and dark mode, with persistence and OS preference detection

### Modified Capabilities

- `brand-color-scheme`: Dark mode overrides added — the existing light palette is unchanged, dark palette defined as a separate token override block

## Impact

- `src/styles.scss` — add `[data-theme="dark"]` CSS block with dark palette overrides
- `src/app/services/theme.service.ts` — new `ThemeService` (signal-based, `localStorage` persistence)
- `src/app/app.ts` + `src/app/app.html` — inject `ThemeService`, add toggle button to navbar
- `public/i18n/en.json`, `public/i18n/sr.json` — add toggle button i18n keys
