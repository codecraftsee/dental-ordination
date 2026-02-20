## 1. Backend

- [x] 1.1 Add `openpyxl==3.1.5` to `requirements.txt`
- [x] 1.2 Create `app/routers/import_xlsx.py` with `POST /api/import/xlsx` endpoint
- [x] 1.3 Implement patient header parsing (rows 2–10, column C)
- [x] 1.4 Implement visit row parsing (row 14+)
- [x] 1.5 Implement patient deduplication by first + last name (case-insensitive)
- [x] 1.6 Implement doctor lookup by first name initial with fallback
- [x] 1.7 Register import router in `app/main.py`

## 2. Frontend

- [x] 2.1 Add `ImportResult` interface to `patient.service.ts`
- [x] 2.2 Add `importXlsx(files: File[])` method to `PatientService`
- [x] 2.3 Add import state signals to `Home` (`importing`, `importMessage`, `importError`)
- [x] 2.4 Add `triggerXlsxInput()` and `onXlsxSelected()` methods to `Home`
- [x] 2.5 Add import button and hidden file input to `home.html`
- [x] 2.6 Add import result message to `home.html`
- [x] 2.7 Add `.import-message` styles to `home.scss`

## 3. i18n

- [x] 3.1 Add `home.importXlsx`, `home.importing` keys to `en.json` and `sr.json`

## 4. Verify

- [ ] 4.1 Test via Swagger: `POST /api/import/xlsx` with sample file
- [ ] 4.2 Verify DB: patient created, visits inserted with correct data
- [ ] 4.3 Test frontend: upload multiple files, confirm success message and data refresh
- [ ] 4.4 Run `ng build` — no compilation errors
