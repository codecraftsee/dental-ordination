## Proposal: Patient Detail Page Redesign

### Problem

The current patient detail page is a plain label/value grid followed by a flat visits table. It looks like a raw data dump — no visual hierarchy, no at-a-glance summary, no personality. For a medical app used daily by clinic staff, it needs to communicate key patient information instantly.

Reference design: https://medical-admin-template.multipurposethemes.com/main/patient_details.html

### Solution

Redesign the patient detail page into a **profile-first layout** with three visual zones:

1. **Profile header card** (full-width) — large avatar circle with patient initials as placeholder (photo upload is a future feature), patient name prominent, gender badge, registration date, action buttons.

2. **Two-column info layout** — left column: contact card (phone, email, address, city with icons); right column: personal details card (all remaining fields in a clean 2-column grid).

3. **Stats bar** — 4 highlight chips between the header and the info columns showing: Total Visits, Visits This Year, Age, and Date of Birth. Quick-scan data at a glance.

4. **Visit history** — full-width table below, same data as today but using the existing card layout on mobile.

### Scope

- `src/app/patients/patient-detail/patient-detail.html` — full redesign
- `src/app/patients/patient-detail/patient-detail.scss` — new component styles
- `src/app/patients/patient-detail/patient-detail.ts` — add `getAge()`, `getInitials()`, `getVisitsThisYear()` helpers
- `public/i18n/en.json` + `sr.json` — add `patient.age`, `patient.totalVisits`, `patient.visitsThisYear`, `patient.registeredOn`

### Non-Goals

- Profile photo upload (placeholder avatar only — future feature)
- Editing patient data inline (still navigates to patient-form)
- Tabs or additional sub-sections beyond visit history
