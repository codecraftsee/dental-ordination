# Dental Ordination - MVP Specification

## Overview

A web application for managing a dental practice (stomatoloska ordinacija). Tracks doctors, patients, diagnoses, and treatments. Data is stored in-memory with localStorage persistence for the MVP (no backend).

## Tech Stack

- Angular 21 with standalone components and signals
- SCSS for styles
- Vitest for testing
- TypeScript strict mode
- Multilanguage support (Serbian + English)
- In-memory database with localStorage persistence

---

## Data Models

### Patient

Derived from the dental card header (Stomatoloski karton).

```typescript
interface Patient {
  id: string;
  firstName: string;           // Ime
  lastName: string;            // Prezime
  parentName: string;          // Ime jednog roditelja
  gender: 'M' | 'F';          // Pol
  dateOfBirth: string;         // Datum rodjenja (ISO date)
  address: string;             // Adresa
  city: string;                // Mesto
  phone: string;               // Telefon
  email: string;               // E-mail
  createdAt: string;           // ISO datetime
}
```

**Example from source data:**

| Field | Value |
|-------|-------|
| firstName | Miodrag |
| lastName | Pavkovic |
| parentName | Gradimir |
| gender | M |
| dateOfBirth | 1980-04-15 |
| address | Kragujevacka 29 |
| city | Novi Sad |
| phone | 064.124.0166 |
| email | mpavkovic@gmail.com |

### Doctor

```typescript
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: Specialization;
  phone: string;
  email: string;
  createdAt: string;
}

enum Specialization {
  GeneralDentistry = 'GeneralDentistry',
  Orthodontics = 'Orthodontics',
  Endodontics = 'Endodontics',
  Prosthodontics = 'Prosthodontics',
  OralSurgery = 'OralSurgery',
  Periodontics = 'Periodontics',
  PediatricDentistry = 'PediatricDentistry'
}
```

### Diagnosis

Derived from the "Dg." column in the dental card. Represents a dental diagnosis tied to a specific tooth.

```typescript
interface Diagnosis {
  id: string;
  code: string;              // Short code, e.g. "caries_secundaria"
  name: string;              // Full name, e.g. "Caries secundaria"
  description: string;       // Detailed description
  category: DiagnosisCategory;
}

enum DiagnosisCategory {
  Caries = 'Caries',
  Pulpitis = 'Pulpitis',
  Periodontal = 'Periodontal',
  Trauma = 'Trauma',
  Orthodontic = 'Orthodontic',
  Other = 'Other'
}
```

**Diagnoses from source data:**

| Code | Name | Category |
|------|------|----------|
| caries_secundaria | Caries secundaria | Caries |
| caries_profunda | Caries profunda | Caries |
| caries_chronica | Caries chronica aperta ulcerosa | Caries |
| pulpitis_chronica | Pulpitis chronica aperta ulcerosa | Pulpitis |
| disharmonia | Disharmonia dentoalveolaris | Orthodontic |

### Treatment

Derived from the "Th/" column in the dental card.

```typescript
interface Treatment {
  id: string;
  code: string;              // Short code, e.g. "prep_cav"
  name: string;              // Full name, e.g. "Preparacija kaviteta"
  description: string;
  category: TreatmentCategory;
  defaultPrice: number;      // Default price in RSD
}

enum TreatmentCategory {
  Restoration = 'Restoration',
  Endodontic = 'Endodontic',
  Prosthetic = 'Prosthetic',
  Surgical = 'Surgical',
  Preventive = 'Preventive',
  Diagnostic = 'Diagnostic',
  Other = 'Other'
}
```

**Treatments from source data:**

| Code | Name | Category | Example |
|------|------|----------|---------|
| prep_cav | Preparacija kaviteta | Restoration | prep cav III cl (D) A3 Gradia |
| fiber_kocic | Fiber kocic | Prosthetic | fiber kocic |
| metalokeramicka_krunica | Metalokeramicka krunica | Prosthetic | metalokeramicka krunica, D3 boja |
| trepanacija | Trepanacija | Endodontic | trepanacija bez anestezije |
| endodontsko_lecenje | Endodontsko lecenje (HEL) | Endodontic | HEL do F2, irigacija, gutaperka |
| extractio | Ekstrakcija | Surgical | extractio cum anaesthesio |

### Visit (links all entities together)

Each row in the dental card represents a visit/appointment.

```typescript
interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;              // ISO date
  toothNumber: string;       // FDI tooth number, e.g. "23", "36", "16"
  diagnosisId: string;
  diagnosisNotes: string;    // Additional diagnosis details
  treatmentId: string;
  treatmentNotes: string;    // Additional treatment details, materials used
  price: number;             // Price in RSD (0 if not recorded)
  createdAt: string;
}
```

**Visits from source data:**

| Date | Tooth | Diagnosis | Treatment | Price (RSD) |
|------|-------|-----------|-----------|-------------|
| 2014-10-22 | 23 | d 23 | prep cav III cl (D) A3 Gradia | - |
| 2015-07-28 | 36 | caries secundaria d 36 D | prep cav II cl D3 3M ESPE | 1,000 |
| 2016-01-23 | 13 | d 13 | fiber kocic | 3,000 |
| 2016-01-29 | 13 | d 13 | metalokeramicka krunica, D3 boja | ~6,000 |
| 2016-05-26 | 16 | caries secundaria + pulpitis chronica | trepanacija, toxavit, kariofil z | - |
| 2016-06-01 | 14 | apeks korena - kvrzica | trepanacija, HEL 10-30, gutaperka | - |
| 2016-06-28 | 16 | d 16 | HEL do F2/F3, gutaperka + diaproseal | 2,000 |
| 2016-06-08 | 14 | d 14 | HEL do F2, gutaperka + diaproseal | 2,000 |
| 2016-07-04 | 16 | d 16 | prep cav MOD, B3 i A3 3M ESPE | 1,500 |
| 2016-07-14 | 18 | caries chronica + disharmonia | extractio cum anaesthesio | - |
| 2017-02-09 | 35 | caries profunda d 35 | prep cav MOD, Calcimol, GJC | - |

