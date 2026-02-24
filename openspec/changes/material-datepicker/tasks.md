## 1. Dependencies

- [x] 1.1 `npm install @angular/material@^21.0.0 @angular/cdk@^21.0.0`
- [x] 1.2 `angular.json` — add `node_modules/@angular/material/prebuilt-themes/azure-blue.css` to the styles array (before `src/styles.scss`)

## 2. Patient form

- [x] 2.1 `patient-form.ts` — import `MatDatepickerModule` and `MatNativeDateModule`, add to component `imports`
- [x] 2.2 `patient-form.ts` — change `dateOfBirth` form control initial value from `''` to `null`
- [x] 2.3 `patient-form.ts` — add `parseDate(dateStr: string): Date` helper (local timezone safe)
- [x] 2.4 `patient-form.ts` — add `formatDate(date: Date): string` helper (YYYY-MM-DD, local timezone safe)
- [x] 2.5 `patient-form.ts` — in edit mode `patchValue`, wrap `patient.dateOfBirth` with `parseDate()`
- [x] 2.6 `patient-form.ts` — in `onSubmit()`, convert `raw.dateOfBirth` (Date) to string with `formatDate()` before sending payload
- [x] 2.7 `patient-form.html` — wrap the DOB input in `.date-field` div, add `[matDatepicker]`, `mat-datepicker-toggle`, `mat-datepicker` with `startView="multi-year"`
- [x] 2.8 `patient-form.scss` — add `.date-field` relative wrapper + `.date-toggle` absolutely positioned at right edge

## 3. Visit form

- [x] 3.1 `visit-form.ts` — import `MatDatepickerModule` and `MatNativeDateModule`, add to component `imports`
- [x] 3.2 `visit-form.ts` — change `date` form control initial value from `new Date().toISOString().split('T')[0]` to `new Date()`
- [x] 3.3 `visit-form.ts` — add `formatDate(date: Date): string` helper
- [x] 3.4 `visit-form.ts` — in `onSubmit()`, convert `formValue.date` (Date) to string with `formatDate()`
- [x] 3.5 `visit-form.html` — wrap the date input in `.date-field` div, add `[matDatepicker]`, `mat-datepicker-toggle`, `mat-datepicker`
- [x] 3.6 `visit-form.scss` — add `.date-field` wrapper + `.date-toggle` styles

## 4. Global styles

- [x] 4.1 `src/styles.scss` — add Material datepicker overrides section: calendar header (`--color-primary`), selected day, today border, hover bg, popup shadow/radius/border

## 5. Verify

- [x] 5.1 `ng build` — no compilation errors
- [x] 5.2 Patient form — DOB calendar opens on year view, selected date submits as YYYY-MM-DD
- [x] 5.3 Patient form edit — existing DOB pre-fills in the calendar
- [x] 5.4 Visit form — date calendar opens on current month, defaults to today
- [x] 5.5 Calendar popup colours match primary brand colour
- [x] 5.6 Form layout unchanged — toggle button inside the input, error messages below
