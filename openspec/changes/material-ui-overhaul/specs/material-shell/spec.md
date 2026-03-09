## ADDED Requirements

### Requirement: App shell uses mat-sidenav-container and mat-toolbar

The authenticated app layout SHALL use `mat-sidenav-container`, `mat-sidenav`, and `mat-toolbar` instead of a custom CSS grid.

#### Scenario: Desktop — sidenav is persistent side panel

- **WHEN** the viewport is 768px or wider
- **THEN** the sidenav SHALL render in `mode="side"` (persistent)
- **AND** the sidenav SHALL push the main content area when open
- **AND** the sidenav SHALL be open by default (restoring from localStorage)

#### Scenario: Mobile — sidenav is overlay

- **WHEN** the viewport is narrower than 768px
- **THEN** the sidenav SHALL render in `mode="over"` (floating overlay)
- **AND** the sidenav SHALL be closed by default
- **AND** the Material backdrop SHALL appear when the sidenav is open
- **AND** tapping the backdrop SHALL close the sidenav

#### Scenario: Hamburger toggles the sidenav

- **WHEN** the user clicks the hamburger `mat-icon-button` in the toolbar
- **THEN** the sidenav SHALL toggle open or closed

#### Scenario: Sidenav closes on navigation on mobile

- **WHEN** the user taps a nav link while on mobile
- **THEN** the sidenav SHALL close automatically after navigation

#### Scenario: Toolbar contains app actions

- **WHEN** the authenticated layout renders
- **THEN** a `mat-toolbar` SHALL appear at the top of the content area
- **AND** it SHALL contain: hamburger `mat-icon-button`, language switcher, theme toggle `mat-icon-button`, logout `mat-stroked-button`

#### Scenario: Sidenav open state persists

- **WHEN** the user toggles the sidenav on desktop
- **THEN** the open/closed state SHALL be persisted to `localStorage`
- **AND** on next page load the sidenav SHALL restore to its last state

---

### Requirement: Custom shell CSS is removed

#### Scenario: No custom app-layout grid

- **WHEN** the app renders
- **THEN** no `.app-layout` CSS grid class SHALL be used
- **AND** no `.top-header` class SHALL be used
- **AND** no `.sidebar-overlay` div SHALL be present (Material handles the backdrop)
