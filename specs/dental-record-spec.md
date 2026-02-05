# Dental Record (Stomatološki Karton) - Feature Spec

## Overview

Generate a printable/exportable dental record (Stomatološki karton) from patient data, matching the format of the reference Excel file (`Pavković Miodrag 417.xlsx`).

## Reference Format

The dental record consists of two sections:

### 1. Patient Information Header

| Field                  | Serbian Label            | Source                |
|------------------------|--------------------------|-----------------------|
| Gender                 | Pol                      | `patient.gender`      |
| Last Name              | Prezime                  | `patient.lastName`    |
| First Name             | Ime                      | `patient.firstName`   |
| Parent's Name          | Ime jednog roditelja     | `patient.parentName`  |
| Date of Birth          | Datum rođenja            | `patient.dateOfBirth` |
| Address                | Adresa                   | `patient.address`     |
| City                   | Mesto                    | `patient.city`        |
| Phone                  | Telefon                  | `patient.phone`       |
| Email                  | E-mail                   | `patient.email`       |
| Record Date            | Datum                    | Generated date        |

### 2. Treatment History Table

| Column   | Serbian Label | Source                                          |
|----------|---------------|-------------------------------------------------|
| Date     | Datum         | `visit.date`                                    |
| Diagnosis| Dg.           | `diagnosis.code` + `visit.diagnosisNotes`       |
| Treatment| Th/           | `treatment.name` + `visit.treatmentNotes`       |
| Price    | Cena          | `visit.price`                                   |
| Doctor   | Doktor        | `doctor.firstName` + `doctor.lastName` (NEW)    |

Rows are sorted by date ascending. A total row shows sum of all prices at the bottom.

## Data Flow

```
Patient → visits (filtered by patientId)
  └─ each visit → resolve diagnosis, treatment, doctor by ID
```

All data is already available via existing services:
- `PatientService.getById()`
- `VisitService.getByPatientId()`
- `DiagnosisService.getById()`
- `TreatmentService.getById()`
- `DoctorService.getById()`

## Implementation Plan

### 1. Enhance DentalCard component
- Redesign to match the Stomatološki karton layout
- Add patient info header section
- Add treatment history table with all columns including doctor
- Add total price row
- Add print styling for clean paper output

### 2. Export to Excel
- Use `xlsx` library to generate .xlsx files
- Match the structure of the reference file
- Add doctor column as enhancement

### 3. UI Actions
- "Print" button → triggers `window.print()` with print-optimized CSS
- "Export Excel" button → downloads .xlsx file
