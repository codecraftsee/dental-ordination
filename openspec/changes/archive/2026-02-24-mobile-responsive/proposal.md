## Proposal: Mobile Responsiveness

### Problem

The app is not usable on mobile devices (tested on Samsung Galaxy S8, 360px wide). Key issues:

- The sidebar occupies grid space on mobile, leaving no room for content
- Stats grid renders 4 columns that are too narrow to read
- Action buttons overflow horizontally
- Tables overflow the viewport with no scroll
- Double padding from `.main-content` + `.container` wastes screen space

### Solution

**Sidebar** — Convert to a fixed overlay on mobile: hidden off-screen by default, slides in when the hamburger is tapped, closes when backdrop or nav link is tapped.

**Home page** — Stats grid 2×2, action buttons stacked full-width, table wrapped in a horizontal scroll container.

**Global** — Form rows stack to single column, page headers stack, detail grids stack, container removes double padding on mobile.

### Scope

- `src/app/app.scss` — mobile grid layout, overlay backdrop
- `src/app/shared/sidebar/sidebar.scss` — fixed overlay behavior
- `src/app/shared/sidebar/sidebar.ts` — init collapsed on mobile
- `src/app/app.ts` — close sidebar on navigation on mobile
- `src/app/app.html` — overlay backdrop element
- `src/app/home/home.scss` — home page mobile layout
- `src/app/home/home.html` — table scroll wrapper
- `src/styles.scss` — global mobile overrides
