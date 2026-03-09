## ADDED Requirements

### Requirement: Visit model includes paid field

The Visit model SHALL include a `paid` boolean field that defaults to `false`.

#### Scenario: New visit defaults to unpaid
- **WHEN** a new visit is created without specifying `paid`
- **THEN** the visit SHALL have `paid` set to `false`

#### Scenario: Visit can be created as paid
- **WHEN** a new visit is created with `paid` set to `true`
- **THEN** the visit SHALL be stored with `paid` as `true`

---

### Requirement: Visit form includes payment toggle

The visit form SHALL include a slide toggle to mark the visit as paid or unpaid.

#### Scenario: Payment toggle appears on visit form
- **WHEN** the visit form renders (create or edit)
- **THEN** a Material slide toggle labeled "Paid" SHALL be displayed
- **AND** it SHALL default to unchecked (unpaid) for new visits

#### Scenario: Payment toggle reflects existing state on edit
- **WHEN** editing an existing visit that has `paid` set to `true`
- **THEN** the slide toggle SHALL be checked

#### Scenario: Payment toggle updates the visit
- **WHEN** the user toggles the payment switch and saves the form
- **THEN** the visit `paid` field SHALL be updated accordingly

---

### Requirement: Visit detail shows payment status

The visit detail page SHALL display the payment status and allow toggling it.

#### Scenario: Paid visit shows green indicator
- **WHEN** viewing a visit with `paid` set to `true`
- **THEN** a green "Paid" badge SHALL be displayed

#### Scenario: Unpaid visit shows red indicator
- **WHEN** viewing a visit with `paid` set to `false`
- **THEN** a red "Unpaid" badge SHALL be displayed

#### Scenario: Payment status can be toggled from detail
- **WHEN** the user clicks the payment status badge/button on visit detail
- **THEN** the `paid` field SHALL be toggled via the API
- **AND** the badge SHALL update immediately (optimistic update)

---

### Requirement: Dental card shows paid status per visit

The dental card visits table SHALL indicate payment status for each visit.

#### Scenario: Paid column in dental card table
- **WHEN** the dental card renders with visits
- **THEN** each visit row SHALL show a paid/unpaid icon (check or X)
- **AND** the column header SHALL be labeled with the translated "Paid" key

#### Scenario: Mobile book-table shows paid status
- **WHEN** the dental card renders in mobile book-table view
- **THEN** each page SHALL include a paid/unpaid field with an icon indicator
