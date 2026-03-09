## ADDED Requirements

### Requirement: Book page rendering
The BookTableComponent SHALL render each data record as a single styled page that resembles a physical book page. Each page SHALL have an off-white background, subtle shadow on the right edge, slight border-radius, and a faint border to create a paper-like appearance.

#### Scenario: Single record per page
- **WHEN** the component receives a data array
- **THEN** each array item SHALL be rendered as one book page
- **AND** only the current page and its immediate neighbors (previous, next) SHALL exist in the DOM

#### Scenario: Paper-like page styling
- **WHEN** a book page is rendered
- **THEN** it SHALL have an off-white background color
- **AND** a soft shadow on the right edge suggesting stacked pages
- **AND** a thin pseudo-element on the right side suggesting page depth/thickness

### Requirement: Page-turn animation
The component SHALL animate transitions between pages using CSS 3D transforms to create a realistic page-flip effect.

#### Scenario: Forward page turn
- **WHEN** the user navigates to the next page
- **THEN** the current page SHALL rotate along its Y-axis using `rotateY()` within a 3D perspective container
- **AND** `backface-visibility: hidden` SHALL prevent the back of the page from showing

#### Scenario: Backward page turn
- **WHEN** the user navigates to the previous page
- **THEN** the next page SHALL rotate in the opposite direction to reveal the previous page

#### Scenario: Animation performance
- **WHEN** a page-turn animation plays
- **THEN** the component SHALL use only `transform` and `opacity` properties for animation (compositor-friendly)
- **AND** `will-change: transform` SHALL be applied only during active transitions

### Requirement: Content projection
The component SHALL accept an `ng-template` with a `#bookPage` reference for consumer-defined page content.

#### Scenario: Custom page template
- **WHEN** the consumer provides an `ng-template #bookPage` with a `let-item` context variable
- **THEN** each book page SHALL render using that template with the corresponding data item as context

#### Scenario: No template provided
- **WHEN** no `ng-template #bookPage` is provided
- **THEN** the component SHALL render a fallback showing the JSON representation of each item

### Requirement: Swipe gesture navigation
The component SHALL support left/right swipe gestures on touch devices to navigate between pages.

#### Scenario: Swipe left to go forward
- **WHEN** the user swipes left with a horizontal delta greater than 50px
- **AND** the horizontal delta exceeds the vertical delta (dominant horizontal swipe)
- **THEN** the component SHALL navigate to the next page

#### Scenario: Swipe right to go backward
- **WHEN** the user swipes right with a horizontal delta greater than 50px
- **AND** the horizontal delta exceeds the vertical delta
- **THEN** the component SHALL navigate to the previous page

#### Scenario: Swipe at boundaries
- **WHEN** the user swipes left on the last page
- **THEN** no navigation SHALL occur
- **WHEN** the user swipes right on the first page
- **THEN** no navigation SHALL occur

### Requirement: Button navigation
The component SHALL provide previous and next buttons for non-touch navigation.

#### Scenario: Previous button
- **WHEN** the user clicks the previous button
- **THEN** the component SHALL navigate to the previous page
- **WHEN** the current page is the first page
- **THEN** the previous button SHALL be disabled

#### Scenario: Next button
- **WHEN** the user clicks the next button
- **THEN** the component SHALL navigate to the next page
- **WHEN** the current page is the last page
- **THEN** the next button SHALL be disabled

### Requirement: Page indicator
The component SHALL display a page indicator showing the current position within the data set.

#### Scenario: Page count display
- **WHEN** the component renders
- **THEN** a label SHALL display the current page number and total count (e.g., "3 of 12")

#### Scenario: Page indicator updates
- **WHEN** the user navigates to a different page
- **THEN** the page indicator SHALL update to reflect the new position

### Requirement: Mobile-only rendering
The BookTableComponent SHALL render only on mobile viewports (max-width: 767px).

#### Scenario: Mobile viewport
- **WHEN** the viewport width is 767px or less
- **THEN** the book-table component SHALL render its book page interface

#### Scenario: Desktop viewport
- **WHEN** the viewport width is greater than 767px
- **THEN** the book-table component SHALL not render any content
- **AND** the parent component's mat-table SHALL remain visible

#### Scenario: Viewport resize
- **WHEN** the viewport transitions between mobile and desktop breakpoints
- **THEN** the component SHALL reactively switch between rendering and not rendering

### Requirement: Data change handling
The component SHALL handle changes to the input data array gracefully.

#### Scenario: Data array changes
- **WHEN** the data array reference changes (e.g., due to filtering)
- **THEN** the component SHALL reset to page 0

#### Scenario: Empty data
- **WHEN** the data array is empty
- **THEN** the component SHALL display a "no data" message instead of book pages

### Requirement: Keyboard navigation
The component SHALL support keyboard arrow keys for navigation for accessibility.

#### Scenario: Arrow key navigation
- **WHEN** the component has focus and the user presses the right arrow key
- **THEN** the component SHALL navigate to the next page
- **WHEN** the user presses the left arrow key
- **THEN** the component SHALL navigate to the previous page

#### Scenario: Accessibility announcements
- **WHEN** the page changes
- **THEN** an `aria-live="polite"` region SHALL announce the new page position
