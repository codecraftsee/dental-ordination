## 1. Fonts (index.html)

- [ ] 1.1 Replace Montserrat with IBM Plex Sans + Rubik Google Fonts link

## 2. CSS Tokens (styles.scss)

- [ ] 2.1 Replace all color tokens with Doclinic index5 palette (`--color-primary: #5156be`, sidebar `#15243e`, bg `#f3f6f9`, text `#172b4c`, muted `#7e8299`, border `#f3f6f9`)
- [ ] 2.2 Add `--color-sidebar`, `--color-sidebar-text`, `--color-sidebar-active` tokens
- [ ] 2.3 Add `--sidebar-width: 250px`, `--sidebar-width-collapsed: 70px`, `--header-height: 60px` layout tokens
- [ ] 2.4 Add `--font-heading: 'Rubik', sans-serif` token; apply to `h1–h6`
- [ ] 2.5 Update `--font-family` to IBM Plex Sans
- [ ] 2.6 Update `[data-theme="dark"]` overrides: sidebar `#0c1a32`, bg `#1a1d23`, surface `#1e2532`, surface-variant `#262f3e`, border `#2d3748`
- [ ] 2.7 Set `.btn { border-radius: 4px }` (restore rounded, not flat)
- [ ] 2.8 Update `.card` — `border-radius: 8px`, `border: 1px solid var(--color-border)`, softer shadow
- [ ] 2.9 Update focus ring rgba to match new primary `rgba(81, 86, 190, 0.15)`
- [ ] 2.10 Update `.badge-primary` background to `rgba(81, 86, 190, 0.1)`

## 3. App Layout (app.html + app.scss)

- [ ] 3.1 Wrap app in `.app-layout` grid: sidebar col + content col
- [ ] 3.2 Add `<app-sidebar>` element (authenticated only)
- [ ] 3.3 Add `.top-header` bar in column 2 with: hamburger, theme toggle, language switcher, logout
- [ ] 3.4 Move `<router-outlet>` to `.main-content` in column 2
- [ ] 3.5 Style `.app-layout` grid in `app.scss` with CSS variables for widths
- [ ] 3.6 Style `.top-header` in `app.scss` — height, bg `var(--color-navbar)`, flex layout
- [ ] 3.7 Style `.main-content` — padding, overflow, background `var(--color-background)`
- [ ] 3.8 Handle collapsed state: `.app-layout.sidebar-collapsed` narrows sidebar column

## 4. Sidebar Component

- [ ] 4.1 Create `src/app/shared/sidebar/sidebar.ts` — inject `ThemeService`, expose `collapsed = signal()`; init from localStorage
- [ ] 4.2 Create `src/app/shared/sidebar/sidebar.html` — logo, nav links with icons, collapse button
- [ ] 4.3 Create `src/app/shared/sidebar/sidebar.scss` — sidebar styles, nav item active state, collapsed icon-only mode
- [ ] 4.4 Export `toggle()` method; emit collapsed state so App can apply `.sidebar-collapsed` class
- [ ] 4.5 Import `Sidebar` component in `App`

## 5. Cleanup

- [ ] 5.1 Remove old `.navbar` styles from `app.scss` (replaced by sidebar + top-header)
- [ ] 5.2 Remove Montserrat nav font references from `app.scss`

## 6. Verify

- [ ] 6.1 Sidebar shows all nav links, active state works, logo visible
- [ ] 6.2 Collapse toggle works — sidebar shrinks to 70px icon rail, main content expands
- [ ] 6.3 Top header shows hamburger, theme toggle, language switcher, logout
- [ ] 6.4 Dark mode works — sidebar, header, cards all use dark palette
- [ ] 6.5 Run `ng build` — no compilation errors
