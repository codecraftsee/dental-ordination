## 1. Foundation

- [x] 1.1 `index.html` — add Material Symbols Outlined font link: `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />`
- [x] 1.2 `styles.scss` — add `mat-sidenav-container`, `mat-toolbar`, `mat-card`, `mat-nav-list` CSS variable overrides mapped to design tokens; remove `.app-layout` grid and `.top-header` CSS
- [x] 1.3 `src/app/shared/btn-ripple.directive.ts` — create `BtnRippleDirective` with `selector: '.btn'` that injects `MatRipple` (from `MatRippleModule`) and calls `ripple.launch()` on host click; add `position: relative; overflow: hidden` to `.btn` in `styles.scss` (required by matRipple); export from shared and add to `app.ts` imports so it applies globally to every `.btn` element without touching any template

## 2. App Shell — mat-sidenav-container + mat-toolbar

- [x] 2.1 `app.ts` — add `MatSidenavModule`, `MatToolbarModule`, `MatButtonModule`, `MatIconModule` to imports; add `isMobile = signal(window.innerWidth < 768)`; add `@HostListener` → `host` resize handler updating `isMobile`; remove `viewChild(Sidebar)` and overlay logic; add `sidenavOpen` signal with localStorage persistence
- [x] 2.2 `app.html` — replace CSS grid with `mat-sidenav-container`; add `mat-sidenav [mode]="isMobile() ? 'over' : 'side'"` containing `<app-sidebar>`; add `mat-sidenav-content` containing `mat-toolbar` + `<main>` with `<router-outlet>`; remove `.sidebar-overlay` div
- [x] 2.3 `app.html` — toolbar: hamburger `<button mat-icon-button (click)="toggleSidenav()"><mat-icon>menu</mat-icon></button>`, `<app-language-switcher>`, theme toggle `<button mat-icon-button>`, logout `<button mat-stroked-button>`
- [x] 2.4 `app.scss` — remove all custom CSS (`.app-layout`, `.top-header`, `.hamburger`, `.header-actions`, `.btn-theme-toggle`, `.btn-logout`, `.main-content`, `.sidebar-overlay`); keep only Material override rules moved to `styles.scss`

## 3. Sidebar — mat-nav-list

- [x] 3.1 `sidebar.ts` — add `MatListModule`, `MatIconModule`; inject `Router`; replace `collapsedChange` output with none (sidenav open/close handled by app); add `isActive(route, exact)` method using `router.isActive()`; update nav links with Material icon names (`home`, `people`, `medical_services`, `calendar_month`, `biotech`, `medication`, `settings`)
- [x] 3.2 `sidebar.html` — replace `<aside>` with a plain `<div class="sidebar-inner">`; replace logo `<span>` with logo div; replace `<nav>` + custom `<a class="nav-item">` with `<mat-nav-list>`; each item: `<a mat-list-item [routerLink]="link.route" [activated]="isActive(link.route, link.exact)"><mat-icon matListItemIcon>{{ link.icon }}</mat-icon><span matListItemTitle>{{ link.label | translate }}</span></a>`; remove collapse button (toggle is in toolbar)
- [x] 3.3 `sidebar.scss` — remove all custom nav styles; keep only logo area styles and `mat-nav-list` token overrides (active colour, hover, text colour)

## 4. Page Cards — mat-card

- [x] 4.1 `patient-form.html` + `patient-form.ts` — replace `<div class="card">` with `<mat-card><mat-card-content>` ; add `MatCardModule` to imports
- [x] 4.2 `visit-form.html` + `visit-form.ts` — same mat-card replacement
- [x] 4.3 `doctor-form.html` + `doctor-form.ts` — same mat-card replacement
- [x] 4.4 `diagnoses.html` + `diagnoses.ts` — replace `<div class="card mb-lg">` with `<mat-card class="mb-lg"><mat-card-content>`
- [x] 4.5 `treatments.html` + `treatments.ts` — same mat-card replacement
- [x] 4.6 `patient-detail.html` + `patient-detail.ts` — replace all `.card` / `.detail-card` divs with `mat-card` + `mat-card-content`
- [x] 4.7 `doctor-detail.html` + `doctor-detail.ts` — same mat-card replacement
- [x] 4.8 `visit-detail.html` + `visit-detail.ts` — same mat-card replacement
- [x] 4.9 `admin.html` + `admin.ts` — replace each danger card div with `mat-card`
- [x] 4.10 `home.html` + `home.ts` — replace any `.card` wrappers with `mat-card`

## 5. Search Bars — mat-form-field

- [x] 5.1 `patient-list.html` + `patient-list.ts` — replace search `<input class="form-control">` with `mat-form-field` + `matInput`; replace city/gender `<select>` with `mat-select`; add `MatFormFieldModule`, `MatInputModule`, `MatSelectModule` to imports
- [x] 5.2 `doctor-list.html` + `doctor-list.ts` — same search bar replacement
- [x] 5.3 `visit-list.html` + `visit-list.ts` — same search bar replacement
- [x] 5.4 `diagnoses.html` — replace search `<input>` with `mat-form-field` + `matInput`; replace category `<select>` with `mat-select` (modules already imported)
- [x] 5.5 `treatments.html` — same as diagnoses search bar

## 6. Global Styles

- [x] 6.1 `styles.scss` — add mat-sidenav overrides: background `--color-sidebar`, border-right `--color-sidebar-border`
- [x] 6.2 `styles.scss` — add mat-toolbar overrides: background `--color-navbar`, color `--color-navbar-text`, border-bottom, height `--header-height`
- [x] 6.3 `styles.scss` — add mat-card overrides: `--mdc-elevated-card-container-color: var(--color-surface)`, `--mdc-elevated-card-container-shape: var(--radius-md)`, override box-shadow to `--shadow-1`
- [x] 6.4 `styles.scss` — add mat-nav-list overrides: active item background `--color-sidebar-active`, active item text `--color-sidebar-active-text`, hover background `--color-sidebar-hover`, text colour `--color-sidebar-text`
- [x] 6.5 `styles.scss` — add mat-icon-button in toolbar: color `--color-navbar-text`

## 7. Verify

- [x] 7.1 Desktop: sidenav opens/closes on hamburger click; state persists on reload
- [x] 7.2 Mobile (≤767px): sidenav is overlay; backdrop visible; closes on nav link tap
- [x] 7.3 All nav items show Material icons; active route shows primary colour highlight
- [x] 7.4 All form pages render inside mat-card with correct styling
- [x] 7.5 All search bars use mat-form-field; filter selects use mat-select
- [x] 7.6 Light and dark mode: all mat-card, mat-toolbar, mat-sidenav adapt via CSS tokens
- [x] 7.7 Clicking any `.btn` shows a Material ripple effect (no template changes required)
- [x] 7.8 `ng build` — zero compilation errors
