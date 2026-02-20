## Context

Starting from scratch. No existing codebase. The reference data was a single patient's Excel dental card (`Pavković Miodrag 417.xlsx`) used to derive all data models and seed data.

## Goals / Non-Goals

**Goals:**
- Working Angular app with full CRUD for all dental practice entities
- Data derived from real Excel dental card structure
- Serbian + English multilanguage support
- Signal-based reactive state

**Non-Goals:**
- Backend / real database (deferred to api-integration change)
- Authentication / user roles (deferred)
- Calendar/scheduling, PDF export, dental chart visualization

## Decisions

### Decision 1: Standalone components + signals (no NgModules, no RxJS subjects)

Angular 21 makes standalone the default. Signals replace BehaviorSubject for all local state, giving cleaner reactivity without subscription management.

### Decision 2: In-memory store with localStorage persistence

For the MVP, a signal-based service acts as an in-memory store with `localStorage` as a persistence layer. This avoids backend complexity while still persisting data across page refreshes.

### Decision 3: Three-interface model pattern (`Entity`, `EntityCreate`, `EntityUpdate`)

Separating read, create, and update shapes makes API boundaries explicit and avoids accidentally sending `id`/`createdAt` in create payloads.

### Decision 4: Custom `TranslateService` + `TranslatePipe`

Rather than pulling in a full i18n library (ngx-translate, Angular i18n), a lightweight custom solution was built. Translation files live in `public/i18n/` as flat JSON key-value maps.
