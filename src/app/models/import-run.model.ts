import { ImportCounts } from '../services/patient.service';

/**
 * Where a run is. `uploading` is a state of its own rather than a flavour of
 * `processing` because it is the one phase with no progress to report: `fetch`
 * cannot observe upload bytes and the API streams nothing until it holds the
 * whole body, so the bar genuinely cannot move. Naming the phase is what stops
 * that window reading as a hang.
 *
 * `stopped`, `completed` and `failed` are terminal and do not clear themselves —
 * a summary that auto-dismissed after five seconds was fine for a three-file
 * import and useless after a forty-minute one.
 */
export type ImportRunState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'cancelling'
  | 'stopped'
  | 'completed'
  | 'failed';

/**
 * What happened to one file.
 *
 * `skipped` and `incomplete` both mean the file landed, which is why resume
 * leaves them alone: re-sending a skipped file changes nothing, and re-sending
 * an incomplete one cannot fill in data the card never had. Only `failed` is
 * outstanding work.
 */
export type ImportFileOutcome = 'imported' | 'skipped' | 'incomplete' | 'failed';

export interface ImportFileResult {
  name: string;
  /** `fileIdentity()` of the source file — how resume recognises it again. */
  identity: string;
  outcome: ImportFileOutcome;
  patientsCreated: number;
  patientsUpdated: number;
  visitsCreated: number;
  visitsSkipped: number;
  errors: string[];
}

/** Running totals across a run, kept incrementally rather than recomputed. */
export interface ImportRunTallies extends ImportCounts {
  filesImported: number;
  filesSkipped: number;
  filesIncomplete: number;
  filesFailed: number;
}

export function emptyTallies(): ImportRunTallies {
  return {
    patientsCreated: 0,
    patientsFound: 0,
    patientsUpdated: 0,
    visitsCreated: 0,
    visitsSkipped: 0,
    patientsIncomplete: 0,
    visitsIncomplete: 0,
    filesImported: 0,
    filesSkipped: 0,
    filesIncomplete: 0,
    filesFailed: 0,
  };
}

/**
 * Enough to continue a run whose tab was closed. The files themselves cannot be
 * persisted at any sane cost, so this records only which ones are already done;
 * the user re-picks the folder and everything matching is left out of the new
 * run.
 */
export interface StoredRunManifest {
  doneIdentities: string[];
  total: number;
  doctorId?: string;
  startedAt: number;
}

/**
 * The last run's report, kept so a refresh does not lose the list of what went
 * wrong. Successful files are counts only — they are precisely the ones nobody
 * needs to look at individually, and keeping all 8,000 rows would put the
 * payload near the localStorage quota for no benefit.
 */
export interface StoredRunReport {
  finishedAt: number;
  state: ImportRunState;
  total: number;
  processed: number;
  tallies: ImportRunTallies;
  /**
   * Throughput the run actually achieved. Kept so the next selection can be
   * estimated from what this machine and this API really do, rather than from a
   * guess baked into the frontend.
   */
  filesPerMinute: number;
  /** Every `failed` and `incomplete` row, in run order. */
  attention: ImportFileResult[];
  /** Set when `attention` hit the row cap, so the UI can say so. */
  attentionTruncated: boolean;
}
