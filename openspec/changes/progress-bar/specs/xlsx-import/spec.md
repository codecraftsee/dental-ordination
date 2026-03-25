## MODIFIED Requirements

### Requirement: XLSX Import Endpoint (Backend)

The import endpoint now streams progress via Server-Sent Events instead of returning a single JSON response.

#### Scenario: Import streams progress events per file

- **WHEN** an admin POSTs XLSX files to `POST /api/import/xlsx`
- **THEN** the response is a `StreamingResponse` with `Content-Type: text/event-stream`
- **AND** for each file being processed a `progress` event is emitted: `{ type, current, total, file }`
- **AND** when a file finishes a `file_done` event is emitted: `{ type, current, total, file, patientsCreated, visitsCreated, errors }`
- **AND** after all files a `complete` event is emitted: `{ type, summary: ImportResult }`

---

### Requirement: XLSX Import UI (Frontend)

The progress indicator and result message now use Angular Material `mat-card` components instead of custom-styled divs.

#### Scenario: Real-time progress bar during import

- **WHEN** files are selected and the import begins
- **THEN** a `mat-card` containing a determinate `mat-progress-bar` SHALL appear
- **AND** the card SHALL display the name of the file currently being processed
- **AND** the card SHALL display the overall completion percentage
- **AND** the card SHALL display the total number of files being imported

#### Scenario: Progress percentage advances per file

- **WHEN** a `progress` SSE event is received for file N of M
- **THEN** the progress bar SHALL show `((N - 1) / M) * 100` percent
- **WHEN** a `file_done` SSE event is received for file N of M
- **THEN** the progress bar SHALL advance to `(N / M) * 100` percent

#### Scenario: Successful import result shown in Material card

- **WHEN** the import completes without errors
- **THEN** the progress card SHALL disappear
- **AND** a `mat-card` with a green left-border accent SHALL appear showing the import summary

#### Scenario: Import with warnings shown in Material card

- **WHEN** the import completes with non-fatal errors
- **THEN** a `mat-card` with an amber left-border accent SHALL appear showing the summary and warnings

## ADDED Requirements

### Requirement: SSE stream parsed client-side via Fetch API

The frontend import service SHALL use the native Fetch API with `ReadableStream` to consume the SSE stream.

#### Scenario: Service emits typed progress events as Observable

- **WHEN** `PatientService.importXlsx(files)` is called
- **THEN** it SHALL return an `Observable<ImportProgressEvent>`
- **AND** each SSE line parsed as `data: {...}` SHALL be emitted as a typed event
- **AND** emissions SHALL run inside `NgZone` to trigger Angular change detection
