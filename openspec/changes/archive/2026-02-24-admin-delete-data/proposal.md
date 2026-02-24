## Proposal: Admin — Delete All Data

### Problem

There is no way for an administrator to reset or wipe the clinic's data. This is needed in scenarios such as:

- Migrating from a test/demo dataset to a live dataset
- Clearing stale records after a bulk import went wrong
- Resetting the system for a new season or clinic handover

Currently the only option is to delete records one by one from each list page, which is impractical with hundreds of records.

### Solution

Add a dedicated **Admin** page (`/admin`) that exposes a **Danger Zone** panel. The panel provides targeted delete operations per entity type, plus a single nuclear "Delete all data" action. Every destructive action is guarded by an inline confirmation step requiring the user to type `DELETE` before the button becomes enabled.

The backend (FastAPI) exposes a set of `DELETE /admin/{entity}` endpoints. The frontend calls these via a new `AdminService` and shows real-time feedback (success / error banner).

### Scope

**Backend (FastAPI — separate repo, endpoint contract only):**
- `DELETE /admin/visits` — hard-delete all visit records
- `DELETE /admin/patients` — hard-delete all patients (cascades visits)
- `DELETE /admin/doctors` — hard-delete all doctors
- `DELETE /admin/diagnoses` — hard-delete all diagnoses
- `DELETE /admin/treatments` — hard-delete all treatments
- `DELETE /admin/all` — hard-delete all data in correct cascade order

**Frontend (Angular):**
- `src/app/admin/admin.ts` + `admin.html` + `admin.scss` — Admin page component
- `src/app/services/admin.service.ts` — HTTP calls to admin endpoints
- `src/app/app.routes.ts` — add `/admin` lazy route (protected by `authGuard`)
- `src/app/shared/sidebar/sidebar.html` — add Admin nav item
- `public/i18n/en.json` + `sr.json` — admin translation keys
