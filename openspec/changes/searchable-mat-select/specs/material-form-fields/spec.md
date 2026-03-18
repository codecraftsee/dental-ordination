## MODIFIED Requirements

### Requirement: Select dropdowns use mat-select with mat-option

- **WHEN** a form contains a dropdown selection with 5 or more options (visit patient, doctor, diagnosis, treatment; doctor specialization; patient city filter; diagnoses/treatments category filter)
- **THEN** the field SHALL use `<app-searchable-select>` with appropriate `[options]`, `[displayWith]`, and `[valueWith]` inputs
- **AND** for reactive form fields, the component SHALL use `formControlName`
- **AND** for standalone filter selects, the component SHALL use `(selectionChange)`

- **WHEN** a form contains a dropdown selection with fewer than 5 options (patient gender filter)
- **THEN** the field SHALL continue using plain `<mat-select>` inside a `mat-form-field`
- **AND** each option SHALL be `<mat-option [value]="...">` (no native `<select>` or `<option>`)

#### Scenario: Visit form uses searchable select for patient, doctor, diagnosis, and treatment

- **WHEN** the visit form renders
- **THEN** patient, doctor, diagnosis, and treatment dropdowns SHALL each use `<app-searchable-select>` with `formControlName`

#### Scenario: Visit list filters use searchable select

- **WHEN** the visit list filter bar renders
- **THEN** patient and doctor filter dropdowns SHALL use `<app-searchable-select>` with `(selectionChange)` and `[showAllOption]="true"`

#### Scenario: Patient list city filter uses searchable select

- **WHEN** the patient list filter bar renders
- **THEN** the city filter SHALL use `<app-searchable-select>` with `(selectionChange)` and `[showAllOption]="true"`
- **AND** the gender filter SHALL remain a plain `<mat-select>` (only 2 options)

#### Scenario: Doctor form and list use searchable select for specialization

- **WHEN** the doctor form or doctor list renders
- **THEN** the specialization dropdown SHALL use `<app-searchable-select>`

#### Scenario: Diagnosis and treatment forms use searchable select for category

- **WHEN** the diagnosis form, treatment form, diagnoses list, or treatments list renders
- **THEN** category dropdowns SHALL use `<app-searchable-select>`
