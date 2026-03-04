## Context

Angular 21 standalone app with FastAPI backend. Auth via JWT Bearer token. All authenticated users are implicitly admin (single-clinic app, no role hierarchy needed). Destructive operations must be hard to trigger accidentally.

## Goals / Non-Goals

**Goals:**
- Admin page accessible from the sidebar
- Delete operations per entity type: visits, patients, doctors, diagnoses, treatments
- Single "Delete all data" action
- Confirmation gate: user must type `DELETE` before action button activates
- Clear success/error feedback after each operation
- Backend endpoint contract defined (implementation in FastAPI repo)

**Non-Goals:**
- Role-based access control (RBAC) — all authenticated users can access admin
- Soft-delete / restore functionality
- Audit log of delete operations
- Per-record deletion (already possible via individual record pages)

## Decisions

### Decision 1: Inline confirmation with typed keyword

Each delete action card has an inline `<input>` where the user must type the word `DELETE` exactly. The action button stays disabled until the input matches. On submit the input is cleared and the button returns to disabled state.

This avoids modal fatigue (multiple steps) while still preventing accidental clicks.

```
┌─────────────────────────────────────────────┐
│ 🗑 Delete all visits                         │
│ Permanently removes all visit records.       │
│                                             │
│ Type DELETE to confirm:                     │
│ ┌─────────────────┐  ┌──────────────────┐  │
│ │                 │  │  Delete visits   │  │
│ └─────────────────┘  │   (disabled)     │  │
│                      └──────────────────┘  │
└─────────────────────────────────────────────┘
```

### Decision 2: Page layout — Danger Zone cards

The Admin page has a single "Danger Zone" section. Each entity type is a separate card with a red left border and warning icon. The "Delete all data" card is visually distinct (full danger styling) and placed last.

```
/admin
├── Page header: "Admin"
└── Danger Zone section
    ├── Card: Delete all visits
    ├── Card: Delete all patients
    ├── Card: Delete all doctors
    ├── Card: Delete all diagnoses
    ├── Card: Delete all treatments
    └── Card: Delete ALL data  ← red background, bolder styling
```

### Decision 3: Service and signal cache invalidation

`AdminService` calls the backend DELETE endpoints and returns `Observable<void>`. On success the component calls `loadAll()` on all relevant services to refresh the signal caches so the dashboard stats and lists reflect the deletion immediately without a full page reload.

### Decision 4: Backend cascade order for "delete all"

The backend `DELETE /admin/all` handles cascade internally. Frontend sends a single request and does not need to orchestrate order.

For individual entity endpoints:
- `DELETE /admin/visits` — safe, no dependents
- `DELETE /admin/patients` — backend cascades patient's visits first
- `DELETE /admin/doctors` — safe, no dependents (visits reference doctor by ID but are not cascade-deleted)
- `DELETE /admin/diagnoses` — safe
- `DELETE /admin/treatments` — safe

### Decision 5: Sidebar nav item

A new **Admin** nav item is added to the bottom of the sidebar (below the main nav group, above or replacing any future settings item). Uses a settings/admin icon glyph.
