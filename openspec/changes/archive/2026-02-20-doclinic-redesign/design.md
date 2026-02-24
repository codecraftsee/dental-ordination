## Context

Current app: single top navbar, all components use CSS custom properties, Angular standalone components. The layout is a simple `<nav> + <main>` structure in `app.html`. All navigation links are in `app.html`.

## Goals / Non-Goals

**Goals:**
- Left sidebar with all nav links, logo, collapse toggle
- Fixed top header with hamburger, theme toggle, language switcher, logout
- Sidebar collapses to icon-only rail on toggle (saved to localStorage)
- Full color palette replacement matching Doclinic index5
- IBM Plex Sans + Rubik fonts
- Dark mode compatible

**Non-Goals:**
- Multi-level nested sidebar menus (keep single level)
- Notification bell / user avatar dropdown (out of scope)
- Right-to-left (RTL) support

## Decisions

### Decision 1: New palette

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#5156be` | Purple-blue — buttons, links, active states |
| `--color-primary-dark` | `#3c40a0` | Hover |
| `--color-primary-light` | `#6c70c8` | Lighter tint |
| `--color-accent` | `#05825f` | Success green (repurposed as accent) |
| `--color-sidebar` | `#15243e` | Sidebar + header background |
| `--color-sidebar-text` | `rgba(255,255,255,0.7)` | Sidebar nav text |
| `--color-sidebar-active` | `#5156be` | Active nav item bg |
| `--color-background` | `#f3f6f9` | Page body background |
| `--color-surface` | `#ffffff` | Card/panel backgrounds |
| `--color-surface-variant` | `#e4e6ef` | Secondary surfaces |
| `--color-text` | `#172b4c` | Primary text |
| `--color-text-secondary` | `#7e8299` | Muted text |
| `--color-border` | `#f3f6f9` | Card/input borders |
| `--color-highlight` | `#ffa800` | Warning/highlight orange |
| `--color-navbar` | `#15243e` | Top header background |

**Dark mode overrides:**
| Token | Dark value |
|---|---|
| `--color-sidebar` | `#0c1a32` |
| `--color-navbar` | `#0c1a32` |
| `--color-background` | `#1a1d23` |
| `--color-surface` | `#1e2532` |
| `--color-surface-variant` | `#262f3e` |
| `--color-text` | `#e9ecef` |
| `--color-text-secondary` | `#b5b5c3` |
| `--color-border` | `#2d3748` |

### Decision 2: Sidebar as a standalone Angular component

Create `src/app/shared/sidebar/sidebar.ts` + `sidebar.html` + `sidebar.scss`. Inject `ThemeService` and a new `SidebarService` (or use a signal in App) to manage collapsed state. Import into `App`.

### Decision 3: Layout via CSS grid

```
app layout:
┌─────────┬──────────────────────┐
│         │   top-header         │
│ sidebar │──────────────────────│
│  250px  │   <router-outlet>    │
│         │                      │
└─────────┴──────────────────────┘
```

Use CSS:
```scss
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--header-height) 1fr;
  min-height: 100vh;
}
```

Sidebar spans both rows. Header spans column 2 row 1. Main spans column 2 row 2.

Collapsed state: `--sidebar-width` switches from `250px` to `70px`. Sidebar shows icons only.

### Decision 4: Cards get rounded corners and subtle border

```scss
.card {
  border-radius: 8px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
```

### Decision 5: Restore rounded buttons

The flat buttons from DocClinic palette don't match Doclinic index5. Restore `border-radius: 4px` on `.btn`.
