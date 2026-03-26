## Why

Currently, deleting a patient or visit requires navigating to the detail page first, then clicking delete. The diagnoses and treatments tables already have inline delete buttons per row. Adding the same to patient-list and visit-list tables improves workflow consistency and lets users delete records without leaving the list view.

## What Changes

Add a delete button to the actions column of:
1. **Patient list table** (`patient-list`)
2. **Visit list table** (`visit-list`)

Both follow the existing pattern from diagnoses/treatments: a `mat-icon-button` with `icon-btn--danger` class that opens the `ConfirmDialogService` confirmation modal before calling the service's `delete()` method.

## Capabilities

### Modified Capabilities

- `patient-list`: Add delete button in the actions column, wire up confirmation dialog and service call
- `visit-list`: Add delete button in the actions column, wire up confirmation dialog and service call

## Impact

- `src/app/patients/patient-list/patient-list.ts` — inject `ConfirmDialogService`, add `deletePatient(id)` method
- `src/app/patients/patient-list/patient-list.html` — add delete button in actions column
- `src/app/patients/patient-list/patient-list.spec.ts` — add tests for delete flow
- `src/app/visits/visit-list/visit-list.ts` — inject `ConfirmDialogService`, add `deleteVisit(id)` method
- `src/app/visits/visit-list/visit-list.html` — add delete button in actions column
- `src/app/visits/visit-list/visit-list.spec.ts` — add tests for delete flow

## Out of Scope

- No new translation keys needed — `patient.deleteTitle`, `patient.deleteMessage`, `visit.deleteTitle`, `visit.deleteMessage` already exist
- No service changes — `PatientService.delete()` and `VisitService.delete()` already exist
- No new components — reuses existing `ConfirmDialogService`