---

## Entity Relationships

```
Doctor 1──M Visit M──1 Patient
                |
          ┌─────┴─────┐
          │            │
     Diagnosis    Treatment
```

- A **Patient** has many **Visits**
- A **Doctor** performs many **Visits**
- Each **Visit** has one **Diagnosis** and one **Treatment**
- Each **Visit** references one **tooth** (FDI notation)

---

## Features

### 1. Patient Management

- List all patients with search (by name, city, phone)
- View patient detail with full dental history (list of visits)
- Create / edit / delete patient
- Patient form fields: firstName, lastName, parentName, gender, dateOfBirth, address, city, phone, email

### 2. Doctor Management

- List all doctors with search (by name, specialization)
- View doctor detail with schedule/visit history
- Create / edit / delete doctor
- Doctor form fields: firstName, lastName, specialization, phone, email

### 3. Diagnosis Catalog

- List all diagnoses with search and category filter
- Create / edit / delete diagnosis
- Diagnosis form fields: code, name, description, category

### 4. Treatment Catalog

- List all treatments with search and category filter
- Create / edit / delete treatment
- Treatment form fields: code, name, description, category, defaultPrice

### 5. Visit Management (core feature)

- List all visits with filters (by patient, doctor, date range)
- Create a new visit: select patient, doctor, tooth, diagnosis, treatment, set price
- View visit detail
- Edit / delete visit
- When creating a visit, selecting a treatment auto-fills the price from defaultPrice

### 6. Patient Dental Card View

- View a patient's complete dental card (stomatoloski karton)
- Shows patient info header + chronological list of all visits
- Similar layout to the source Excel file

---

## Seed Data

Pre-populate the app with the following data for demonstration:

### Doctors (3)

| Name | Specialization |
|------|---------------|
| Dr. Ana Jovanovic | General Dentistry |
| Dr. Marko Nikolic | Endodontics |
| Dr. Lidija Petrovic | Prosthodontics |

### Patients (3)

| Name | City |
|------|------|
| Miodrag Pavkovic | Novi Sad |
| Jelena Markovic | Beograd |
| Stefan Ilic | Novi Sad |

### Diagnoses (6)

From the source data diagnoses listed above.

### Treatments (6)

From the source data treatments listed above.

### Visits (11)

From the source data visit records, assigned to the seed doctors and patients.

---

## Architecture

```
src/app/
  models/
    patient.model.ts
    doctor.model.ts
    diagnosis.model.ts
    treatment.model.ts
    visit.model.ts
  services/
    patient.service.ts
    doctor.service.ts
    diagnosis.service.ts
    treatment.service.ts
    visit.service.ts
    translate.service.ts
  patients/              # Patient list + detail + form
  doctors/               # Doctor list + detail + form
  diagnoses/             # Diagnosis list + form
  treatments/            # Treatment list + form
  visits/                # Visit list + detail + form
  dental-card/           # Patient dental card view
  home/                  # Dashboard
  shared/
    language-switcher/
    translate.pipe.ts
    localized-date.pipe.ts
  app.ts
  app.html
  app.routes.ts
public/
  i18n/
    en.json
    sr.json
```

### Routing

| Path | Feature | Lazy loaded |
|------|---------|-------------|
| `/` | Dashboard/Home | Yes |
| `/patients` | Patient list | Yes |
| `/patients/:id` | Patient detail + dental card | Yes |
| `/patients/new` | Create patient | Yes |
| `/patients/:id/edit` | Edit patient | Yes |
| `/doctors` | Doctor list | Yes |
| `/doctors/:id` | Doctor detail | Yes |
| `/doctors/new` | Create doctor | Yes |
| `/doctors/:id/edit` | Edit doctor | Yes |
| `/diagnoses` | Diagnosis catalog | Yes |
| `/treatments` | Treatment catalog | Yes |
| `/visits` | Visit list | Yes |
| `/visits/new` | Create visit | Yes |
| `/visits/:id` | Visit detail | Yes |

### Dashboard (Home Page)

- Quick stats: total patients, total visits this month, upcoming visits
- Recent visits list (last 5)
- Quick action buttons: New Visit, New Patient

---

## Conventions

- Component prefix: `app`
- Single quotes for TypeScript, double quotes for HTML attributes
- 2-space indentation
- Standalone components everywhere (no NgModules)
- Angular signals for component state (not RxJS subjects)
- Reactive forms for all forms with validation
- Lazy-loaded feature routes
- Keep components under ~100 lines, extract when they grow

## i18n

Multilanguage support (Serbian + English) using the same approach as lost-and-found:
- `TranslateService` with `currentLang` signal
- `TranslatePipe` for templates
- `LocalizedDatePipe` for date formatting
- `LanguageSwitcher` component in the nav
- Translation files in `public/i18n/en.json` and `public/i18n/sr.json`

## Out of Scope (MVP)

- Authentication / user roles
- Backend API / real database
- Appointment scheduling / calendar view
- Invoice generation / PDF export
- Dental chart visualization (graphical tooth map)
- File attachments (X-rays, photos)
- Notifications / reminders
