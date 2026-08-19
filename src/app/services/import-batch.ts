/**
 * How a selection of XLSX files is split into import requests.
 *
 * Two backend limits bound one request, and they are not the same thing:
 *
 * - **Bytes.** Caddy enforces `request_body max_size 100MB` in front of the API
 *   (`Caddyfile`), and the API's own source calls this "the real ceiling". Caddy
 *   rejects with a 413 *before* the API runs, so the response is not JSON and
 *   carries no `detail` — the user would see a failure with no reason.
 * - **Count.** `MAX_IMPORT_FILES = 5000` (`app/routers/import_xlsx.py`) is a
 *   backstop against a pathological file count; past it the API returns a plain
 *   400 rather than the `text/event-stream` the progress reader expects, which
 *   reads as a hang. The endpoint docstring asks callers for at most 200 per
 *   request, which is what we honour.
 *
 * Splitting on count alone is not enough: 200 files averaging 600 KB is a 120 MB
 * request. Both limits are applied per batch.
 */

/** Matches the "at most 200 files per request" the import endpoint documents. */
export const MAX_FILES_PER_REQUEST = 200;

/**
 * Bytes per request, held below Caddy's 100 MB so multipart framing, the field
 * names and the `doctor_id` field cannot push a batch over the line.
 */
export const MAX_REQUEST_BYTES = 80 * 1024 * 1024;

export interface ImportPlan {
  /** Files to send, grouped one group per request. */
  batches: File[][];
  /** Everything in `batches`, flattened — the files that will actually be sent. */
  accepted: File[];
  /** Files larger than a whole request, which no batching can make sendable. */
  oversized: File[];
  /** Total bytes across `accepted`. */
  totalBytes: number;
}

/**
 * Group `files` into batches that respect both limits, setting aside any single
 * file too large to ever be sent.
 *
 * Order is preserved: batches fill greedily in the order given, so the progress
 * numbering the user sees follows the order they picked.
 */
export function planImport(files: File[]): ImportPlan {
  const oversized: File[] = [];
  const accepted: File[] = [];
  const batches: File[][] = [];

  let current: File[] = [];
  let currentBytes = 0;
  let totalBytes = 0;

  for (const file of files) {
    if (file.size > MAX_REQUEST_BYTES) {
      oversized.push(file);
      continue;
    }

    const wouldExceedBytes = currentBytes + file.size > MAX_REQUEST_BYTES;
    const wouldExceedCount = current.length >= MAX_FILES_PER_REQUEST;
    if (current.length > 0 && (wouldExceedBytes || wouldExceedCount)) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }

    current.push(file);
    currentBytes += file.size;
    accepted.push(file);
    totalBytes += file.size;
  }

  if (current.length > 0) batches.push(current);

  return { batches, accepted, oversized, totalBytes };
}
