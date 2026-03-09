## Why

The clinic has no way to track whether patients have paid for their visits. Doctors need a quick visual indicator of a patient's payment status and outstanding debt, so they can follow up on unpaid bills without manually checking each visit.

## What Changes

- Add a `paid` boolean field to the Visit model (default: `false`)
- Add a "Mark as paid" toggle on visit detail and visit form
- Add a "paid" column to the visits table in dental card (with checkbox or icon)
- Show a payment status chip/badge on the patient detail profile header:
  - Green "Paid" chip when all visits are paid
  - Red/warning "Debt: X RSD" chip when unpaid visits exist
- Add a debt stat card to the patient detail stats bar showing outstanding amount
- Add a small payment indicator dot/badge on the patient list table rows

## Capabilities

### New Capabilities
- `visit-payment-status`: Per-visit paid/unpaid tracking with toggle UI on visit detail and visit form
- `patient-debt-indicator`: Computed debt display on patient detail (chip in profile header + stat card) and patient list (indicator badge)

### Modified Capabilities
- `patient-detail`: Add payment status chip to profile header and debt stat card to stats bar
- `mobile-home`: Recent visits in book-table may show paid/unpaid indicator

## Impact

- **Models**: `Visit`, `VisitCreate`, `VisitUpdate` — add `paid: boolean` field
- **Backend API**: Visit endpoints need to accept and return the `paid` field (backend repo change)
- **Services**: `VisitService` — no new endpoints needed, just the existing CRUD with the new field
- **Components**: `visit-form`, `visit-detail` (edit `paid`), `patient-detail` (show debt), `patient-list` (show indicator), `dental-card` (show paid status per visit)
- **i18n**: New keys in both `en.json` and `sr.json` for payment-related labels
- **No new dependencies** required
