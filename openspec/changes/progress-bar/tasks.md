## 1. Backend

- [x] 1.1 Change `POST /api/import/xlsx` to return a `StreamingResponse` (SSE)
- [x] 1.2 Yield `data: {"type": "progress", ...}\n\n` at the start of each file
- [x] 1.3 Yield `data: {"type": "file_done", ...}\n\n` after each file completes
- [x] 1.4 Yield `data: {"type": "complete", "summary": {...}}\n\n` after all files

## 2. Frontend — Service

- [x] 2.1 Add `ImportProgressEvent` union type to `patient.service.ts`
- [x] 2.2 Replace `HttpClient.post()` with Fetch + `ReadableStream` SSE parser in `importXlsx()`
- [x] 2.3 Wrap SSE emissions in `NgZone.run()` for change detection compatibility

## 3. Frontend — Component

- [x] 3.1 Add `importProgress`, `importCurrentFile`, `importTotal` signals to `Home`
- [x] 3.2 Import `MatProgressBarModule` in `Home`
- [x] 3.3 Handle `progress` event: set `importTotal`, `importCurrentFile`, update `importProgress`
- [x] 3.4 Handle `file_done` event: advance `importProgress` to end of file N
- [x] 3.5 Handle `complete` event: set `importProgress` to 100, show result message, refresh data

## 4. Frontend — Template & Styles

- [x] 4.1 Replace custom `.import-progress` div with `mat-card` + `mat-progress-bar` block in `home.html`
- [x] 4.2 Add per-file label (`importingFile`) and percentage readout to progress card
- [x] 4.3 Replace custom `.import-message` div with `mat-card` in `home.html`
- [x] 4.4 Remove `.import-progress`, `.import-progress-label`, `.import-progress-sub`, `.import-message` blocks from `home.scss`
- [x] 4.5 Add `.import-progress-card` and `.import-message-card` scoped styles to `home.scss`

## 5. i18n

- [x] 5.1 Add `home.importingFile` key to `en.json` and `sr.json`
- [x] 5.2 Add `home.importingFiles` key to `en.json` and `sr.json`

## 6. Verify

- [ ] 6.1 Upload multiple XLSX files — confirm progress bar advances per file
- [ ] 6.2 Confirm filename label updates for each file during processing
- [ ] 6.3 Confirm success card appears with green left border after clean import
- [ ] 6.4 Confirm warning card appears with amber left border when import has non-fatal errors
- [ ] 6.5 Run `npm test` — no regressions
- [ ] 6.6 Run `ng build` — no compilation errors
