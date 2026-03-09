## 1. Model & Service

- [x] 1.1 Add `paid: boolean` to `Visit`, `VisitCreate`, `VisitUpdate` interfaces in `src/app/models/visit.model.ts`
- [x] 1.2 Verify `VisitService` CRUD methods pass through the `paid` field (no service changes expected, just confirm)

## 2. Backend (separate repo)

- [x] 2.1 Add `paid` boolean column to visits table with `default=False` (backend repo — separate)
- [x] 2.2 Update visit schema to include `paid` in request/response (backend repo — separate)

## 3. Visit Form — Payment Toggle

- [x] 3.1 Add `MatSlideToggleModule` import to visit form component
- [x] 3.2 Add `paid` slide toggle field to `visit-form.html`
- [x] 3.3 Add `paid` to the reactive form model with default `false`
- [x] 3.4 Add i18n keys for payment toggle label (`visit.paid`) in both `en.json` and `sr.json`

## 4. Visit Detail — Payment Status

- [x] 4.1 Display paid/unpaid badge on visit detail page
- [x] 4.2 Add toggle button to switch payment status from visit detail (calls `VisitService.update`)
- [x] 4.3 Add i18n keys for `visit.paid`, `visit.unpaid` in both language files

## 5. Dental Card — Paid Column

- [x] 5.1 Add `paid` column to the dental card `mat-table` with check/X icon
- [x] 5.2 Add `paid` field to the mobile book-table page template with icon indicator
- [x] 5.3 Add i18n key for `dentalCard.paid` in both language files

## 6. Patient Detail — Debt Indicator

- [x] 6.1 Add computed `patientDebt` signal that sums unpaid visit prices
- [x] 6.2 Add computed `hasUnpaidVisits` signal
- [x] 6.3 Add payment status chip (green "Paid" / red "Debt: X") next to gender badge in profile header
- [x] 6.4 Add debt stat card to the stats bar (5th card, danger/success color based on debt)
- [x] 6.5 Add i18n keys: `patient.debt`, `patient.paid`, `patient.allPaid` in both language files
- [x] 6.6 Style the payment chip for both light and dark mode

## 7. Patient List — Debt Badge

- [x] 7.1 Load visits for displayed patients (or use cached visits) to compute debt per patient
- [x] 7.2 Add small red "Debt" badge or dot next to patient name in the list table
- [x] 7.3 Add badge to mobile book-table patient page template
- [x] 7.4 Add i18n key `patients.hasDebt` in both language files

## 8. Home Page — Paid Indicator

- [x] 8.1 Add paid/unpaid icon to recent visits in the mobile book-table page template
- [x] 8.2 Add paid/unpaid icon to recent visits desktop table (optional)

## 9. Testing

- [x] 9.1 Add/update unit tests for visit model changes
- [x] 9.2 Add unit tests for debt computation signals in patient-detail
- [x] 9.3 Add unit tests for visit form paid toggle
- [x] 9.4 Add unit tests for dental card paid column rendering
