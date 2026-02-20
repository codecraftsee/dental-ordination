## 1. CSS Variables (styles.scss)

- [x] 1.1 Update `--color-primary` to `#2C3E50`
- [x] 1.2 Update `--color-primary-light` to `#34495E`
- [x] 1.3 Update `--color-primary-dark` to `#1A252F`
- [x] 1.4 Update `--color-accent` to `#F39C12`
- [x] 1.5 Update `--color-accent-light` to `#F5B942`
- [x] 1.6 Update `--color-background` to `#FAFAFA`
- [x] 1.7 Update `--color-surface-variant` to `#F2F3F4`

## 2. Hardcoded Color Fixes (styles.scss)

- [x] 2.1 Update `.form-control:focus` box-shadow rgba to navy base `rgba(44, 62, 80, 0.15)`
- [x] 2.2 Update `.badge-primary` background to `rgba(44, 62, 80, 0.1)`
- [x] 2.3 Update `.btn-outline` hover/focus to use updated primary variable (verify auto-updates)

## 3. Import Message Colors (home.scss)

- [x] 3.1 Replace hardcoded `#d4edda` / `#155724` / `#c3e6cb` in `.import-message` with CSS variable references
- [x] 3.2 Replace hardcoded `#fff3cd` / `#856404` / `#ffeeba` in `.import-message.error` with CSS variable references

## 4. Verify

- [x] 4.1 Check all pages visually: navbar, buttons, forms, cards, badges use new palette
- [x] 4.2 Run `ng build` — no compilation errors
