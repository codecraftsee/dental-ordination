## MODIFIED Requirements

### Requirement: XLSX Import UI (Frontend)

The import is a dedicated screen at `/import` rather than a dialog launched from the dashboard, and its progress is reported by an app-shell surface rather than a dashboard card.

#### Scenario: Reaching the import screen

- **WHEN** a user holding `admin:import` opens the dashboard or the sidebar
- **THEN** the "Import XLSX" control SHALL navigate to `/import`
- **AND** the route SHALL be guarded by `authGuard` and `permissionGuard([Permission.AdminImport])`
- **AND** a user without `admin:import` SHALL NOT see the sidebar entry and SHALL NOT reach the route

#### Scenario: Import in progress

- **WHEN** a run is in progress
- **THEN** the progress surface SHALL be rendered by the app shell and SHALL remain visible on every route
- **AND** it SHALL display the current phase, the overall completion percentage, and the file currently being processed
- **AND** it SHALL display elapsed time, estimated time remaining, and throughput in files per minute
- **AND** it SHALL display running totals for patients created, visits created, duplicate visits skipped, and files failed
- **AND** the control that starts an import SHALL be disabled

#### Scenario: Progress percentage advances per file

- **WHEN** a `progress` SSE event is received for file N of M
- **THEN** the progress bar SHALL show `((N - 1) / M) * 100` percent
- **WHEN** a `file_done` SSE event is received for file N of M
- **THEN** the progress bar SHALL advance to `(N / M) * 100` percent
- **AND** `N` and `M` SHALL be numbered across the whole selection, not the current batch

#### Scenario: Successful import

- **WHEN** a run completes with every file imported
- **THEN** the progress surface SHALL enter a terminal state showing the run summary
- **AND** the summary SHALL NOT auto-dismiss
- **AND** the affected caches SHALL be reloaded

#### Scenario: Import with warnings

- **WHEN** a run completes but individual files reported non-fatal errors
- **THEN** the summary SHALL state how many files failed or were incomplete
- **AND** it SHALL link to the report listing each affected file and its reason

#### Scenario: Import failure

- **WHEN** a run ends without processing any file successfully
- **THEN** the failure reason SHALL be shown in a terminal state that does not auto-dismiss

---

### Requirement: Import request batching

A selection is split into sequential requests bounded by both a file count and a byte size. The count limit is additionally chosen so that cancelling, resuming, or stalling on upload costs at most one batch.

#### Scenario: Batch size bounds cancel and resume cost

- **WHEN** a selection is planned into batches
- **THEN** no batch SHALL contain more than 50 files
- **AND** no batch SHALL exceed the byte ceiling held below Caddy's `request_body max_size`
- **AND** a file larger than a whole request SHALL be set aside and reported, not sent

## ADDED Requirements

### Requirement: Import run control

A run in progress can be stopped by the user, and an incomplete run can be resumed.

#### Scenario: Cancelling a run

- **WHEN** the user activates Cancel during a run
- **THEN** a confirmation SHALL state that files already imported will remain and that nothing is undone
- **AND** on confirmation the in-flight request SHALL be aborted and no further batches SHALL be sent
- **AND** the run SHALL reach the `stopped` state showing how many files of the selection were processed

#### Scenario: Cancelled data is not rolled back

- **WHEN** a run is cancelled after files have been imported
- **THEN** those files SHALL remain imported
- **AND** the file in flight at the moment of cancellation MAY or MAY NOT have been imported
- **AND** re-sending either SHALL be safe, because the API matches existing patients and visits and reports repeats as skipped

#### Scenario: Resuming a stopped run

- **WHEN** the user resumes a run that was stopped or that ended with failures
- **THEN** only the files not yet confirmed complete SHALL be sent
- **AND** any file re-sent that was already imported SHALL be reported as skipped rather than duplicated

#### Scenario: A failed batch does not end the run

- **WHEN** a batch request fails
- **THEN** it SHALL be retried with backoff
- **AND** if it still fails, every file in that batch SHALL be recorded as failed
- **AND** the run SHALL continue with the next batch
- **AND** the run SHALL reach a terminal state reporting both the imported and the failed files

