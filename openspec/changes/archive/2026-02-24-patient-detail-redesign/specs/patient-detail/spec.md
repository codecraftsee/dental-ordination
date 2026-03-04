## CHANGED Requirements

### Requirement: Profile header card

#### Scenario: Avatar displays patient initials

- **GIVEN** a patient has firstName "John" and lastName "Doe"
- **WHEN** the patient detail page renders
- **THEN** a circular avatar SHALL display the initials "JD"
- **AND** the avatar SHALL use `--color-primary` as background with white text
- **AND** the avatar SHALL be 96px in diameter on desktop

#### Scenario: Avatar placeholder coexists with future photo

- **WHEN** the patient has no `photoUrl`
- **THEN** the initials avatar SHALL be shown
- **WHEN** (future) the patient has a `photoUrl`
- **THEN** the `<img>` inside the same circle SHALL be shown instead of initials

#### Scenario: Patient name and key info are prominent

- **WHEN** the page renders
- **THEN** the full name SHALL be displayed as a heading (h2 level)
- **AND** a gender badge SHALL appear below the name
- **AND** the registration date SHALL be shown in muted text

#### Scenario: Action buttons are in the profile header

- **WHEN** the page renders
- **THEN** "Dental Card", "Edit", "Delete", and "Back" buttons SHALL appear in the profile header card
- **AND** on mobile they SHALL wrap below the avatar/name block

---

### Requirement: Stats bar

#### Scenario: Four stats are shown between header and info cards

- **WHEN** the page renders
- **THEN** four stat chips SHALL be displayed in a row:
  - **Total Visits** — count of all visits for this patient
  - **This Year** — count of visits in the current calendar year
  - **Age** — integer age computed from `dateOfBirth`
  - **Date of Birth** — formatted date string
- **AND** on mobile the stats SHALL render as a 2×2 grid

---

### Requirement: Contact info card

#### Scenario: Contact fields render with icons

- **WHEN** the page renders
- **THEN** a contact card SHALL display phone, email, address, and city — each with a corresponding icon
- **AND** any field that is empty or undefined SHALL NOT be rendered

---

### Requirement: Personal info card

#### Scenario: All patient fields are shown in a two-column grid

- **WHEN** the page renders
- **THEN** firstName, lastName, parentName, gender, dateOfBirth, city, address, and registeredOn SHALL appear in a two-column detail grid inside a card

---

### Requirement: Full visit history table

#### Scenario: All visits are shown, not just the last 5

- **WHEN** the patient has more than 5 visits
- **THEN** all visits SHALL be shown in the visit history section
- **AND** visits SHALL be ordered most recent first

#### Scenario: Empty state when no visits

- **WHEN** the patient has no visits
- **THEN** an empty state message SHALL be shown instead of the table
