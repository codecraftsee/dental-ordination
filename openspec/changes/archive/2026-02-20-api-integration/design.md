## Context

The FastAPI backend (`dental-ordination-api`) was built in parallel. It exposes REST endpoints at `http://localhost:8000/api/...` with snake_case field names and JWT auth. The Angular frontend needed to switch from localStorage to real HTTP calls.

## Goals / Non-Goals

**Goals:**
- Full HTTP integration for all 5 entities (patients, doctors, visits, diagnoses, treatments)
- JWT auth with auto-refresh
- Transparent camelCase ↔ snake_case conversion so frontend models stay camelCase
- Route protection via guards

**Non-Goals:**
- Role-based UI (admin-only UI sections deferred)
- User management screens (deferred)

## Decisions

### Decision 1: Three separate HTTP interceptors

Separation of concerns: auth interceptor attaches tokens, error interceptor handles 401/refresh logic, case-transform interceptor handles field name conversion. Each can be tested and replaced independently.

### Decision 2: `caseTransformInterceptor` for automatic camelCase ↔ snake_case

Rather than manually mapping field names in every service, a single interceptor recursively converts all request body keys (camelCase → snake_case) and all response body keys (snake_case → camelCase). Frontend models stay idiomatic camelCase.

### Decision 3: Signal-based caching in services

Services maintain a `signal<T[]>` cache. `loadAll()` fetches from API and populates the cache. Mutations (`create`, `update`, `delete`) update the signal optimistically. This preserves the reactive signal API that components already use.

### Decision 4: JWT stored in `localStorage`

Tokens stored as `access_token` and `refresh_token` keys. The auth interceptor reads them on every request. On 401, the error interceptor attempts refresh before redirecting to `/login`.
