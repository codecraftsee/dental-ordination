## Why

The XLSX import feature previously gave users no feedback during upload — just a disabled button labeled "Importing…". For large batches of files this left users uncertain whether the import was running, stalled, or done. A real-time progress bar with per-file status makes the import experience clear and trustworthy.

Additionally, the progress indicator and result message were styled with custom SCSS, inconsistent with the rest of the dashboard which uses Angular Material components throughout.

## What Changes

- Backend streams import progress via Server-Sent Events (SSE) so the frontend can update in real time
- Frontend subscribes to the SSE stream and drives a determinate `mat-progress-bar`
- Progress block and result message are wrapped in `mat-card` (Angular Material) instead of custom-styled divs
- New i18n keys for file-processing labels

## Capabilities

### Modified Capabilities

- `xlsx-import-frontend`: Extended with real-time SSE-driven progress tracking, per-file name display, and percentage readout
- `xlsx-import-backend`: Extended to stream `progress`, `file_done`, and `complete` SSE events instead of returning a single JSON response

## Impact

- `src/app/services/patient.service.ts` — replace `HttpClient.post()` with Fetch + `ReadableStream` SSE parsing; add `ImportProgressEvent` union type
- `src/app/home/home.ts` — add `importProgress`, `importCurrentFile`, `importTotal` signals; subscribe to SSE events; import `MatProgressBarModule`
- `src/app/home/home.html` — replace custom progress div with `mat-card`+`mat-progress-bar` block; replace custom message div with `mat-card`
- `src/app/home/home.scss` — remove custom `.import-progress*` and `.import-message` blocks; add scoped Material card styles
- `public/i18n/en.json`, `public/i18n/sr.json` — add `home.importingFile`, `home.importingFiles` keys
