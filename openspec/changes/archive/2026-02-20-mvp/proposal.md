## Why

The dental practice was tracking patient records in Excel files ("Stomatoloski Karton"). A proper web application was needed to manage doctors, patients, diagnoses, treatments, and visit records digitally with multilanguage support.

## What Changes

- New Angular 21 app built from scratch with standalone components and signals
- Full CRUD for: patients, doctors, diagnoses, treatments, visits
- Patient dental card view (Stomatoloski Karton)
- Multilanguage support: Serbian + English
- In-memory state with localStorage persistence (MVP, no backend)

## Capabilities

### New Capabilities

- `patient-management`: Create, list, search, edit, delete patients
- `doctor-management`: Create, list, search, edit, delete doctors
- `diagnosis-catalog`: Manage reusable diagnosis records
- `treatment-catalog`: Manage reusable treatment records with default prices
- `visit-management`: Record visits linking patient, doctor, tooth, diagnosis, treatment, price
- `dental-card-view`: Per-patient chronological dental record view
- `i18n`: Serbian/English language switching

## Impact

- `src/app/` — full application scaffold
- `public/i18n/en.json`, `public/i18n/sr.json` — translation files
- `src/app/models/` — TypeScript interfaces for all entities
- `src/app/services/` — signal-based services for all entities
