> Phases are gated: finish a phase, report, and wait for sign-off before starting the next.

## 1. Service layer — transport

- [x] 1.1 Split `PatientService.importXlsx()` into `importXlsxBatch(files, doctorId, signal)`: one request, one SSE stream, raw per-batch `current`/`total`, no batching and no accumulation
- [x] 1.2 Keep the `fetch` + `ReadableStream` SSE parse, `snakeToCamelKeys` conversion and `NgZone.run()` wrapping unchanged
- [x] 1.3 Keep the 401 refresh-and-retry inside the batch call, and keep its comment explaining why the error interceptor never sees this request
- [x] 1.4 Accept an external `AbortSignal` so the orchestrator owns cancellation
- [x] 1.5 Update `patient.service.spec.ts` for the narrowed contract

## 2. Service layer — orchestration

- [x] 2.1 Lower `MAX_FILES_PER_REQUEST` 200 → 50 in `import-batch.ts`; extend the docstring to record that the constant now also bounds cancel granularity, resume waste and the upload stall
- [x] 2.2 Extract the `name|size|lastModified` file-identity helper out of `import-dialog.ts` into a shared module, so selection dedupe and resume matching share one definition
- [x] 2.3 Add the run state machine to `PatientImportService`: `idle | uploading | processing | cancelling | stopped | completed | failed`, exposed as readonly signals
- [x] 2.4 Move the batch loop, cross-batch renumbering and summary accumulation out of `PatientService` into `PatientImportService`
- [x] 2.5 Record per-file outcomes (imported / skipped / incomplete / failed + reason) from `file_done`, and keep running tallies
- [x] 2.6 Track elapsed, throughput and ETA from a rolling window over roughly the last 50 `file_done` timestamps
- [x] 2.7 Implement `cancel()`: abort the in-flight request, send no further batches, settle in `stopped` with the processed count
- [x] 2.8 Implement retry-then-skip: retry a failed batch ~3× with backoff, then record its files as failed and continue
- [x] 2.9 Implement `resume()`: re-send only files not confirmed complete
- [x] 2.10 Remove the `MESSAGE_DISMISS_MS` auto-dismiss for terminal states
- [x] 2.11 Keep `refreshCaches()` behaviour as-is, including its `catchError` isolation and permission gating

## 3. Service layer — persistence

- [x] 3.1 Create `import-run-store.ts`: localStorage read/write for the resume manifest and the last-run report
- [x] 3.2 Persist the manifest (file identities, `doneCount`, `doctorId`, `startedAt`) as the run advances
- [x] 3.3 On finish, persist failed and incomplete rows in full plus aggregate counts for successes
- [x] 3.4 Expose interrupted-run detection (`doneCount < total`) and a way to discard it
- [x] 3.5 Guard against quota errors and malformed stored payloads

## 4. Service layer — tests

- [x] 4.1 `patient-import.service.spec.ts`: cancel mid-batch stops the run and reports the processed count
- [x] 4.2 A batch failing 3× is recorded as failed and the run continues to the next batch
- [x] 4.3 Resume sends only the outstanding files
- [x] 4.4 Per-file outcomes and tallies are derived correctly from `file_done`
- [x] 4.5 `import-run-store.spec.ts`: manifest and report round-trip, interrupted-run detection, corrupt-payload handling
- [x] 4.6 `import-batch.spec.ts`: batches respect the new count limit alongside the byte ceiling

## 5. Progress panel

- [x] 5.1 Create `src/app/shared/import-progress/` (standalone, `OnPush`, `inject()`, signals)
- [x] 5.2 Expanded view: phase label, determinate `mat-progress-bar`, current file, elapsed / ETA / files-per-minute, live tallies, Cancel
- [x] 5.3 Uploading state names the batch being sent ("Batch 7 of 163 — uploading…")
- [x] 5.4 Collapsed view: compact pill with percentage; collapse allowed during a run, dismiss only in a terminal state
- [x] 5.5 Cancel confirmation dialog stating that imported files remain and nothing is undone
- [x] 5.6 Render the panel in `app.html` inside `mat-sidenav-content`
- [x] 5.7 Add the `beforeunload` guard to `App`'s `host` object beside `(window:resize)` — not `@HostListener`
- [x] 5.8 `import-progress.spec.ts` covering each run state, collapse, and the cancel path

## 6. `/import` route

- [x] 6.1 Create `src/app/import/import.ts` + `.html` + `.scss` with a default export
- [x] 6.2 Register the lazy route with `authGuard` + `permissionGuard([Permission.AdminImport])`
- [x] 6.3 Selection: `webkitdirectory` folder pick alongside the file picker, both filtering `.xlsx` for real
- [x] 6.4 Collapsed selection summary — file count, total size, batch count, estimated duration — with the full list behind a toggle in a `cdk-virtual-scroll-viewport`
- [x] 6.5 Keep the oversized-file callout and the doctor selection from the existing dialog
- [x] 6.6 Interrupted-run prompt: where it stopped, re-select to continue, or discard
- [x] 6.7 Report view: run summary, per-file table filterable by outcome and searchable by name
- [x] 6.8 CSV export of the report via `Blob` + anchor download
- [x] 6.9 Point Home's import button at `/import` and remove the progress and message cards from `home.html`/`home.ts`/`home.scss`
- [x] 6.10 Add the permission-gated `/import` entry to the sidebar link list
- [x] 6.11 Fold `import-dialog` into the screen or retire it, updating or removing `import-dialog.spec.ts`
- [x] 6.12 `import.spec.ts` covering selection, the resume prompt, report filtering and CSV export

## 7. i18n

- [x] 7.1 Add keys for run states, phase labels, ETA and throughput to `en.json` and `sr.json`
- [x] 7.2 Add keys for the cancel confirmation, including the "nothing is undone" wording
- [x] 7.3 Add keys for report columns, outcomes and failure reasons
- [x] 7.4 Add keys for the interrupted-run prompt and the selection summary
- [x] 7.5 Confirm both files hold the same key set

## 8. Accessibility and gate

- [x] 8.1 Progress surface keeps `role="status"` / `aria-live="polite"`; terminal failures announce assertively
- [x] 8.2 Cancel confirmation manages focus and is fully keyboard operable
- [x] 8.3 Virtualized list and report table stay keyboard reachable with correct row semantics
- [x] 8.4 Contrast holds for every outcome colour in both light and dark themes
- [x] 8.5 `npm run lint`, `npm test`, `npm run build` all green

## 9. Verify

- [ ] 9.1 Start a large run, navigate across routes — panel follows, numbers keep moving, `/import` shows live state on return
- [ ] 9.2 Cancel mid-batch — copy is accurate, the run stops promptly, already-committed patients are still in the database
- [ ] 9.3 Resume — previously imported files come back as skipped, not duplicated
- [ ] 9.4 Kill the API mid-run — the batch retries, is recorded failed, the run continues, and the report names exactly those files
- [ ] 9.5 Reload mid-run — the resume prompt appears and re-picking the folder continues from where it stopped
- [ ] 9.6 Refresh after a finished run — the failure and warning report is still readable
- [ ] 9.7 Attempt to close the tab mid-run — the browser prompts
- [ ] 9.8 Select ~8,000 files by folder — the screen stays responsive and the rendered row count does not scale with the selection

## 10. Handoff

- [x] 10.1 Write the API-repo prompt covering `MAX_IMPORT_FILES` and the endpoint docstring now that clients send 50 per request, client-disconnect detection in the SSE generator, and the deferred `import_run` table for server-side resume and audit
