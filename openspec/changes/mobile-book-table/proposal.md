## Why

Mobile data tables currently use a card-based layout that stacks rows vertically, which works but feels generic and doesn't leverage the mobile form factor well. We want to create a distinctive, engaging mobile experience by transforming tables into a book-like interface where each record is a "page" that users can flip through with realistic page-turn animations — making data browsing feel tactile and memorable.

## What Changes

- Create a new standalone `BookTableComponent` that renders table data as book pages on mobile
- Each table row becomes a styled card that looks like a page in a physical book (paper texture, subtle shadow, slight curl)
- Page-turn animation when navigating between records (CSS 3D transform flip effect)
- Swipe gesture support (left/right) for flipping pages on touch devices
- Previous/next navigation buttons for non-touch interaction
- Page indicator showing current position (e.g., "3 of 12")
- Component accepts the same data inputs as mat-table (column definitions + data source)
- Initial integration on the patients list page as proof of concept (mobile breakpoint only)
- Desktop view remains unchanged (standard mat-table with pagination)

## Capabilities

### New Capabilities
- `book-table`: Standalone Angular component that renders tabular data as a book with page-turn animations on mobile. Accepts column configs and data array, supports swipe gestures, and provides previous/next/page-select navigation.

### Modified Capabilities
- `mobile-layout`: Patient list mobile view will use the new book-table component instead of the current card-based table layout.

## Impact

- **New files**: `src/app/shared/book-table/` (book-table.ts, book-table.html, book-table.scss)
- **Modified files**: `src/app/patients/patient-list/patient-list.html` (conditionally render book-table on mobile)
- **Dependencies**: No new packages — pure CSS animations + Angular signals + touch events
- **Performance**: CSS 3D transforms are GPU-accelerated; only 3 pages rendered at a time (current, previous, next) for efficiency
