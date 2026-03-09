## Requirements

### Requirement: All form inputs use Angular Material outlined form fields

#### Scenario: Text, email, tel, and number inputs use matInput inside mat-form-field

- **GIVEN** any form in the app (patient-form, visit-form, doctor-form, diagnoses, treatments, login)
- **WHEN** the form renders
- **THEN** every text, email, tel, number, and password input SHALL be wrapped in `<mat-form-field appearance="outline">`
- **AND** the input element SHALL carry the `matInput` directive
- **AND** a floating `<mat-label>` SHALL replace the separate `<label class="form-label">` element
- **AND** no `.form-group` / `.form-control` / `.form-label` / `.form-error` HTML shall be used for these fields

#### Scenario: Select dropdowns use mat-select with mat-option

- **WHEN** a form contains a dropdown selection (visit patient, doctor, diagnosis, treatment; doctor specialization; diagnoses/treatments category)
- **THEN** the field SHALL use `<mat-select formControlName="...">` inside a `mat-form-field`
- **AND** each option SHALL be `<mat-option [value]="...">` (no native `<select>` or `<option>` inside the form)

#### Scenario: Textareas use matInput

- **WHEN** a form contains a multi-line textarea (diagnoses description, treatments description)
- **THEN** the `<textarea>` element SHALL carry the `matInput` directive inside a `mat-form-field`

---

### Requirement: Validation errors use mat-error

#### Scenario: Single-error fields show mat-error automatically

- **GIVEN** a required field that has been touched
- **WHEN** the field value is empty
- **THEN** a `<mat-error>` SHALL appear below the outlined field automatically
- **AND** no `@if (f['x'].invalid && f['x'].touched)` wrapper SHALL be needed on the outer element

#### Scenario: Email fields show context-specific errors

- **GIVEN** an email input with both `Validators.required` and `Validators.email`
- **WHEN** the field is touched and invalid
- **THEN** `<mat-error>` with `common.required` SHALL show when the field is empty
- **AND** `<mat-error>` with `common.invalidEmail` SHALL show when the format is invalid

---

### Requirement: Datepicker toggle is placed via matSuffix

#### Scenario: Date fields use matSuffix instead of absolute positioning

- **WHEN** a date input with `[matDatepicker]` renders inside a `mat-form-field`
- **THEN** `<mat-datepicker-toggle matSuffix [for]="picker">` SHALL position the icon natively inside the outline
- **AND** no `.date-field` wrapper div or `.date-toggle` absolute positioning SHALL be present

---

### Requirement: Radio buttons use mat-radio-group

#### Scenario: Patient gender field uses Material radio buttons

- **GIVEN** the patient form gender field
- **WHEN** the form renders
- **THEN** the field SHALL use `<mat-radio-group formControlName="gender">` with `<mat-radio-button>` children
- **AND** the selected radio button SHALL use `--color-primary` for its fill colour via MDC CSS variables

---

### Requirement: Search bars remain as native HTML

#### Scenario: Diagnoses and treatments search bars are not migrated

- **GIVEN** the search/filter bar at the top of the diagnoses or treatments page
- **WHEN** the page renders
- **THEN** the search input and category filter select SHALL remain as native `.form-control` elements
- **AND** only the inline CRUD form below the search bar uses `mat-form-field`

---

### Requirement: Global Material form field styles use design tokens

#### Scenario: Outlined border colours map to app CSS variables

- **WHEN** any `mat-form-field appearance="outline"` renders
- **THEN** the resting border SHALL use `--color-border`
- **AND** the hover border SHALL use `--color-primary-light`
- **AND** the focused border SHALL use `--color-primary`
- **AND** the error border SHALL use `--color-danger`
- **AND** the border radius SHALL be 8px

#### Scenario: Dark mode form fields adapt via CSS variables

- **WHEN** the `[data-theme="dark"]` attribute is set on the root element
- **THEN** all `mat-form-field` inputs, labels, and borders SHALL automatically adapt through the existing design token overrides

#### Scenario: mat-select dropdown panel uses surface colour

- **WHEN** a `mat-select` panel opens
- **THEN** the panel background SHALL use `--color-surface`
- **AND** hovered options SHALL use `--color-sidebar-hover`
- **AND** the active/selected option text SHALL use `--color-primary`
