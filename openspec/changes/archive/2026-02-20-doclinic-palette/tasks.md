## 1. CSS Variables — Light Palette (styles.scss)

- [x] 1.1 Update `--color-primary` to `#2c87f0`
- [x] 1.2 Update `--color-primary-light` to `#5ba5f3`
- [x] 1.3 Update `--color-primary-dark` to `#1f92c4`
- [x] 1.4 Update `--color-accent` to `#11c26d`
- [x] 1.5 Update `--color-accent-light` to `#3dd68c`
- [x] 1.6 Update `--color-background` to `#f7f7f7`
- [x] 1.7 Update `--color-surface-variant` to `#f0f0f0`
- [x] 1.8 Update `--color-text` to `#222222`
- [x] 1.9 Update `--color-text-secondary` to `#616161`
- [x] 1.10 Update `--color-border` to `#e0e0e0`
- [x] 1.11 Add `--color-highlight: #e58d34`
- [x] 1.12 Add `--color-navbar: #333333`

## 2. CSS Variables — Dark Palette (styles.scss)

- [x] 2.1 Update `--color-primary` to `#5ba5f3`
- [x] 2.2 Update `--color-accent` to `#3dd68c`
- [x] 2.3 Add `--color-navbar: #1a1d23`
- [x] 2.4 Update `--color-highlight` to `#c97a28`

## 3. Button + Component Styles (styles.scss)

- [x] 3.1 Set `.btn { border-radius: 0 }` (flat buttons)
- [x] 3.2 Update `.form-control:focus` focus ring rgba to blue base `rgba(44, 135, 240, 0.15)`
- [x] 3.3 Update `.badge-primary` background to `rgba(44, 135, 240, 0.1)`
- [x] 3.4 Add `.btn-secondary` style using `--color-text-secondary`
- [x] 3.5 Add `.widget-header` style with `--color-highlight` background, white text

## 4. Navbar Font (app.scss + index.html)

- [x] 4.1 Add Google Fonts Montserrat link to `index.html`
- [x] 4.2 Add `--font-nav` token to `:root` in `styles.scss`
- [x] 4.3 Apply Montserrat uppercase to `.navbar-links a` in `app.scss`

## 5. Navbar Background (app.scss)

- [x] 5.1 Update `.navbar` background to use `var(--color-navbar)`

## 6. Verify

- [x] 6.1 All pages: blue primary, green accents, flat buttons, dark navbar visible
- [x] 6.2 Dark mode toggle still works with updated palette
- [x] 6.3 Run `ng build` — no compilation errors
