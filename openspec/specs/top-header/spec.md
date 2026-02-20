# top-header Specification

## Purpose
TBD - created by archiving change doclinic-redesign. Update Purpose after archive.
## Requirements
### Requirement: Fixed top header bar

The app SHALL display a fixed top header bar above the main content area (not above the sidebar).

#### Scenario: Header contains controls

- **WHEN** the user is authenticated
- **THEN** the top header displays: hamburger/toggle button (left), theme toggle, language switcher, logout button (right)

#### Scenario: Hamburger toggles sidebar

- **WHEN** the user clicks the hamburger button in the header
- **THEN** the sidebar collapses or expands

