# API handoff — after `import-run-control`

Paste the section below into a fresh Claude Code session in
`~/Documents/work-projects/dental-ordination-api`. It is written to be
self-contained; everything it claims about the frontend was true as of this
change.

---

## Context

The Angular frontend just shipped `import-run-control`, a rework of the XLSX
import for the real migration: roughly 8,000 per-patient cards in one run. Read
`openspec/changes/import-run-control/` in the frontend repo
(`~/Documents/work-projects/dental-ordination`) if you need the full picture.

Nothing in the API changed. Four things now want a decision on this side.
Please investigate each, tell me what you find, and **wait for sign-off before
writing code** — some of these are questions, not instructions.

### 1. The client now sends 50 files per request, not 200

`MAX_FILES_PER_REQUEST` in `src/app/services/import-batch.ts` went from 200 to
**50**. It stopped being purely a backend limit: it also bounds how much work a
user's cancel throws away, how much a resume re-sends, and how long the progress
bar sits frozen while a batch uploads (`fetch` cannot report upload progress and
the API streams nothing until it holds the whole body).

Consequences to look at in `app/routers/import_xlsx.py`:

- The endpoint docstring says *"Callers should send **at most 200 files per
  request** (the frontend's MAX_FILES_PER_REQUEST)"* (around line 640). It names
  a constant that no longer has that value. Update the wording.
- `MAX_IMPORT_FILES = 5000` and the whole `_RaisedFileLimitRoute` class exist to
  lift Starlette's default `max_files=1000` so a large single request is not
  rejected with a bare 400 before the module runs. At 50 files per request the
  real client can never come close. **Question, not an instruction:** is that
  machinery still worth its weight as a backstop against a non-browser caller,
  or should it go? I lean towards keeping it — deleting it re-opens a failure
  mode that reads as a silent hang — but lowering `MAX_IMPORT_FILES` and saying
  in the comment that it is a backstop rather than a supported size would make
  the intent clearer. Your call.

An 8,000-file run is now ~163 sequential requests instead of 41. Worth a glance
at whether anything per-request is more expensive than it looks —
`_load_doctor_index()` runs once per request and opens its own session, so it
now runs 163 times instead of 41. Probably fine; confirm rather than assume.

### 2. What actually happens when the client disconnects mid-stream

The frontend now has a Cancel button. It aborts the `fetch`, which drops the
connection part-way through a request.

The user-facing copy promises: *"Files that have already been imported will stay
— nothing is undone. You can resume from where it stopped."* That promise rests
on a claim about this endpoint that I reasoned about but **did not verify by
running it**:

> `generate()` is a synchronous generator handed to `StreamingResponse`, so
> Starlette drives it through `iterate_in_threadpool`. On disconnect the
> streaming task is cancelled, but the worker thread finishes whatever `next()`
> call is already in flight — so the file being parsed and committed at that
> moment runs to completion, and every file queued behind it is never started.

**Please verify this experimentally** (a test that starts an import and drops the
connection mid-stream, then asserts what landed). If it is wrong — in particular
if the generator keeps being advanced after disconnect and imports the whole
batch anyway — tell me, because the frontend's cancel is then much weaker than
it claims and the copy needs to change.

Two follow-ups, once the behaviour is known:

- **Logging.** An aborted import currently leaves no trace server-side. Wrapping
  the per-file loop so `GeneratorExit` is caught and logged (`logger.info` with
  the filename and how many files had been processed) would make cancels visible
  in the logs. Low risk, clearly worth it.
- **Explicit disconnect checks.** Checking `await request.is_disconnected()`
  between files would make the stop deterministic instead of incidental. It
  needs `generate()` to become an async generator, and the per-file work is
  blocking DB I/O that would then have to go through `run_in_threadpool` or it
  will block the event loop. That is a real refactor with real risk. Only worth
  it if step one shows the current behaviour is wrong.

### 3. The deferred `import_run` table

Server-side run tracking was explicitly deferred out of the frontend change. The
frontend today persists a resume manifest in `localStorage`, which means resume
is per-browser: it is lost if the user switches machines or clears storage, and
it is invisible to anyone else.

A server-side record would give true cross-device resume, and — more importantly
for patient data — an audit trail answering "what did the migration actually do,
and who ran it" months later.

Rough shape to react to, not a spec:

- `import_runs`: id, `started_by` (user id), `started_at`, `finished_at`,
  `status`, `total_files`, `files_processed`, and the `_empty_counts()` counters.
- optionally `import_run_files`: run_id, filename, a client-supplied file
  identity, outcome, errors.

**The schema constraint matters here.** There is no alembic —
`run_startup_migrations()` in `app/main.py` does `Base.metadata.create_all()`
plus hand-rolled DDL, and `create_all()` skips tables that already exist. So a
brand-new table is the easy case: `create_all()` handles it. Adding a nullable
`import_run_id` column to `patients` or `visits` to link records back to a run is
the hard case and needs an explicit `ALTER TABLE ... IF NOT EXISTS` in that
function, in the same style as the existing user-table migrations.

Start with a proposal on scope and shape. Do not build it yet.

### 4. A known pre-existing edge, for the record

In `_import_workbook`, the `existing_visits` comparison set is deliberately not
updated as rows are inserted (there is a comment saying so, around line 497). So
a card containing two byte-identical visit rows imports both on the first run and
skips both on a re-run. It is documented as a deliberate deferral and the
frontend's design notes record it. **Not asking you to change it** — flagging it
so it does not get "discovered" later as a regression from this work.

---

## The contract the frontend now depends on

The frontend used to read three fields off `file_done` and ignore the rest. It
now reads all of them and classifies every file from them, so these are load-
bearing in a way they were not before. Please do not change them without telling
me.

- **Every counter in `_empty_counts()` is consumed.** All seven:
  `patients_created`, `patients_found`, `patients_updated`, `visits_created`,
  `visits_skipped`, `patients_incomplete`, `visits_incomplete`. Adding a counter
  is safe; removing or renaming one is not.
- **`patients_created + patients_found == 0` means the file failed.** That is how
  the frontend distinguishes a file that did not land from one that landed with
  problems. If the API ever commits a file without touching a patient, that
  classification silently breaks.
- **`patients_created + visits_created + patients_updated == 0` means the file
  was a no-op**, reported to the user as "already present". This is what makes a
  resumed run readable.
- **`errors` on a file that *did* land means "incomplete", not "failed"** — an
  unresolvable doctor initial appends an error while the rest of the card
  commits. Every error string now reaches a user-visible report and a CSV export,
  so they are read by humans; keep them specific and keep the filename in them.
- **`file_done.current` is 1-based within the request and is used as an index
  into the batch that was sent.** One `file_done` per file, in the order the
  files arrived. If a file can ever be skipped without emitting one, or emitted
  twice, the frontend attributes results to the wrong file.
- **Non-OK responses:** the body's `detail` is shown to the user verbatim, and
  the status code drives retry. A request that never got a response, 5xx, 408 and
  429 are retried up to three times with backoff; any other 4xx is not retried
  and the batch's files are recorded as failed. So do not use a 4xx for something
  transient.
- **Re-sending a batch must stay safe.** Retry, resume and the interrupted-run
  flow all rely on an already-imported file coming back as `visits_skipped`
  rather than duplicating.

## How to work here

- `venv/bin/ruff check app tests` and `venv/bin/ruff format app tests`.
- Tests need real PostgreSQL:
  `docker compose -f docker-compose.test.yml up -d`, then `pytest`.
- `tests/test_import.py` already has 28 tests covering this endpoint — extend it
  rather than starting a new file.
- The capability spec is `openspec/specs/import-xlsx/`. If any of the above turns
  into real work, it should go through OpenSpec.
