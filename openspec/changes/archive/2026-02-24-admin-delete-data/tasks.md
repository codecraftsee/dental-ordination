## 1. Backend (FastAPI — separate repo)

- [ ] 1.1 `routers/admin.py` — create admin router with DELETE endpoints: `/admin/visits`, `/admin/patients`, `/admin/doctors`, `/admin/diagnoses`, `/admin/treatments`, `/admin/all`
- [ ] 1.2 Cascade order in `/admin/all` — delete visits first, then patients, doctors, diagnoses, treatments
- [ ] 1.3 `/admin/patients` — cascade-delete patient visits before deleting patients
- [ ] 1.4 Register admin router in `main.py`
- [ ] 1.5 All endpoints require valid JWT (reuse existing `get_current_user` dependency)

## 2. Frontend — Service

- [ ] 2.1 `src/app/services/admin.service.ts` — `@Injectable({ providedIn: 'root' })` with methods: `deleteVisits()`, `deletePatients()`, `deleteDoctors()`, `deleteDiagnoses()`, `deleteTreatments()`, `deleteAll()` — each returns `Observable<void>`

## 3. Frontend — Admin Page

- [ ] 3.1 `src/app/admin/admin.ts` — standalone component, inject `AdminService` + all entity services, signal per card: `confirming`, `loading`, `message`, `error`
- [ ] 3.2 `src/app/admin/admin.html` — Danger Zone section with one card per entity + "Delete all" card; each card has typed confirmation input (`[disabled]` button until input === 'DELETE') and feedback message
- [ ] 3.3 `src/app/admin/admin.scss` — danger zone styling: red-left-border cards, "Delete all" card with full danger background

## 4. Frontend — Routing & Navigation

- [ ] 4.1 `src/app/app.routes.ts` — add lazy route `{ path: 'admin', canActivate: [authGuard], loadComponent: () => import('./admin/admin') }`
- [ ] 4.2 `src/app/shared/sidebar/sidebar.html` — add Admin nav item (below main nav group)

## 5. i18n

- [ ] 5.1 `public/i18n/en.json` — add `admin.*` keys: `admin.title`, `admin.dangerZone`, `admin.dangerZoneDesc`, `admin.typeToConfirm`, `admin.confirmPlaceholder`, `admin.deleteVisits`, `admin.deleteVisitsDesc`, `admin.deletePatients`, `admin.deletePatientsDesc`, `admin.deleteDoctors`, `admin.deleteDoctorsDesc`, `admin.deleteDiagnoses`, `admin.deleteDiagnosesDesc`, `admin.deleteTreatments`, `admin.deleteTreatmentsDesc`, `admin.deleteAll`, `admin.deleteAllDesc`, `admin.success`, `admin.error`
- [ ] 5.2 `public/i18n/sr.json` — add same keys in Serbian

## 6. Verify

- [ ] 6.1 Each delete card: button disabled until `DELETE` typed, enabled after, disabled again after submit
- [ ] 6.2 Successful delete refreshes dashboard stats (patient/visit count drops to 0)
- [ ] 6.3 Network error shows error message on the card without crashing
- [ ] 6.4 `DELETE /admin/all` removes records across all entity types
- [ ] 6.5 Run `ng build` — no compilation errors
