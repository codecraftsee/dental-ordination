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
- Integrate into the dental card page — on mobile, patient visit history renders as book pages instead of stacked cards, each page showing one visit (date, diagnosis, treatment, price, doctor)
- Integrate into the home page — on mobile, recent visits section renders as book pages instead of stacked cards, each page showing one visit (date, patient, doctor, diagnosis, treatment, price)
- Desktop view remains unchanged (standard mat-table with pagination / karton-table / data-table)

## Capabilities

### New Capabilities
- `book-table`: Standalone Angular component that renders tabular data as a book with page-turn animations on mobile. Accepts column configs and data array, supports swipe gestures, and provides previous/next/page-select navigation.

### Modified Capabilities
- `mobile-layout`: Patient list mobile view will use the new book-table component instead of the current card-based table layout.
- `dental-card-mobile`: Dental card visit history on mobile will use book-table (one visit per page) instead of stacked cards.
- `home-recent-visits-mobile`: Home page recent visits on mobile will use book-table (one visit per page) instead of stacked cards.

## Impact

- **New files**: `src/app/shared/book-table/` (book-table.ts, book-table.html, book-table.scss)
- **Modified files**: `src/app/patients/patient-list/patient-list.html` (conditionally render book-table on mobile), `src/app/dental-card/dental-card.html` + `dental-card.ts` + `dental-card.scss` (book-table for visit history on mobile), `src/app/home/home.html` + `home.ts` + `home.scss` (book-table for recent visits on mobile)
- **Dependencies**: No new packages — pure CSS animations + Angular signals + touch events
- **Performance**: CSS 3D transforms are GPU-accelerated; only 3 pages rendered at a time (current, previous, next) for efficiency
