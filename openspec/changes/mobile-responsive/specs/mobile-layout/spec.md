## ADDED Requirements

### Requirement: Mobile sidebar overlay

The app SHALL display the sidebar as a fixed overlay on screens narrower than 768px.

#### Scenario: Sidebar hidden by default on mobile

- **WHEN** the app loads on a screen narrower than 768px
- **THEN** the sidebar SHALL be hidden off-screen (collapsed)
- **AND** the main content SHALL span the full viewport width

#### Scenario: Hamburger opens sidebar overlay

- **WHEN** the user taps the hamburger button on mobile
- **THEN** the sidebar SHALL slide in from the left as a fixed overlay
- **AND** a semi-transparent backdrop SHALL appear over the main content

#### Scenario: Backdrop closes sidebar

- **WHEN** the user taps the backdrop on mobile
- **THEN** the sidebar SHALL close (slide back off-screen)

#### Scenario: Sidebar closes on navigation

- **WHEN** the user taps a nav link on mobile
- **THEN** the sidebar SHALL automatically close after navigation

### Requirement: Single column layout on mobile

The app layout SHALL collapse to a single column on screens narrower than 768px.

#### Scenario: Full width header and content

- **WHEN** the viewport is narrower than 768px
- **THEN** the top header SHALL span the full width
- **AND** the main content SHALL span the full width
