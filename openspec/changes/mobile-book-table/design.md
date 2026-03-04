## Context

The app currently renders mobile tables using a stacked card layout (`.data-table-card` class in `styles.scss`). All list pages (patients, doctors, visits, diagnoses, treatments) use `mat-table` with pagination on desktop. On mobile (`max-width: 767px`), some columns are hidden but the table structure remains.

We want to replace the mobile table view with a book-like interface. The component must be standalone, reusable, and opt-in per page. Patient list is the first integration target.

The project uses Angular 21 with signals, standalone components, SCSS with CSS custom properties, and no external animation libraries.

## Goals / Non-Goals

**Goals:**
- Create a reusable `BookTableComponent` that transforms any data array into a page-flippable book on mobile
- Deliver a realistic page-turn effect using CSS 3D transforms (no JS animation libraries)
- Support touch swipe gestures and button navigation
- Show page indicator with current/total count
- Integrate into patient list as proof of concept
- Maintain existing desktop mat-table experience untouched

**Non-Goals:**
- Multi-record pages (each page = one record for now)
- Pinch-to-zoom or complex gestures beyond left/right swipe
- Print support for book view
- Server-side pagination integration (works with in-memory data only)
- Replacing desktop table views

## Decisions

### 1. Animation technique: CSS 3D transforms with `perspective` and `rotateY`

**Rationale**: GPU-accelerated, no dependencies, works on all modern mobile browsers. The page-turn effect is achieved by rotating a card along its Y-axis within a 3D perspective container.

**Alternatives considered**:
- Web Animations API — more control but harder to get the book "feel" right
- Canvas-based (turn.js style) — heavy dependency, overkill for card-per-page
- Lottie animations — requires design assets, not dynamic

**Approach**: Three-panel rendering (previous, current, next). Only the visible page and its neighbors are in the DOM. Transition between pages uses `transform: rotateY()` with `backface-visibility: hidden` to create the flip illusion.

### 2. Component API: Content projection with column templates

**Rationale**: The component needs to render arbitrary data fields per page. Using `ng-template` with a context variable lets consumers define how each "page" looks while the book component handles layout and animation.

```html
<app-book-table [data]="patients()" [currentIndex]="currentPage()">
  <ng-template #bookPage let-item>
    <div class="field">{{ item.firstName }} {{ item.lastName }}</div>
    <div class="field">{{ item.city }}</div>
  </ng-template>
</app-book-table>
```

**Alternatives considered**:
- Column definition objects (like mat-table) — too rigid for the visual card layout
- Render callback function — not idiomatic Angular

### 3. Gesture handling: Native `touchstart`/`touchmove`/`touchend` via `host` bindings

**Rationale**: No dependency needed. Swipe detection is straightforward — track X delta between touchstart and touchend, threshold of 50px to trigger page flip. Using `host` object in decorator per project conventions (no `@HostListener`).

### 4. Page styling: Paper-like appearance with CSS

**Rationale**: Subtle off-white background, soft shadow on the right edge (like stacked pages), slight `border-radius` on corners, and a faint border give the book page feel. A thin "page edge" pseudo-element on the right side suggests depth/thickness.

### 5. Mobile-only rendering: `@if` with a `isMobile` signal using `matchMedia`

**Rationale**: The component renders only on mobile. Use `window.matchMedia('(max-width: 767px)')` via a signal that updates on resize. On desktop, the standard mat-table renders instead. This keeps the existing desktop experience completely untouched.

### 6. State management: Signals for current page index

**Rationale**: `currentIndex = signal(0)` managed inside the book component. Parent can optionally bind to it. `computed()` derives `currentItem`, `hasPrev`, `hasNext`, `pageLabel`.

## Risks / Trade-offs

- **[Animation jank on low-end devices]** → Mitigation: Use `will-change: transform` only during transitions, keep DOM minimal (3 pages max), use `transform` and `opacity` only (compositor-friendly properties)
- **[Swipe conflicts with browser back gesture]** → Mitigation: Only trigger page flip when horizontal swipe is dominant (deltaX > deltaY), add a small dead zone
- **[Accessibility]** → Mitigation: Add `aria-live="polite"` region for page changes, keyboard arrow key support, visible focus indicators on nav buttons
- **[Data updates while browsing]** → Mitigation: Reset to page 0 when data array reference changes (via `effect()`)

## Open Questions

- Should the page-turn direction match reading direction (left-to-right = next page)?
- Do we want a "page peek" effect where the edge of the next page is slightly visible?
