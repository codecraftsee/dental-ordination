## ADDED Requirements

### Requirement: All page containers use mat-card

Every page that previously used `<div class="card">` as its content container SHALL use `<mat-card>` + `<mat-card-content>` instead.

#### Scenario: Form pages render inside mat-card

- **WHEN** patient-form, visit-form, or doctor-form renders
- **THEN** the form SHALL be wrapped in `<mat-card>` with `<mat-card-content>` containing the form element
- **AND** no `<div class="card">` wrapper SHALL be present

#### Scenario: Inline CRUD cards on diagnoses and treatments

- **WHEN** the diagnoses or treatments add/edit form is shown
- **THEN** the form card SHALL use `<mat-card>` instead of `<div class="card mb-lg">`

#### Scenario: Patient detail profile card

- **WHEN** the patient detail page renders
- **THEN** the profile header card, contact card, personal info card, and visit history section SHALL each use `<mat-card>`

#### Scenario: Admin page danger zone cards

- **WHEN** the admin page renders
- **THEN** each delete action card SHALL use `<mat-card>`

---

### Requirement: mat-card appearance matches the existing design tokens

#### Scenario: mat-card uses design token colours and radius

- **WHEN** a `mat-card` renders in light mode
- **THEN** the background SHALL be `--color-surface`
- **AND** the border radius SHALL be `var(--radius-md)` (8px)
- **AND** the box shadow SHALL match `--shadow-1`

#### Scenario: mat-card adapts in dark mode

- **WHEN** the `[data-theme="dark"]` attribute is active
- **THEN** the `mat-card` background SHALL use the dark `--color-surface` token automatically
