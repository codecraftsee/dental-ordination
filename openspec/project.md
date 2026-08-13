# Project Context

## Purpose

Practice-management frontend for a dental ordination. Staff record patients,
their visits, and the diagnoses and treatments applied per tooth; a per-patient
dental card and document store back that up; an admin panel imports historical
records from XLSX and does bulk cleanup.

The users are dentists and nurses working in Serbian, with English as the second
language. Clinical and payment records are the data at stake, so correctness and
not-losing-a-write matter more than cleverness.

## Tech Stack

- Angular 21, TypeScript 5.9 (strict), SCSS, Angular Material
- Vitest + jsdom for unit tests, ESLint flat config with angular-eslint
- npm 11; `npm start`, `npm test`, `npm run lint`, `npm run build`
- Backend: FastAPI + PostgreSQL in a separate repo (`../dental-ordination-api`)

## Conventions

Code conventions live in `CLAUDE.md` at the repo root — file naming, standalone
components, `inject()` over constructor injection, signals for state, `OnPush`
everywhere, native control flow, the `any` ban, and the mandatory unit test per
component and service. Read it before writing code; it is the authority, and this
file deliberately does not restate it.

Two rules worth repeating here because they shape *specs*, not just code:

- **Accessibility is not optional.** Every component must pass AXE and meet
  WCAG AA. A spec that adds UI should say what the keyboard and screen-reader
  behaviour is, not leave it to the implementation.
- **Both languages, always.** Every user-facing string is a translation key
  present in both `public/i18n/en.json` and `public/i18n/sr.json`. A spec that
  adds copy should name the keys.

## Architecture

- **Services** own state. Each entity service extends `EntityCacheService`
  (`src/app/services/entity-cache.service.ts`), which holds the signal-backed
  cache and the CRUD calls; subclasses add their own query methods. Components
  read through `computed()` off those caches rather than keeping their own copies.
- **Case conversion is automatic.** `caseTransformInterceptor` rewrites request
  bodies and query params camelCase → snake_case, and responses back. Write
  frontend models in camelCase and let it work; the one exception is the XLSX
  import, which streams over `fetch` and converts explicitly.
- **Permissions** are checked with `authService.hasPermission()`, the
  `hasPermission` pipe, and `permissionGuard` on routes. The permission strings
  mirror `app/permissions.py` in the API repo — that file is the source of truth.
- **Writes are not torn down.** Reads use `takeUntilDestroyed`; writes
  deliberately do not, because destroying a component cannot un-apply what the
  server already did. `src/app/write-survives-destroy.spec.ts` enforces this, and
  every such call site carries a comment saying why. A spec that adds a mutation
  should assume the same.

## Backend

`../dental-ordination-api` is the contract. Read `app/routers/` for endpoints and
query params, `app/schemas/` for payload shapes, and `app/permissions.py` for
permission names. Treat it as read-only from this repo; if the frontend and the
API disagree, that is a finding to raise, not something to paper over.

Known contract friction worth knowing before writing a spec that touches money:
prices are `Decimal` on the backend and serialize to JSON as strings, while the
frontend types them as `number`.
