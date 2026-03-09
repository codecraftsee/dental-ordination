## ADDED Requirements

### Requirement: List page search bars use mat-form-field

Search and filter bars on all list pages (patients, doctors, visits, diagnoses, treatments) SHALL use `mat-form-field appearance="outline"` instead of native `<input class="form-control">` and `<select class="form-control">`.

#### Scenario: Search input is a mat-form-field

- **WHEN** a list page renders its search bar
- **THEN** the text search input SHALL be a `mat-form-field appearance="outline"` with `matInput`
- **AND** a floating `mat-label` SHALL be shown
- **AND** the visual style SHALL match the form field inputs on form pages

#### Scenario: Filter selects are mat-select

- **WHEN** a list page has category, city, or gender filter dropdowns
- **THEN** those dropdowns SHALL use `mat-select` inside `mat-form-field appearance="outline"`
- **AND** each option SHALL use `mat-option`

#### Scenario: Search bar layout unchanged

- **WHEN** the search bar renders
- **THEN** the search field SHALL still flex and fill available horizontal space
- **AND** filter selects SHALL retain a fixed minimum width
- **AND** the overall bar layout SHALL remain a flex row wrapping on mobile
