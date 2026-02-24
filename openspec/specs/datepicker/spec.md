## CHANGED Requirements

### Requirement: Calendar popup replaces native date input

#### Scenario: Patient form — DOB field opens calendar on click

- **GIVEN** the user is on the New Patient or Edit Patient form
- **WHEN** the user clicks the date of birth input
- **THEN** a calendar popup SHALL open
- **AND** the popup SHALL open on the year selection view (`startView="multi-year"`)
- **AND** the input SHALL be read-only (no freehand typing)

#### Scenario: Visit form — date field opens calendar on click

- **GIVEN** the user is on the New Visit form
- **WHEN** the user clicks the visit date input
- **THEN** a calendar popup SHALL open
- **AND** the popup SHALL open on the current month (default view)
- **AND** today's date SHALL be pre-selected as the default value

#### Scenario: Toggle button opens calendar

- **WHEN** the user clicks the calendar icon button inside the date field
- **THEN** the calendar popup SHALL open
- **AND** the toggle button SHALL be positioned at the right edge of the input

---

### Requirement: Date value sent to API remains YYYY-MM-DD string

#### Scenario: New patient — date of birth submitted correctly

- **GIVEN** the user selects January 15, 2000 in the calendar
- **WHEN** the form is submitted
- **THEN** the API request SHALL contain `dateOfBirth: "2000-01-15"`
- **AND** the value SHALL NOT shift by one day due to timezone offset

#### Scenario: Edit patient — existing DOB pre-fills calendar

- **GIVEN** the backend returns `dateOfBirth: "1990-03-22"`
- **WHEN** the edit form loads
- **THEN** the date input SHALL display March 22, 1990 in the calendar

#### Scenario: New visit — date submitted correctly

- **GIVEN** the user selects a date in the visit form calendar
- **WHEN** the form is submitted
- **THEN** the API request SHALL contain `date: "YYYY-MM-DD"` with the correct calendar date

---

### Requirement: Calendar popup matches app design system

#### Scenario: Calendar header uses primary colour

- **WHEN** the calendar popup is open
- **THEN** the calendar header background SHALL use `--color-primary`
- **AND** the selected date SHALL be highlighted with `--color-primary`
- **AND** today's date SHALL have a border in `--color-primary`

#### Scenario: Calendar popup has an opaque background

- **WHEN** the calendar popup is open
- **THEN** the popup background SHALL be fully opaque using `--color-surface`
- **AND** content behind the popup SHALL NOT be visible through it

#### Scenario: Calendar popup has app-consistent shadow and radius

- **WHEN** the calendar popup is open
- **THEN** the popup SHALL use `--shadow-3` and `--radius-lg`
- **AND** the popup border SHALL use `--color-border`

---

### Requirement: Datepicker integrates with Angular Material form field

#### Scenario: Datepicker toggle sits inside the outlined form field

- **WHEN** the date field renders inside a `mat-form-field appearance="outline"`
- **THEN** the `mat-datepicker-toggle` SHALL be placed via `matSuffix` inside the outlined border
- **AND** the toggle button SHALL NOT require absolute positioning or a `.date-field` wrapper
- **AND** the `mat-error` inside the form field SHALL display validation errors automatically when the control is touched and invalid
