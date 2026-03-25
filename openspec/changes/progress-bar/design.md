## Context

The original import endpoint returned a single JSON response after processing all files. There was no mechanism to push intermediate state to the frontend. The frontend had no way to tell users which file was being processed or how far along the batch was.

## Goals / Non-Goals

**Goals:**
- Stream per-file progress events from backend to frontend during import
- Display a determinate progress bar showing overall batch completion percentage
- Show the name of the file currently being processed
- Use Angular Material components for the progress UI (consistent with the rest of the dashboard)

**Non-Goals:**
- Per-row granularity within a single file (file-level granularity is sufficient)
- Cancel/pause functionality
- Progress persistence across page reloads

## Decisions

### Decision 1: Server-Sent Events (SSE) over WebSockets

SSE is a simple, one-way streaming protocol over plain HTTP — no handshake overhead, no extra server dependencies, and natively supported by browsers. Since import is unidirectional (server → client), SSE is a better fit than WebSockets. The backend yields `data: {...}\n\n` lines for each event.

### Decision 2: Fetch API with `ReadableStream` instead of `HttpClient`

Angular's `HttpClient` does not support streaming response bodies. The `importXlsx()` method in `PatientService` uses the native `Fetch API` with `response.body.getReader()` to consume the SSE stream chunk by chunk. `NgZone.run()` wraps each emission so that Angular's change detection fires correctly.

### Decision 3: Three SSE event types

| Type | Payload | When emitted |
|------|---------|--------------|
| `progress` | `{ current, total, file }` | At the start of processing each file |
| `file_done` | `{ current, total, file, patientsCreated, visitsCreated, errors }` | When a file finishes |
| `complete` | `{ summary: ImportResult }` | After all files are done |

Frontend progress % is calculated as:
- On `progress`: `((current - 1) / total) * 100` — sets bar to start of file N
- On `file_done`: `(current / total) * 100` — advances bar to end of file N

### Decision 4: `mat-card` for progress container and result message

The existing import UI used plain divs with custom SCSS. Wrapping in `mat-card` aligns with the dashboard's existing stat cards and follows the project convention of using Angular Material components throughout. The result message card uses a left-border accent (`--color-success` / `--color-warning`) instead of a full background color for a lighter visual weight.
