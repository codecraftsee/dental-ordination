## MODIFIED Requirements

### Requirement: Left sidebar navigation

The app SHALL display a Material `mat-sidenav` containing a `mat-nav-list` for all navigation links, with `mat-icon` icons instead of emoji.

#### Scenario: Sidebar visible on authenticated pages

- **WHEN** the user is authenticated
- **THEN** a `mat-sidenav` is visible with: logo area, `mat-nav-list` with items for Home, Patients, Doctors, Visits, Diagnoses, Treatments, Admin
- **AND** each item SHALL use `mat-icon` for its icon (not emoji)

#### Scenario: Active route highlighted

- **WHEN** the user is on a given route
- **THEN** the corresponding `mat-list-item` SHALL have `[activated]="true"`
- **AND** the active item SHALL show the primary colour background via Material's activated state

#### Scenario: Sidebar collapse toggle on desktop

- **WHEN** the user clicks the hamburger button in the toolbar (desktop)
- **THEN** the sidenav closes to a collapsed icon-only rail
- **AND** the main content area expands to fill the space
- **AND** the collapsed state is persisted to `localStorage`

#### Scenario: Sidebar restored on reload

- **WHEN** the page is reloaded
- **THEN** the sidenav restores to its last open/closed state on desktop

---

### Requirement: Material icon names for nav items

#### Scenario: Nav icons use Material Symbols Outlined

- **WHEN** the sidebar nav renders
- **THEN** each nav item SHALL display a `mat-icon` with the following icon names:
  - Home → `home`
  - Patients → `people`
  - Doctors → `medical_services`
  - Visits → `calendar_month`
  - Diagnoses → `biotech`
  - Treatments → `medication`
  - Admin → `settings`
