## MODIFIED Requirements

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
- **AND** a payment status chip SHALL appear next to the gender badge
- **AND** the registration date SHALL be shown in muted text

#### Scenario: Action buttons are in the profile header

- **WHEN** the page renders
- **THEN** "Dental Card", "Edit", "Delete", and "Back" buttons SHALL appear in the profile header card
- **AND** on mobile they SHALL wrap below the avatar/name block

---

### Requirement: Stats bar

#### Scenario: Five stats are shown between header and info cards

- **WHEN** the page renders
- **THEN** five stat chips SHALL be displayed in a row:
  - **Total Visits** — count of all visits for this patient
  - **This Year** — count of visits in the current calendar year
  - **Age** — integer age computed from `dateOfBirth`
  - **Date of Birth** — formatted date string
  - **Debt** — sum of unpaid visit prices, formatted with currencyFormat
- **AND** on mobile the stats SHALL render in a responsive grid
