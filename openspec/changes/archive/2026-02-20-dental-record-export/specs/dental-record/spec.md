## ADDED Requirements

### Requirement: Print Dental Record

Users can print a patient's dental record matching the Stomatoloski Karton layout.

#### Scenario: Print button

- **WHEN** the user clicks "Print" on the dental card page
- **THEN** the browser print dialog opens
- **AND** the printed output shows only the dental card (no navigation, no buttons)
- **AND** the layout matches the Stomatoloski Karton format: patient header followed by visit table

---

### Requirement: Export Dental Record to XLSX

Users can export a patient's dental record as an `.xlsx` file.

#### Scenario: Export button

- **WHEN** the user clicks "Export Excel" on the dental card page
- **THEN** an `.xlsx` file is downloaded named after the patient
- **AND** the file structure matches the reference format: patient header in column C (rows 0–11), visit table starting at row 13

#### Scenario: Visit table content

- **WHEN** the XLSX is generated
- **THEN** each visit row contains: date, diagnosis, treatment, doctor, price
- **AND** a total row at the bottom shows the sum of all prices

---

### Requirement: Dental Card Layout

The dental card component displays data in the Stomatoloski Karton format.

#### Scenario: Patient header section

- **WHEN** the dental card is rendered
- **THEN** the header shows: gender, last name, first name, parent name, date of birth, address, city, phone, email

#### Scenario: Visit table

- **WHEN** the dental card is rendered
- **THEN** visits are sorted by date ascending
- **AND** columns are: Date, Diagnosis (Dg.), Treatment (Th/), Doctor, Price (Cena)
- **AND** a total price row is shown at the bottom
