## Why

The app shell still uses a hand-rolled CSS-grid layout with custom `.app-layout`, `.top-header`, and `.sidebar` components while forms already use Angular Material. Adopting `mat-sidenav-container`, `mat-toolbar`, and `mat-nav-list` for the shell — and `mat-card` for page cards — delivers consistent Material behaviour (mobile overlay, focus trapping, keyboard accessibility) and eliminates ~250 lines of custom CSS that duplicates what Material provides for free.

## What Changes

- **App shell** (`app.html`, `app.scss`, `app.ts`): replace custom CSS grid + `.top-header` div with `mat-sidenav-container` + `mat-toolbar`; mobile overlay handled by `mat-sidenav mode="over"` natively
- **Sidebar** (`sidebar.html`, `sidebar.scss`, `sidebar.ts`): replace custom `.nav-item` anchors with `mat-nav-list` + `mat-list-item`; replace emoji icons with `mat-icon` (Google Material Symbols)
- **Material Icons font**: add to `index.html`; update all nav icon strings from emoji to Material icon names
- **Page cards**: replace `<div class="card">` with `<mat-card>` + `<mat-card-content>` across all pages (patient-list, doctor-list, visit-list, diagnoses, treatments, patient-form, visit-form, doctor-form, patient-detail, admin)
- **Search bars**: replace native `.form-control` search inputs and selects on list pages with `mat-form-field appearance="outline"` (consistent with the already-migrated form fields)
- **Header action buttons**: replace raw `<button>` hamburger + theme toggle with `mat-icon-button`; replace logout button with `mat-stroked-button`
- **Global styles**: remove card CSS, add `mat-card` + `mat-toolbar` + `mat-sidenav` token overrides in `styles.scss`

## Capabilities

### New Capabilities
- `material-shell`: `mat-sidenav-container` + `mat-toolbar` shell replacing the custom CSS grid layout and hand-rolled header
- `material-cards`: `mat-card` replacing `<div class="card">` across all list, detail, and form pages

### Modified Capabilities
- `sidebar-nav`: updated to use `mat-nav-list` + `mat-list-item` + `mat-icon` instead of custom anchor tags with emoji icons

## Impact

- `src/index.html` — add Material Symbols font link
- `src/app/app.html`, `app.scss`, `app.ts` — shell rebuild
- `src/app/shared/sidebar/sidebar.html`, `sidebar.scss`, `sidebar.ts` — nav rebuild
- `src/app/home/home.html`, `home.scss`
- `src/app/patients/patient-list/patient-list.html`, `.ts`
- `src/app/patients/patient-detail/patient-detail.html`, `.ts`
- `src/app/patients/patient-form/patient-form.html`, `.ts`
- `src/app/doctors/doctor-list/doctor-list.html`, `.ts`
- `src/app/doctors/doctor-detail/doctor-detail.html`, `.ts`
- `src/app/doctors/doctor-form/doctor-form.html`, `.ts`
- `src/app/visits/visit-list/visit-list.html`, `.ts`
- `src/app/visits/visit-detail/visit-detail.html`, `.ts`
- `src/app/visits/visit-form/visit-form.html`, `.ts`
- `src/app/diagnoses/diagnoses.html`, `.ts`
- `src/app/treatments/treatments.html`, `.ts`
- `src/app/admin/admin.html`, `.ts`
- `src/styles.scss` — add mat-card, mat-toolbar, mat-sidenav overrides; remove old card CSS
- New Angular Material modules: `MatSidenavModule`, `MatToolbarModule`, `MatListModule`, `MatIconModule`, `MatButtonModule`
