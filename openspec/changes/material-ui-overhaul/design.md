## Context

Angular Material is already present in the project (`@angular/material` installed, all form fields migrated). The app shell however still uses a bespoke CSS grid with a hand-rolled sidebar, toolbar, and overlay backdrop. The goal is to replace the shell primitives with the Material equivalents that ship with the library, and to standardise page containers with `mat-card`.

Current state:
- `app.html`: CSS grid layout, `<header class="top-header">`, `<app-sidebar>`, `<div class="sidebar-overlay">`
- `sidebar.html`: custom `<aside>` with hand-rolled `<a class="nav-item">` links and emoji icons
- All pages: `<div class="card">` container, native inputs in search bars

## Goals / Non-Goals

**Goals:**
- Replace app shell grid + custom toolbar with `mat-sidenav-container` + `mat-toolbar`
- Mobile overlay is handled by `mat-sidenav mode="over"` — remove the custom `sidebar-overlay` div and its CSS
- Replace custom sidebar nav links with `mat-nav-list` + `mat-list-item`
- Replace emoji icons with `mat-icon` (Material Symbols Outlined font)
- Replace `<div class="card">` with `mat-card` + `mat-card-content` on every page
- Replace native search/filter inputs in list pages with `mat-form-field appearance="outline"`
- Toolbar action buttons become `mat-icon-button` (hamburger, theme toggle) and `mat-stroked-button` (logout)

**Non-Goals:**
- `mat-table` — current custom HTML tables are retained; migrating to the CDK-backed `mat-table` is a separate effort
- `mat-paginator` or `mat-sort` — out of scope
- Replacing `.btn-*` action buttons on pages — kept as-is; only the toolbar buttons change

## Decisions

### D1: mat-sidenav-container instead of CSS grid

`mat-sidenav-container` gives us the desktop persistent mode + mobile overlay in one component, handles focus trapping, and removes ~120 lines of custom SCSS (`app.scss` grid, `.sidebar-overlay`). The custom CSS grid would need to continue to grow to match Material's feature set; using the official component is the right call.

**Alternative considered:** Keep CSS grid, only add Material Icons. Rejected — misses the mobile overlay improvement and leaves technical debt.

### D2: mat-sidenav `mode="side"` on desktop, `mode="over"` on mobile

Use `[mode]="isMobile() ? 'over' : 'side'"` bound to a `signal<boolean>` initialised from `window.innerWidth < 768` and updated via a `HostListener` on `window:resize`. This replaces the existing `sidebar-overlay` div and all its custom logic in `app.ts`.

**Alternative considered:** Always use `mode="over"` for simplicity. Rejected — on desktop, `mode="side"` pushes content which is the standard behaviour.

### D3: mat-nav-list in the sidebar

`mat-nav-list` with `mat-list-item` and `[activated]` binding replaces the custom `.nav-item` CSS. Router active state is determined by injecting `Router` and using `router.isActive(link.route, ...)` in a `computed()` signal rather than `routerLinkActive` directive (which does not work natively with `mat-list-item`).

**Alternative considered:** Keep `routerLinkActive` on the anchor tag inside `mat-list-item`. Works but the Material active visual must be driven by `[activated]` on the `mat-list-item` itself, so the `isActive` computed approach is cleaner.

### D4: Material Symbols Outlined (variable font) over emoji

Add `<link>` for `Material+Symbols+Outlined` in `index.html`. Use `<mat-icon fontSet="material-symbols-outlined">` in the sidebar and toolbar. Icon strings: `home`, `people`, `medical_services`, `calendar_month`, `biotech`, `medication`, `settings`. This gives consistent, themeable icons.

**Alternative considered:** `MatIconRegistry` with SVG sprites. More complex, not needed at this scale.

### D5: mat-card replacing div.card

`mat-card` + `mat-card-content` is a drop-in visual replacement. The `--mdc-elevated-card-*` CSS variables are overridden in `styles.scss` to match the existing design tokens (border radius, box shadow, background). No change to page logic.

### D6: mat-form-field for search bars

List pages already have the Material modules imported for inline forms (diagnoses, treatments). For the list page search bars (patient-list, doctor-list, visit-list), add `MatFormFieldModule` + `MatInputModule` + `MatSelectModule` to those components and replace native inputs.

## Risks / Trade-offs

- **`mat-sidenav` z-index conflicts with datepicker overlay** → Set `mat-sidenav-container` `z-index` below Angular CDK overlay container (`z-index: 1000`); Material handles the rest.
- **Sidebar collapsed state** → `mat-sidenav` `opened` property replaces the custom `collapsed` signal. Persist `opened` state to `localStorage` as before.
- **mat-card padding differs from .card padding** → Override `--mat-card-*` padding via CSS variable in `styles.scss` to preserve existing spacing.
- **mat-list-item link styling** → `mat-list-item` renders as `<a>` when `[routerLink]` is present; need to ensure `text-decoration: none` and correct color via `styles.scss`.

## Migration Plan

1. Add Material Symbols font to `index.html`
2. Update `styles.scss` — add mat-card, mat-toolbar, mat-sidenav, mat-list overrides
3. Rebuild `app.html` + `app.ts` with `mat-sidenav-container` + `mat-toolbar`
4. Rebuild `sidebar.html` + `sidebar.ts` + `sidebar.scss` with `mat-nav-list`
5. Replace `<div class="card">` → `<mat-card>` + `<mat-card-content>` on all pages
6. Replace search bar native inputs with `mat-form-field` on list pages
7. `ng build` — verify zero errors
