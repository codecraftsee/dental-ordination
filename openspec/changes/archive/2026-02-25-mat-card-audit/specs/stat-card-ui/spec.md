## ADDED Requirements

### Requirement: Stat cards use Angular Material card component
All stat-card elements in the home dashboard and patient-detail stats bar SHALL be rendered as `mat-card` components rather than plain `div` elements.

#### Scenario: Home dashboard stat cards render as mat-card
- **WHEN** the home page is displayed
- **THEN** each of the 4 stat cards (patients, doctors, visits today, visits this week) is a `mat-card` element

#### Scenario: Patient-detail stats bar renders as mat-card
- **WHEN** the patient detail page is displayed
- **THEN** each of the 4 stat cards (age, visits, diagnoses, treatments) is a `mat-card` element

### Requirement: Stat cards adapt to dark mode via design tokens
Stat-card backgrounds and text SHALL use the global Angular Material MDC CSS token overrides so they automatically switch between light and dark themes.

#### Scenario: Dark mode stat card background
- **WHEN** the user switches to dark mode
- **THEN** stat cards display the dark-theme surface colour defined by `--mdc-elevated-card-container-color`

#### Scenario: Light mode stat card background
- **WHEN** the user is in light mode
- **THEN** stat cards display the light-theme surface colour defined by `--mdc-elevated-card-container-color`

### Requirement: No custom stat-card CSS class remains in production styles
The `.stat-card` SCSS class SHALL be removed from `home.scss` and `patient-detail.scss` once replaced by `mat-card`.

#### Scenario: Styles compiled without .stat-card
- **WHEN** the production build runs
- **THEN** no `.stat-card` selector appears in the compiled CSS output
