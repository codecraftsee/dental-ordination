## MODIFIED Requirements

### Requirement: Home page mobile layout

The home page SHALL be fully usable on screens as narrow as 360px.

#### Scenario: Stats grid adapts to mobile

- **WHEN** the viewport is narrower than 768px
- **THEN** the stats grid SHALL display 2 columns instead of 4

#### Scenario: Action buttons stack on mobile

- **WHEN** the viewport is narrower than 768px
- **THEN** the action buttons SHALL stack vertically
- **AND** each button SHALL span the full width

#### Scenario: Recent visits table renders as cards on mobile

- **WHEN** the viewport is narrower than 768px
- **THEN** the table header SHALL be hidden
- **AND** each table row SHALL be displayed as a card (block layout)
- **AND** each cell SHALL show its column label via a `data-label` attribute rendered with CSS `::before`
- **AND** the price cell SHALL be visually emphasised (bold, primary colour)
- **AND** the layout SHALL NOT cause horizontal overflow

#### Scenario: Recent visits book-table shows paid indicator

- **WHEN** the viewport is narrower than 768px
- **AND** the recent visits render in the book-table component
- **THEN** each visit page SHALL show a paid/unpaid icon next to the price field
