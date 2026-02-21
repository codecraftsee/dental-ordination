## ADDED Requirements

### Requirement: Home page mobile layout

The home page SHALL be fully usable on screens as narrow as 360px.

#### Scenario: Stats grid adapts to mobile

- **WHEN** the viewport is narrower than 768px
- **THEN** the stats grid SHALL display 2 columns instead of 4

#### Scenario: Action buttons stack on mobile

- **WHEN** the viewport is narrower than 768px
- **THEN** the action buttons SHALL stack vertically
- **AND** each button SHALL span the full width

#### Scenario: Recent visits table is scrollable

- **WHEN** the viewport is narrower than the table's minimum width (620px)
- **THEN** the table SHALL be horizontally scrollable within its container
- **AND** the table SHALL NOT cause page-level horizontal overflow

### Requirement: Global mobile layout fixes

The app SHALL NOT produce horizontal overflow at 360px viewport width.

#### Scenario: Container padding removed on mobile

- **WHEN** the viewport is narrower than 768px
- **THEN** the `.container` SHALL have no horizontal padding (main content already provides it)

#### Scenario: Form rows stack on mobile

- **WHEN** a `.form-row` is rendered on a screen narrower than 768px
- **THEN** it SHALL display as a single column
