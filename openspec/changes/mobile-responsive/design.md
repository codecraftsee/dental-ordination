## Context

Angular 21 app with CSS grid sidebar layout. Target device: Samsung Galaxy S8 (360px CSS width). Breakpoint: `max-width: 767px`.

## Goals / Non-Goals

**Goals:**
- Sidebar as fixed overlay on mobile with backdrop
- Home page usable at 360px
- Global form/table/grid fixes for narrow screens

**Non-Goals:**
- Tablet-specific layouts (768px–1024px)
- Touch gesture swipe to open/close sidebar
- Per-page column hiding on tables

## Decisions

### Decision 1: Sidebar as fixed overlay on mobile

On mobile the sidebar is removed from the CSS grid and becomes `position: fixed`. Default state is collapsed (off-screen via `transform: translateX(-100%)`). When open, it overlays the content with a semi-transparent backdrop.

```
Mobile layout:
┌──────────────────────┐
│   top-header         │  ← full width, grid-column: 1
├──────────────────────┤
│   main content       │  ← full width, grid-column: 1
│                      │
└──────────────────────┘

When sidebar open:
┌──────────┬────────────┐
│ sidebar  │ backdrop   │  ← sidebar fixed z-index 200, backdrop z-index 150
│ (overlay)│ (click →   │
│          │  close)    │
└──────────┴────────────┘
```

Sidebar initialises as `collapsed = true` on mobile (ignores localStorage on mobile).

### Decision 2: App grid collapses to single column on mobile

```scss
@media (max-width: 767px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
  .top-header, .main-content { grid-column: 1; }
}
```

### Decision 3: Home page layout

| Element | Desktop | Mobile |
|---|---|---|
| Stats grid | 4 columns | 2×2 grid |
| Action buttons | row flex | stacked full-width |
| Recent visits table | inline | scroll wrapper, min-width 620px |

### Decision 4: Global mobile overrides

- `.container` removes horizontal padding (`.main-content` already provides it)
- `.form-row` → single column
- `.page-header` → stack vertically
- `.detail-grid` → single column
- `.form-actions` → wrap, buttons stretch
