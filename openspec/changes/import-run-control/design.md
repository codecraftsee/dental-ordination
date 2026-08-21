## Context

The `progress-bar` change gave the import a determinate bar and per-file labels; a later change added batching (`import-batch.ts`) so a large selection is split across sequential requests, and moved the run into a root-provided `PatientImportService` so it survives navigation. Those changes made the import *work* at scale. They did not make it *operable* at scale: there is still no way to stop it, no way to see it from another route, no record of what failed, and no tolerance for a single bad batch.

Two facts about the backend shape everything below, and both were verified against `dental-ordination-api`:

1. **Cancel is "stop", never "undo".** The endpoint commits one transaction per file (`app/routers/import_xlsx.py`), so aborting leaves every already-committed file in the database. The file in flight may still commit — the SSE generator is synchronous and runs in a threadpool, so it cannot be interrupted mid-file — and everything queued behind it never starts. There is no rollback and no server-side record of the run.

2. **Re-import is idempotent.** Patients are matched on `first_name ilike + last_name ilike + date_of_birth`; visits are matched on `(date, diagnosis_notes, treatment_notes)` and a repeat lands as `visits_skipped`. This is what makes cancel, resume and retry safe to build entirely in the frontend, with no server-side bookkeeping.

The one known edge: a card containing two byte-identical visit rows imports both on the first run and skips both on a re-run, because the dedupe set is deliberately not updated in-loop. This is pre-existing and out of scope.

## Goals / Non-Goals

**Goals:**
- Stop a running import promptly and safely, with honest copy about what stays behind
- Resume an interrupted run without re-importing what already landed
- Keep progress visible and reachable from every route
- Finish the run even when individual batches fail
- Make the failure list a real, persisted, exportable artifact
- Make selecting and starting an 8,000-file run tolerable

**Non-Goals:**
- Any backend change (handled by a separate follow-up in the API repo)
- Server-side run records, true cross-device resume, or an import audit trail
- Pausing and resuming without re-sending — cancel plus resume covers the need
- Parallel batches — the server processes files one at a time regardless
- Per-row progress within a file

## Decisions

### Decision 1: Split transport from orchestration

`PatientService.importXlsx()` currently owns the batch plan, the batch loop, the SSE parse, cross-batch renumbering, and summary accumulation. That leaves no seam to cancel one batch, retry one batch, or skip one batch.

- `PatientService.importXlsxBatch(files, doctorId, signal)` — one request, one SSE stream, raw per-batch `current`/`total`, no accumulation. It keeps what already works: `fetch` with `ReadableStream` (HttpClient cannot stream a response body), `snakeToCamelKeys` (the case interceptor is bypassed on this path), `NgZone.run()` around every emission, and the 401-refresh-and-retry. That retry stays because a long run outlives `ACCESS_TOKEN_EXPIRE_MINUTES=30`, and re-sending a batch that 401'd cannot double-import since nothing was processed under the 401.
- `PatientImportService` owns everything above one request. All the interesting logic then becomes testable without faking a multi-batch `fetch`.

### Decision 2: Immediate abort, not a graceful batch drain

Cancel granularity is bounded by the batch: within one request the server streams all its files and the client cannot interject. Draining the in-flight batch would give a fully deterministic end state, but at 50 files the user waits — potentially minutes — after clicking Cancel, which is exactly the powerlessness the button exists to fix.

So Cancel aborts at once and accepts one indeterminate file. Idempotent re-import makes that indeterminacy harmless: Resume simply re-sends it, and it lands as `visits_skipped` if it did commit.

### Decision 3: `MAX_FILES_PER_REQUEST` 200 → 50

The constant was tuned only against backend limits. It silently controls three UX properties:

| | at 200 | at 50 |
|---|---|---|
| Cancel granularity | up to 200 files of wasted work | up to 50 |
| Resume waste on re-run | re-parse up to 200 files | up to 50 |
| Frozen-bar window per batch | up to 80 MB uploaded with zero visible progress | seconds |
| Requests for 8,140 files | 41 | ~163 |

163 sequential requests is not a problem. The byte cap stays as-is, and still splits a batch earlier when the files are large.

### Decision 4: Name the upload phase instead of hiding it

`fetch` cannot report upload progress, and switching to XHR to get it would forfeit the streamed response — one request cannot have both. Rather than leave the bar mysteriously still, the run state machine exposes `uploading` as a distinct phase and the panel labels it ("Batch 7 of 163 — uploading…"). Smaller batches shrink the window; naming it removes the "is it hung?" question entirely.

### Decision 5: Run state machine on the service

`idle | uploading | processing | cancelling | stopped | completed | failed`, exposed as readonly signals alongside the existing progress signals. Terminal states (`stopped`, `completed`, `failed`) do not auto-dismiss — `MESSAGE_DISMISS_MS` made sense for a three-file run and is wrong for a forty-minute one.

### Decision 6: Retry with backoff, then skip and continue

A run of 163 batches will meet a transient failure. Retrying a batch ~3× with backoff absorbs blips; a batch that still fails has its files recorded as failed in the report and the run moves on. The alternative — stopping the run — trades a complete result plus an accurate failure list for an incomplete result and a manual restart. The report is what makes skipping safe: the user knows exactly which files to re-run, and re-running them is idempotent.

### Decision 7: Persist the manifest and the failures, not the file blobs

The run itself cannot survive a tab close: the `fetch` dies with the page. What can survive is knowing *where it stopped* and *what went wrong*.

- **Resume manifest** (while running): file identities plus `doneCount`, `doctorId`, `startedAt`. Identity is `name|size|lastModified`, already the dedupe key in the import dialog — extracted to a shared helper so selection dedupe and resume matching cannot drift apart. On load, `doneCount < total` means an interrupted run; the user re-picks the folder and the completed files are skipped.
- **Report** (on finish): failed and warned rows in full, successes as aggregate counts. Roughly 8,140 full rows would be about 1 MB against a typical 5 MB quota; failures-only lands in the tens of KB. The successful files are precisely the ones nobody needs to inspect individually.

Storing the `File` blobs in IndexedDB would give true one-click resume — `File` is structured-cloneable — but duplicates hundreds of megabytes to disk and needs its own eviction story, for a scenario that is already recoverable by re-picking a folder.

### Decision 8: ETA from a rolling window

Files vary enormously — a card with three visits and a card with two hundred are both one file. A whole-run average is dominated by whatever the early batches happened to contain, so throughput and ETA come from a rolling window over roughly the last 50 `file_done` timestamps.

### Decision 9: `/import` as a view over service state

The route renders `PatientImportService` signals; it does not own the run. Navigating away from `/import` therefore changes nothing — the fetch continues, the panel keeps reporting, and returning re-renders from the same signals. Refresh is the case that loses state, and Decision 7 covers it.

### Decision 10: `beforeunload`, not a route guard

Navigation is already harmless, so blocking it would lock the app for up to an hour to solve a problem that does not exist. The destructive action is closing or reloading the tab, which only `beforeunload` can intercept. It is registered through `App`'s existing `host` object, alongside `(window:resize)` — the project bans `@HostListener`.

### Decision 11: Folder pick with a collapsed summary

`webkitdirectory` matches how the source data is actually organised — one folder per patient — and replaces an 8,000-item multi-select. The selection is summarised ("8,140 files · 412 MB · 163 batches · est. 35–50 min") with the full list behind a toggle, rendered in a `cdk-virtual-scroll-viewport`; `@angular/cdk` is already a dependency. This fixes both the ergonomics and the 8,000-DOM-node problem, and sets expectations on duration before the user commits.
