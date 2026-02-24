## 1. FOUC Prevention (index.html)

- [x] 1.1 Add inline `<script>` to `index.html` that reads `localStorage` theme and sets `data-theme` on `<html>` before Angular boots

## 2. ThemeService

- [x] 2.1 Create `src/app/services/theme.service.ts` with `theme = signal<'light' | 'dark'>` and `isDark = computed(...)`
- [x] 2.2 On init: read `localStorage('theme')`, fall back to `prefers-color-scheme`, default to `'light'`
- [x] 2.3 Implement `toggleTheme()` — flips theme, updates `data-theme` on `document.documentElement`, saves to `localStorage`

## 3. Dark Mode CSS Tokens (styles.scss)

- [x] 3.1 Add `[data-theme="dark"]` block with surface/background overrides: `--color-background: #1A1D23`, `--color-surface: #242830`, `--color-surface-variant: #2D3138`
- [x] 3.2 Add text/border overrides: `--color-text: #E9ECEF`, `--color-text-secondary: #ADB5BD`, `--color-border: #3D4148`
- [x] 3.3 Add brand overrides: `--color-primary: #5D8AA8`, `--color-primary-light: #7BA7C2`, `--color-primary-dark: #3A6B8A`, `--color-accent: #F5B942`, `--color-accent-light: #F7CA6A`
- [x] 3.4 Add semantic overrides: desaturate `--color-success-bg`, `--color-warning-bg`, `--color-danger-bg`, `--color-info-bg` for dark comfort

## 4. Navbar Toggle Button

- [x] 4.1 Inject `ThemeService` in `app.ts`
- [x] 4.2 Add theme toggle button to `app.html` navbar using `isDark()` signal
- [x] 4.3 Add i18n keys `nav.lightMode` / `nav.darkMode` to `en.json` and `sr.json`

## 5. Verify

- [x] 5.1 Toggle works — switching between light and dark updates all page colors instantly
- [x] 5.2 Preference persists after page reload
- [x] 5.3 No flash of incorrect theme on reload (FOUC test)
- [x] 5.4 Run `ng build` — no compilation errors
