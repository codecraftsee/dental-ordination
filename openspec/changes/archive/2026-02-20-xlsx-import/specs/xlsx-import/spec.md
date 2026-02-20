## ADDED Requirements

### Requirement: XLSX Import Endpoint (Backend)

An admin-only endpoint parses XLSX dental card files and imports patients and visits.

#### Scenario: Import a single XLSX file

- **WHEN** an admin POSTs a valid XLSX file to `POST /api/import/xlsx`
- **THEN** the patient header is parsed from rows 2–10 (column C)
- **AND** visit rows are parsed from row 14 onwards
- **AND** the patient is created if not found, or reused if a matching name exists
- **AND** all valid visit rows are inserted into the database
- **AND** a result summary is returned: `patients_created`, `patients_found`, `visits_created`, `files_processed`, `errors`

#### Scenario: Import multiple XLSX files

- **WHEN** an admin POSTs multiple XLSX files in one request
- **THEN** each file is processed independently
- **AND** the result summary aggregates counts across all files

#### Scenario: Patient deduplication

- **WHEN** a patient with the same first + last name already exists (case-insensitive)
- **THEN** the existing patient is reused; no duplicate is created
- **AND** the new visit rows are appended to the existing patient

#### Scenario: Doctor lookup by initial

- **WHEN** a visit row has a doctor initial (e.g., `"F"`)
- **THEN** the system looks up a doctor whose first name starts with that letter
- **AND** if no match is found, the first available doctor is used as fallback

#### Scenario: Skip rows without a date

- **WHEN** a visit row has no date value (null or empty)
- **THEN** the row is skipped without error

#### Scenario: Non-admin access

- **WHEN** a non-admin user calls `POST /api/import/xlsx`
- **THEN** a 403 Forbidden response is returned

---

### Requirement: XLSX Import UI (Frontend)

The dashboard provides an import button for uploading XLSX dental card files.

#### Scenario: Trigger file picker

- **WHEN** the user clicks "Import XLSX" on the dashboard
- **THEN** the file picker opens filtered to `.xlsx` files
- **AND** multiple file selection is enabled

#### Scenario: Import in progress

- **WHEN** files are selected and upload begins
- **THEN** the button shows "Importing..." and is disabled
- **AND** no result message is visible yet

#### Scenario: Successful import

- **WHEN** the import completes without errors
- **THEN** a green success message shows: files processed count, new patients, visits created
- **AND** the dashboard data refreshes

#### Scenario: Import with warnings

- **WHEN** the import completes but has non-fatal errors (e.g., unmatched doctor initial)
- **THEN** a yellow warning message shows the summary plus the warning count

#### Scenario: Import failure

- **WHEN** the import request fails (network error or server error)
- **THEN** a red error message shows the failure reason