#### Scenario: Access token expiring mid-run

- **WHEN** a batch request returns 401
- **THEN** the token SHALL be refreshed once and the batch re-sent
- **AND** if the refresh fails the run SHALL end and the user SHALL be logged out

---

### Requirement: Import progress surface

Progress is reported by a surface owned by the app shell, independent of the active route.

#### Scenario: Navigating during a run

- **WHEN** the user navigates to another route while a run is in progress
- **THEN** the run SHALL continue uninterrupted
- **AND** the progress surface SHALL remain visible and keep updating
- **AND** returning to `/import` SHALL show the live state of the same run

#### Scenario: Collapsing the surface

- **WHEN** a run is in progress
- **THEN** the surface MAY be collapsed to a compact indicator showing the percentage
- **AND** it SHALL NOT be dismissible until the run reaches a terminal state

#### Scenario: Upload phase is named

- **WHEN** a batch is uploading and no progress event has yet been received for it
- **THEN** the surface SHALL show an explicit uploading state identifying which batch of how many is being sent

#### Scenario: Leaving the page during a run

- **WHEN** the user attempts to close or reload the tab while a run is in progress
- **THEN** the browser SHALL prompt for confirmation before unloading

---

### Requirement: Import report

Every run produces a per-file record that outlives the run.

#### Scenario: Per-file outcomes are recorded

- **WHEN** a run is in progress or has finished
- **THEN** each file SHALL carry an outcome of imported, skipped as duplicate, incomplete, or failed
- **AND** a failed or incomplete file SHALL carry the reason reported by the API

#### Scenario: Reading the report

- **WHEN** the user opens `/import` after a run
- **THEN** the last run's summary and per-file table SHALL be shown
- **AND** the table SHALL be filterable by outcome and searchable by file name
- **AND** the report SHALL be exportable as CSV

#### Scenario: Report survives a refresh

- **WHEN** the page is refreshed after a run has finished
- **THEN** every failed and incomplete row SHALL still be listed with its reason
- **AND** successful files SHALL still be represented by their aggregate counts

#### Scenario: Errors are never silently discarded

- **WHEN** the API reports errors for a file
- **THEN** those errors SHALL appear in the report
- **AND** the run summary SHALL state how many files were affected

---

### Requirement: Interrupted run recovery

A run destroyed by a tab close or reload can be continued without re-importing what already landed.

#### Scenario: Recording run position

- **WHEN** a run is in progress
- **THEN** the identities of the selected files and the number completed SHALL be persisted
- **AND** file identity SHALL be its name, size and last-modified time

#### Scenario: Offering to continue

- **WHEN** `/import` is opened and a persisted run is incomplete
- **THEN** the user SHALL be told where it stopped and invited to re-select the same source
- **AND** files matching identities already completed SHALL be excluded from the new run
- **AND** files not matching any recorded identity SHALL be treated as a new selection

#### Scenario: Clearing a recovered run

- **WHEN** the user declines to continue an interrupted run
- **THEN** the persisted position SHALL be discarded and a fresh selection SHALL start a new run

---

### Requirement: Import file selection

Selection scales to thousands of files organised in per-patient folders.

#### Scenario: Selecting a folder

- **WHEN** the user chooses to select a folder
- **THEN** every `.xlsx` file beneath it SHALL be collected recursively
- **AND** files that are not `.xlsx` SHALL be ignored regardless of the picker's filter

#### Scenario: Summarising a large selection

- **WHEN** files are selected
- **THEN** the screen SHALL show the file count, total size, the number of requests the run will take, and an estimated duration
- **AND** the full file list SHALL be available on demand and SHALL be virtualized so that the rendered row count does not grow with the selection

#### Scenario: Adding to a selection

- **WHEN** the user adds more files to an existing selection
- **THEN** they SHALL be appended rather than replacing it
- **AND** files already present SHALL be deduplicated on name, size and last-modified time

#### Scenario: Files too large to send

- **WHEN** the selection contains a file larger than a single request allows
- **THEN** it SHALL be listed as unsendable with the maximum size
- **AND** it SHALL be excluded from the run rather than failing it
