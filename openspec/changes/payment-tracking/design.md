## Context

The app tracks patient visits with optional `price` fields, but has no concept of whether a visit has been paid. The dental card shows a total cost, but there's no way to know how much is outstanding. Clinics need at-a-glance debt visibility to follow up on unpaid bills.

Current state:
- `Visit` model has `price?: number` — no payment tracking
- Patient detail page has a stats bar (4 cards) and profile header with badges
- Patient list shows name, parent, DOB, city, phone, actions
- Dental card shows visits table with price column and a total card

## Goals / Non-Goals

**Goals:**
- Add per-visit `paid` boolean to track payment status
- Show computed debt (sum of unpaid visit prices) on patient detail page
- Provide quick visual indicator on patient list and profile header
- Allow toggling payment status from visit form and visit detail

**Non-Goals:**
- Partial payments or payment amounts (just paid/unpaid toggle)
- Payment history or audit trail
- Invoice generation or payment processing
- Notifications or reminders for unpaid bills
- Bulk payment operations

## Decisions

### Decision 1: `paid` boolean on Visit (not separate Payments table)

**Choice:** Add `paid: boolean` (default `false`) directly to the Visit model.

**Alternatives considered:**
- Separate `Payment` entity with amounts — too complex for current needs, requires new API endpoints, new service, new model
- `paidAmount` field for partial payments — adds complexity without clear need

**Rationale:** Simple boolean covers the use case. Debt is computed as `sum(price) WHERE paid = false`. Can be extended to a Payments table later if partial payments are needed.

### Decision 2: Computed debt (frontend signal)

**Choice:** Compute debt in the frontend from the visit signal cache — no new API endpoint.

**Rationale:** All visits for a patient are already loaded. A `computed()` signal can derive the debt from unpaid visits. No backend changes beyond accepting the `paid` field.

### Decision 3: Payment status chip placement

**Choice:** Place the debt/paid chip in the patient profile header next to the gender badge, and add a debt stat card to the stats bar.

**Alternatives considered:**
- Only stat card — not visible enough at a glance
- Only chip — doesn't show the amount prominently

**Rationale:** Chip provides instant status recognition (green/red), stat card provides the amount.

### Decision 4: Patient list indicator

**Choice:** Small colored dot or badge next to patient name in the list, using existing badge styles.

**Rationale:** Minimal visual footprint. Red dot = has debt, no dot = all paid. Keeps the table clean.

### Decision 5: Toggle UI for marking paid

**Choice:** Slide toggle on visit form and a toggle button on visit detail page.

**Rationale:** Slide toggle is the standard Material pattern for boolean fields. Visit detail shows it as a toggleable status.

## Risks / Trade-offs

- **[Data migration]** Existing visits have no `paid` field. Backend must default to `false` for existing records. -> Mitigation: Backend adds column with `default=False`, no data migration needed.
- **[Stale cache]** If another user marks a visit as paid, the current user won't see it until refresh. -> Mitigation: Acceptable for single-user clinic app. No real-time sync needed.
- **[Price optional]** Visits without a price contribute 0 to debt calculation. A visit with no price and `paid=false` shows as unpaid but adds nothing to the debt amount. -> Mitigation: Document that unpaid visits without price don't affect debt total.
