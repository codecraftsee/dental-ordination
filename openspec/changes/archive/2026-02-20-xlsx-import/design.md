## Context

Legacy Excel files follow a fixed structure: patient header in rows 0–11 (data in column C), visit table starting at row 14. Fields use Serbian labels. Dates are in `dd.mm.yyyy.` format. Doctor is encoded as a single initial letter.

## Goals / Non-Goals

**Goals:**
- Parse patient header and all visit rows from each XLSX file
- Deduplicate patients by first name + last name (case-insensitive)
- Map doctor initial to existing doctor records
- Return a summary of what was created/found/errored
- Admin-only endpoint

**Non-Goals:**
- Updating existing patients' data (only creates new patients, doesn't overwrite)
- Handling files in formats other than XLSX
- Creating new doctors from initials (falls back to first available)

## Decisions

### Decision 1: `openpyxl` for backend XLSX parsing

`openpyxl` is the standard Python XLSX library. Used with `read_only=True` and `data_only=True` for efficient parsing without loading formula results.

### Decision 2: Patient deduplication by full name match

Match existing patients by `first_name + last_name` (case-insensitive `ilike`). If found, reuse the patient and append visits. If not found, create a new patient. No fuzzy matching — exact name match only.

### Decision 3: Doctor lookup by first name initial

Excel stores doctor as a single letter (e.g., `"F"`, `"M"`). Lookup maps `Doctor.first_name[0].upper()` to doctor ID. Falls back to first available doctor if no match. Errors logged in result but do not abort the import.

### Decision 4: FormData multipart upload from Angular

Frontend uses `FormData` with multiple `files` entries. `HttpClient.post()` sends as `multipart/form-data`. No `Content-Type` header is set manually (browser sets it with boundary automatically).
