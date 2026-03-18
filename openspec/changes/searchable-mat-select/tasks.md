## 1. i18n Keys

- [ ] 1.1 Add `common.search` and `common.noResults` keys to `public/i18n/en.json`
- [ ] 1.2 Add `common.search` and `common.noResults` keys to `public/i18n/sr.json`

## 2. SearchableSelect Component

- [ ] 2.1 Create `src/app/shared/searchable-select/searchable-select.ts` — standalone component with `ControlValueAccessor`, signal-based filtering, inputs (`options`, `displayWith`, `valueWith`, `label`, `showAllOption`, `allOptionLabel`, `errorMessage`), and `selectionChange` output
- [ ] 2.2 Create `src/app/shared/searchable-select/searchable-select.html` — template with `mat-form-field`, `mat-select`, sticky search input as first disabled `mat-option`, filtered options loop, no-results option, and `mat-error`
- [ ] 2.3 Create `src/app/shared/searchable-select/searchable-select.scss` — styles for sticky search row, search icon, input theming with design tokens, panel max-height override
- [ ] 2.4 Create `src/app/shared/searchable-select/searchable-select.spec.ts` — unit tests: rendering with options, filtering by search term, no-results message, clearing search on close, ControlValueAccessor read/write, selectionChange emission, keyboard focus to search input

## 3. Visit Form — Replace mat-select with searchable-select

- [ ] 3.1 Update `src/app/visits/visit-form/visit-form.html` — replace patient, doctor, diagnosis, and treatment `mat-select` fields with `<app-searchable-select>`
- [ ] 3.2 Update `src/app/visits/visit-form/visit-form.ts` — add `SearchableSelect` to imports, create `displayWith`/`valueWith` functions for each entity
- [ ] 3.3 Update `src/app/visits/visit-form/visit-form.spec.ts` — adjust tests for new component

## 4. Visit List — Replace filter mat-selects

- [ ] 4.1 Update `src/app/visits/visit-list/visit-list.html` — replace patient and doctor filter `mat-select` with `<app-searchable-select>` using `showAllOption` and `selectionChange`
- [ ] 4.2 Update `src/app/visits/visit-list/visit-list.ts` — add `SearchableSelect` to imports, create display/value functions
- [ ] 4.3 Update `src/app/visits/visit-list/visit-list.spec.ts` — adjust tests for new component

## 5. Patient List — Replace city filter

- [ ] 5.1 Update `src/app/patients/patient-list/patient-list.html` — replace city filter `mat-select` with `<app-searchable-select>` (keep gender as plain `mat-select`)
- [ ] 5.2 Update `src/app/patients/patient-list/patient-list.ts` — add `SearchableSelect` to imports, create display/value functions for city
- [ ] 5.3 Update `src/app/patients/patient-list/patient-list.spec.ts` — adjust tests

## 6. Doctor Form & List — Replace specialization selects

- [ ] 6.1 Update `src/app/doctors/doctor-form/doctor-form.html` — replace specialization `mat-select` with `<app-searchable-select>`
- [ ] 6.2 Update `src/app/doctors/doctor-form/doctor-form.ts` — add imports and display function
- [ ] 6.3 Update `src/app/doctors/doctor-form/doctor-form.spec.ts` — adjust tests
- [ ] 6.4 Update `src/app/doctors/doctor-list/doctor-list.html` — replace specialization filter with `<app-searchable-select>`
- [ ] 6.5 Update `src/app/doctors/doctor-list/doctor-list.ts` — add imports and display function
- [ ] 6.6 Update `src/app/doctors/doctor-list/doctor-list.spec.ts` — adjust tests

## 7. Diagnosis Form & List — Replace category selects

- [ ] 7.1 Update `src/app/diagnoses/diagnosis-form/diagnosis-form.html` — replace category `mat-select` with `<app-searchable-select>`
- [ ] 7.2 Update `src/app/diagnoses/diagnosis-form/diagnosis-form.ts` — add imports and display function
- [ ] 7.3 Update `src/app/diagnoses/diagnosis-form/diagnosis-form.spec.ts` — adjust tests
- [ ] 7.4 Update `src/app/diagnoses/diagnoses.html` — replace category filter with `<app-searchable-select>`
- [ ] 7.5 Update `src/app/diagnoses/diagnoses.ts` — add imports and display function
- [ ] 7.6 Update `src/app/diagnoses/diagnoses.spec.ts` — adjust tests

## 8. Treatment Form & List — Replace category selects

- [ ] 8.1 Update `src/app/treatments/treatment-form/treatment-form.html` — replace category `mat-select` with `<app-searchable-select>`
- [ ] 8.2 Update `src/app/treatments/treatment-form/treatment-form.ts` — add imports and display function
- [ ] 8.3 Update `src/app/treatments/treatment-form/treatment-form.spec.ts` — adjust tests
- [ ] 8.4 Update `src/app/treatments/treatments.html` — replace category filter with `<app-searchable-select>`
- [ ] 8.5 Update `src/app/treatments/treatments.ts` — add imports and display function
- [ ] 8.6 Update `src/app/treatments/treatments.spec.ts` — adjust tests

## 9. Verification

- [ ] 9.1 Run `npm test` — all unit tests pass
- [ ] 9.2 Run `npm run build` — production build succeeds with no errors
