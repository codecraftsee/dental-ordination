## Proposal: Angular Material Datepicker

### Problem

The `patient-form` and `visit-form` components used native `<input type="date">`, which renders differently across browsers (Chrome, Firefox, Safari) and varies by OS locale. It provides no visual calendar popup, no year/month navigation, and looks inconsistent with the rest of the app UI.

### Solution

Replace both native date inputs with the **Angular Material datepicker** (`mat-datepicker`). This provides:

- A calendar popup with month/year navigation
- `startView="multi-year"` on the DOB field so staff reach the birth year quickly
- Consistent cross-browser appearance
- A toggle button that opens the calendar on click

The datepicker is integrated without `mat-form-field` — the Material toggle and calendar are attached directly to the existing `.form-control` input so the surrounding form layout is unchanged.

### Scope

- `package.json` — add `@angular/material` and `@angular/cdk` dependencies
- `angular.json` — add azure-blue prebuilt Material theme to the styles array
- `src/app/patients/patient-form/patient-form.ts` — import Material modules, add `parseDate()` / `formatDate()` helpers, convert form value on submit
- `src/app/patients/patient-form/patient-form.html` — replace `<input type="date">` with `mat-datepicker` pattern
- `src/app/patients/patient-form/patient-form.scss` — add `.date-field` wrapper styles
- `src/app/visits/visit-form/visit-form.ts` — same as patient-form changes
- `src/app/visits/visit-form/visit-form.html` — replace `<input type="date">` with `mat-datepicker` pattern
- `src/app/visits/visit-form/visit-form.scss` — add `.date-field` wrapper styles
- `src/styles.scss` — global Material datepicker popup overrides to match the app design system

### Non-Goals

- Replacing any other form inputs (selects, text fields) with Material components
- Adding `@angular/material` globally via NgModule — imports are per-component (standalone)
- Date range picker
- Time picker
