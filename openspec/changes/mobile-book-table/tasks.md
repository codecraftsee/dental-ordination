## 1. Book Table Component Scaffold

- [ ] 1.1 Create `src/app/shared/book-table/` directory with `book-table.ts`, `book-table.html`, `book-table.scss`
- [ ] 1.2 Define component inputs: `data` (array), content child `#bookPage` ng-template
- [ ] 1.3 Add `isMobile` signal using `window.matchMedia('(max-width: 767px)')` with resize listener
- [ ] 1.4 Add `currentIndex` signal with `computed()` derivations: `currentItem`, `hasPrev`, `hasNext`, `pageLabel`
- [ ] 1.5 Add `effect()` to reset `currentIndex` to 0 when data array reference changes

## 2. Page Layout and Styling

- [ ] 2.1 Build the book container HTML: 3D perspective wrapper, previous/current/next page panels
- [ ] 2.2 Style book pages with paper-like appearance: off-white background, right-edge shadow, border-radius, faint border
- [ ] 2.3 Add page-edge pseudo-element on the right side for depth/thickness illusion
- [ ] 2.4 Implement content projection rendering with `ng-template` outlet and fallback JSON display

## 3. Page-Turn Animation

- [ ] 3.1 Add CSS 3D transform styles: `perspective` on container, `rotateY()` transitions on pages
- [ ] 3.2 Set `backface-visibility: hidden` and `transform-style: preserve-3d` on page elements
- [ ] 3.3 Add transition classes for forward and backward page turns with appropriate timing
- [ ] 3.4 Apply `will-change: transform` only during active transitions, remove after completion

## 4. Navigation

- [ ] 4.1 Implement `goNext()` and `goPrev()` methods that update `currentIndex` and trigger animation
- [ ] 4.2 Add previous/next Material icon buttons with disabled state at boundaries
- [ ] 4.3 Add page indicator label showing "X of Y"
- [ ] 4.4 Add swipe gesture detection via `touchstart`/`touchmove`/`touchend` host bindings with 50px threshold and dominant-axis check
- [ ] 4.5 Add keyboard arrow key support via `keydown` host binding

## 5. Accessibility

- [ ] 5.1 Add `aria-live="polite"` region that announces page changes
- [ ] 5.2 Add `tabindex="0"` and focus indicators on navigation buttons
- [ ] 5.3 Add appropriate ARIA labels on nav buttons and the book container

## 6. Patient List Integration

- [ ] 6.1 Import `BookTableComponent` in patient-list component
- [ ] 6.2 Add `<app-book-table>` with `#bookPage` template showing patient name, city, phone, email
- [ ] 6.3 Conditionally hide mat-table on mobile when book-table is active
- [ ] 6.4 Add i18n keys for book-table labels (page indicator, nav buttons) to both `en.json` and `sr.json`

## 7. Dental Card Integration

- [ ] 7.1 Import `BookTableComponent` in dental-card component
- [ ] 7.2 Add `<app-book-table [data]="visits()">` with `#bookPage` template showing date, diagnosis (formatted), treatment (formatted), price, doctor name
- [ ] 7.3 Wrap book-table in `.mobile-book-view` div (shown only on mobile via CSS)
- [ ] 7.4 Hide `.karton-table` on mobile when book-table is active (add `.desktop-table` class or media query)
- [ ] 7.5 Keep total cost summary visible below the book-table as a standalone footer on mobile
- [ ] 7.6 Ensure desktop and print views remain unchanged

## 8. Home Page Integration

- [ ] 8.1 Import `BookTableComponent` in home component
- [ ] 8.2 Add `<app-book-table [data]="recentVisits">` with `#bookPage` template showing date, patient (linked), doctor, diagnosis, treatment, price
- [ ] 8.3 Wrap book-table in `.mobile-book-view` div (shown only on mobile via CSS)
- [ ] 8.4 Hide `.data-table` on mobile when book-table is active (add `.desktop-table` class)
- [ ] 8.5 Add mobile/desktop visibility media queries to home SCSS

## 9. Testing

- [ ] 9.1 Create `book-table.spec.ts` with tests for: page rendering, navigation, boundary conditions, data change reset, empty data display
- [ ] 9.2 Add swipe gesture simulation tests
- [ ] 9.3 Add keyboard navigation tests
- [ ] 9.4 Update patient-list tests to cover book-table integration on mobile
- [ ] 9.5 Add dental-card tests to verify book-table renders visit data on mobile and desktop table remains untouched
- [ ] 9.6 Add home page tests to verify book-table renders recent visits on mobile and desktop table remains untouched
