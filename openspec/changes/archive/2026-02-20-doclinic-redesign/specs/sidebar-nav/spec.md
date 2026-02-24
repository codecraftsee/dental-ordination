## ADDED Requirements

### Requirement: Left sidebar navigation

The app SHALL display a fixed left sidebar containing all navigation links.

#### Scenario: Sidebar visible on authenticated pages

- **WHEN** the user is authenticated
- **THEN** a left sidebar is visible with: logo, nav links (Home, Patients, Doctors, Visits, Diagnoses, Treatments), and a collapse toggle at the bottom

#### Scenario: Active route highlighted

- **WHEN** the user is on a given route
- **THEN** the corresponding sidebar link shows the active state with `--color-sidebar-active` background

#### Scenario: Sidebar collapse toggle

- **WHEN** the user clicks the collapse toggle (or hamburger in header)
- **THEN** the sidebar collapses to a 70px icon-only rail
- **AND** the main content area expands to fill the space
- **AND** the collapsed state is persisted to `localStorage`

#### Scenario: Sidebar restored on reload

- **WHEN** the page is reloaded
- **THEN** the sidebar restores to its last collapsed/expanded state
