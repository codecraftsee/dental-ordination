## Why

Eight `<div class="stat-card">` elements remain in `home.html` and `patient-detail.html` after the Angular Material migration. Replacing them with `mat-card` ensures visual consistency, correct dark-mode theming via CSS tokens, and accessible card semantics throughout the app.

## What Changes

- Replace 4x `<div class="stat-card">` in `src/app/home/home.html` with `<mat-card>`
- Replace 4x `<div class="stat-card">` in `src/app/patients/patient-detail/patient-detail.html` with `<mat-card>`
- Remove `.stat-card` SCSS rules from `home.scss` and `patient-detail.scss`
- Add `MatCardModule` to `home.ts` and `patient-detail.ts` imports (if not already present)

## Capabilities

### New Capabilities

- `stat-card-ui`: Standardised stat-card presentation using `mat-card` with icon, value, and label — consistent look in both home dashboard and patient-detail stats bar.

### Modified Capabilities

<!-- No existing spec-level requirements change — this is purely a UI consistency fix. -->

## Impact

- `src/app/home/home.html` + `home.scss` + `home.ts`
- `src/app/patients/patient-detail/patient-detail.html` + `patient-detail.scss` + `patient-detail.ts`
- No API changes, no routing changes, no new dependencies (MatCardModule already in the bundle)
