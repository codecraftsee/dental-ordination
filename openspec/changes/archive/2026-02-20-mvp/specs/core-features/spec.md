## ADDED Requirements

### Requirement: Patient Management

Users can manage the full lifecycle of patient records.

#### Scenario: List patients with search

- **WHEN** the user visits `/patients`
- **THEN** a list of all patients is displayed
- **AND** the list can be filtered by name, city, or phone number

#### Scenario: Create a patient

- **WHEN** the user submits the patient form with valid data
- **THEN** a new patient record is created and appears in the list

#### Scenario: Edit a patient

- **WHEN** the user navigates to `/patients/:id/edit` and submits the form
- **THEN** the patient record is updated

#### Scenario: Delete a patient

- **WHEN** the user confirms deletion
- **THEN** the patient and all associated visits are removed

---

### Requirement: Doctor Management

Users can manage doctor records.

#### Scenario: List doctors

- **WHEN** the user visits `/doctors`
- **THEN** all doctors are listed with name and specialization

#### Scenario: Create/edit/delete a doctor

- **WHEN** the user submits the doctor form
- **THEN** the doctor record is created or updated accordingly

---

### Requirement: Visit Management

Users can record patient visits linking all entities.

#### Scenario: Create a visit

- **WHEN** the user fills in patient, doctor, tooth number, diagnosis, treatment, and price
- **THEN** the visit is saved and appears in the patient's dental card

#### Scenario: Auto-fill price from treatment

- **WHEN** the user selects a treatment in the visit form
- **THEN** the price field is automatically populated with the treatment's `defaultPrice`

---

### Requirement: Diagnosis and Treatment Catalogs

Users can manage reusable diagnosis and treatment records.

#### Scenario: Manage catalogs

- **WHEN** the user visits `/diagnoses` or `/treatments`
- **THEN** they can create, edit, and delete catalog entries

---

### Requirement: Multilanguage Support

The UI is available in Serbian and English.

#### Scenario: Language switching

- **WHEN** the user selects a language via the language switcher
- **THEN** all UI text updates to the selected language immediately
- **AND** the selection persists across navigation

---

### Requirement: Patient Dental Card View

Each patient has a chronological dental record view.

#### Scenario: View dental card

- **WHEN** the user navigates to a patient's dental card
- **THEN** the patient info header and all visits are displayed in chronological order
