## Why

The XLSX import is about to be used for the real migration: roughly 8,000 per-patient card files in a single run, taking 30–90 minutes. Everything about the current UI was built for a handful of files and breaks down at that scale.

- **There is no way to stop a run.** The only exit is closing the tab.
- **Progress is invisible off the dashboard.** The run itself already survives navigation — `PatientImportService` is root-provided and its subscription is deliberately never torn down — but the progress card lives in `home.html`, so leaving the dashboard hides it with no way to get it back.
- **`errors[]` is never rendered anywhere.** The summary shows only `filesProcessed`, `patientsCreated` and `visitsCreated`; the per-file error list is silently discarded by both `patient-import.service.ts` and `home.html`. Across 8,000 legacy cards this means files that failed to import look exactly like files that succeeded. The `xlsx-import` spec already promises a warnings card that was never built.
- **A single failed batch ends the whole run.** `patient.service.ts` throws on any non-OK response, so one network blip or one 500 at file 6,000 abandons everything still queued.
- **The progress bar freezes for minutes at a time.** `fetch` cannot report upload progress, so during each batch's upload leg nothing moves and no filename changes. At `MAX_FILES_PER_REQUEST = 200` (up to 80 MB per request) that stall reads as a hang.
- **Selecting the files is itself painful.** There is no folder picker, and the dialog renders every selected file as a DOM row — 8,000 nodes plus a re-plan on every add.
- **The result summary auto-dismisses after 5 seconds**, at the end of a run that may have taken 40 minutes.

The goal is an import you can watch from anywhere, stop safely, resume, and audit afterwards — and that finishes even when individual batches fail.

## What Changes

- **Cancel.** A Cancel control on the progress surface aborts the run immediately. Copy states plainly that already-imported files stay and nothing is undone.
- **Resume.** The remaining files are re-sent from where the run stopped. Safe because the API's import is idempotent (patients matched on name + date of birth, visits on date + notes, re-imports landing as `visits_skipped`).
- **Retry-then-skip.** A failed batch is retried with backoff; if it still fails, its files are recorded as failed in the report and the run continues to the next batch.
- **A global progress panel** rendered in the app shell instead of on the dashboard, so it follows the user across routes. Collapses to a pill while running; only dismissible once the run ends.
- **Richer live progress**: an explicit `uploading` phase label, elapsed / ETA / files-per-minute, and running tallies for patients created, visits created, duplicates skipped and files failed — all from data the `file_done` event already carries and currently throws away.
- **A `beforeunload` guard** while a run is in progress, which is the case that genuinely does destroy a run.
- **A new `/import` route** owning file selection, the live run, and the last run's report: summary, filterable per-file table, CSV export.
- **Report persistence.** Failed and warned rows are persisted in full and survive a refresh; successes are kept as aggregate counts.
- **A resume manifest** in localStorage, so a run interrupted by a tab close can be continued by re-picking the same folder.
- **Folder picking** via `webkitdirectory` alongside the existing file picker, with a collapsed selection summary and a virtualized list.
- **`MAX_FILES_PER_REQUEST` 200 → 50**, which simultaneously tightens cancel granularity, reduces resume waste, and shortens each frozen-bar window. The byte cap is unchanged.
- **Terminal states stop auto-dismissing.**

Backend changes are explicitly out of scope for this change; a follow-up handoff covers the API repo.

## Capabilities

### Modified Capabilities

- `xlsx-import`: the frontend import gains run control (cancel, resume, retry-then-skip), a navigation-independent progress surface, a persisted per-file report, and folder-based selection. The backend endpoint is unchanged by this change; its existing requirements stand as documented.

## Impact

- `src/app/services/patient.service.ts` — `importXlsx()` split into `importXlsxBatch()`: one request, one SSE stream, no batching or accumulation. Keeps the `fetch` streaming, `snakeToCamelKeys` conversion, `NgZone.run()` wrapping and 401-refresh-retry.
- `src/app/services/patient-import.service.ts` — becomes the run orchestrator: batch loop, run state machine, cancel, resume, retry-then-skip, per-file results, tallies, ETA.
- `src/app/services/import-batch.ts` — `MAX_FILES_PER_REQUEST` 200 → 50; docstring updated to record why the constant is now a UX lever and not only a backend limit.
- `src/app/services/import-run-store.ts` — **new.** localStorage persistence for the resume manifest and the last-run report.
- `src/app/shared/import-progress/` — **new.** App-shell progress panel with collapse and cancel.
- `src/app/import/` — **new.** Lazy `/import` route: selection, live run, report, CSV export.
- `src/app/app.html`, `src/app/app.ts` — render the panel inside `mat-sidenav-content`; add the `beforeunload` guard to the existing `host` object.
- `src/app/app.routes.ts` — `/import` route, gated on `authGuard` + `permissionGuard([Permission.AdminImport])`.
- `src/app/shared/sidebar/sidebar.ts` — add the `/import` link to the permission-gated link list.
- `src/app/home/home.ts`, `home.html`, `home.scss` — import button becomes a link to `/import`; progress and message cards removed.
- `src/app/shared/import-dialog/` — folded into the `/import` screen or retired.
- `public/i18n/en.json`, `public/i18n/sr.json` — new keys for run states, cancel confirmation, tallies, report columns and failure reasons.
