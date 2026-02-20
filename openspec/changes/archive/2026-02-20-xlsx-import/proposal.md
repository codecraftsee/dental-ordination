## Why

Thousands of historical patient records exist as legacy Excel (XLSX) dental cards ("Stomatoloski Karton"). Manually re-entering each patient and their visit history is not feasible. An automated bulk import is needed to migrate this data into the system.

## What Changes

- Backend endpoint `POST /api/import/xlsx` to parse and import XLSX dental card files (admin only)
- Frontend Import XLSX button on the dashboard
- Supports uploading multiple files at once
- Parses patient header data and full visit history from each file
- Deduplicates patients by first name + last name match

## Capabilities

### New Capabilities

- `xlsx-import-backend`: FastAPI endpoint that parses openpyxl-based XLSX files and inserts patients + visits
- `xlsx-import-frontend`: Dashboard button to select and upload multiple XLSX files, with import result feedback

## Impact

- `dental-ordination-api/requirements.txt` — add `openpyxl==3.1.5`
- `dental-ordination-api/app/routers/import_xlsx.py` — new import router
- `dental-ordination-api/app/main.py` — register import router
- `src/app/services/patient.service.ts` — add `ImportResult` interface + `importXlsx()` method
- `src/app/home/home.ts` — import state signals and handlers
- `src/app/home/home.html` — import button and result message
- `src/app/home/home.scss` — import message styles
- `public/i18n/en.json`, `public/i18n/sr.json` — 4 new i18n keys
