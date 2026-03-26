## Tasks

### Task 1: Add delete button to patient-list table

**Files:**
- `src/app/patients/patient-list/patient-list.ts`
- `src/app/patients/patient-list/patient-list.html`

**Steps:**
1. Inject `ConfirmDialogService` in `patient-list.ts`
2. Add `deletePatient(id: string): void` method following the diagnoses pattern
3. Add a `mat-icon-button` with `icon-btn--danger` class and delete icon in the actions column of the template

---

### Task 2: Add delete button to visit-list table

**Files:**
- `src/app/visits/visit-list/visit-list.ts`
- `src/app/visits/visit-list/visit-list.html`

**Steps:**
1. Inject `ConfirmDialogService` in `visit-list.ts`
2. Add `deleteVisit(id: string): void` method following the diagnoses pattern
3. Add a `mat-icon-button` with `icon-btn--danger` class and delete icon in the actions column of the template

---

### Task 3: Add unit tests

**Files:**
- `src/app/patients/patient-list/patient-list.spec.ts`
- `src/app/visits/visit-list/visit-list.spec.ts`

**Steps:**
1. Add test: clicking delete opens confirmation dialog
2. Add test: confirming delete calls service.delete() with correct id
3. Add test: cancelling delete does not call service.delete()
