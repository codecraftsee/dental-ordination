import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { PatientService, ImportBatchError, ImportProgressEvent } from './patient.service';
import { UserService } from './user.service';
import { VisitService } from './visit.service';
import { DiagnosisService } from './diagnosis.service';
import { TreatmentService } from './treatment.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { TranslateService } from './translate.service';
import { ImportRunStore } from './import-run-store';
import { ImportRunStatus } from './import-run-status';
import { planImport } from './import-batch';
import { fileIdentity } from '../shared/file-identity';
import { Permission } from '../models/user.model';
import {
  ImportAttribution,
  ImportFileOutcome,
  ImportFileResult,
  ImportRunTallies,
  StoredRunManifest,
  StoredRunReport,
  emptyTallies,
} from '../models/import-run.model';

/** Attempts per batch, the first one included. */
export const MAX_BATCH_ATTEMPTS = 3;

/** First backoff; doubles per attempt. */
const RETRY_BASE_MS = 1000;

/**
 * How many recent file completions feed throughput and ETA.
 *
 * A whole-run average is useless here: a card with three visits and a card with
 * two hundred are both one file, so the mean is dominated by whatever the early
 * batches happened to contain and the ETA never recovers from a slow start.
 */
const THROUGHPUT_WINDOW = 50;

const ELAPSED_TICK_MS = 1000;

type FileDoneEvent = Extract<ImportProgressEvent, { type: 'file_done' }>;

/**
 * What one `file_done` says happened to its file.
 *
 * The API zeroes a file's counters and appends to `errors` when the workbook
 * throws, so "no patient created and none found" is the signal that nothing
 * landed. Errors on their own are not: a row whose doctor initial matched
 * nothing appends an error while the rest of the card commits normally, which
 * is `incomplete`, not `failed`.
 */
export function classifyFileOutcome(event: FileDoneEvent): ImportFileOutcome {
  const created = event.patientsCreated ?? 0;
  const found = event.patientsFound ?? 0;
  if (created + found === 0) return 'failed';

  if ((event.patientsIncomplete ?? 0) > 0 || (event.visitsIncomplete ?? 0) > 0 || event.errors?.length) {
    return 'incomplete';
  }
  // `skipped` has to mean nothing changed, so `patients_updated` counts here:
  // a card whose only effect was filling in a blank phone number on a patient
  // who already existed did change the database, and reporting it as "already
  // present" would hide that. This is exactly what a re-sent file looks like
  // when it really is a no-op, which is why resume is safe.
  const changed = created + (event.visitsCreated ?? 0) + (event.patientsUpdated ?? 0);
  if (changed === 0) return 'skipped';
  return 'imported';
}

/**
 * Whether a failed batch is worth sending again.
 *
 * A server that answered 4xx will answer 4xx again — the request is wrong, not
 * unlucky. Status 0 (never reached a response), 5xx, 408 and 429 are the ones a
 * second attempt can clear. 401 is already refreshed-and-retried inside the
 * transport, so seeing one here means the session is genuinely gone.
 */
export function isRetryableBatchError(error: ImportBatchError | undefined): boolean {
  if (!error) return false;
  if (error.status === 0) return true;
  if (error.status >= 500) return true;
  return error.status === 408 || error.status === 429;
}

/**
 * Owns an import run: the batch loop, the progress state, cancellation, resume,
 * and the cache refresh that follows.
 *
 * This lives in a root-provided service rather than in a component because a
 * component is destroyed on navigation. The request itself already survived that
 * — it is deliberately not torn down — but the progress state died with the
 * component, so navigating away mid-import lost the UI with no way to get it
 * back.
 *
 * `PatientService.importXlsxBatch` is the transport and knows about exactly one
 * request. Everything above that — splitting the selection, numbering progress
 * across it, retrying, skipping, stopping, continuing — is here.
 */
@Injectable({ providedIn: 'root' })
export class PatientImportService {
  private patientService = inject(PatientService);
  private userService = inject(UserService);
  private visitService = inject(VisitService);
  private diagnosisService = inject(DiagnosisService);
  private treatmentService = inject(TreatmentService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  private store = inject(ImportRunStore);
  private status = inject(ImportRunStatus);

  /** Every file the current run covers, in the order they were planned. */
  private runFiles: File[] = [];
  private runAttribution: ImportAttribution | undefined;

  /**
   * One entry per file that has reached a verdict, keyed by identity so a file
   * retried in a later batch — or in a resumed run — replaces its own earlier
   * result instead of being counted twice. `Map` keeps insertion order, so the
   * report stays in run order even when entries are overwritten.
   */
  private resultsByIdentity = new Map<string, ImportFileResult>();

  private controller: AbortController | null = null;
  private cancelRequested = false;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;

  private readonly _message = signal('');
  private readonly _error = signal(false);
  private readonly _currentFile = signal('');
  private readonly _total = signal(0);
  private readonly _processed = signal(0);
  private readonly _batchIndex = signal(0);
  private readonly _batchCount = signal(0);
  private readonly _results = signal<ImportFileResult[]>([]);
  private readonly _tallies = signal<ImportRunTallies>(emptyTallies());
  private readonly _oversized = signal<File[]>([]);
  private readonly _elapsedMs = signal(0);
  private readonly _doneAt = signal<number[]>([]);
  private readonly _interrupted = signal<StoredRunManifest | null>(this.store.readManifest());
  private readonly _lastReport = signal<StoredRunReport | null>(this.store.readReport());

  /**
   * Held by `ImportRunStatus` rather than here, so the app shell can watch a run
   * without pulling this service — and Material's dialog and progress bar — into
   * the initial bundle. This service owns every transition.
   */
  readonly state = this.status.state;
  readonly message = this._message.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentFile = this._currentFile.asReadonly();
  readonly total = this._total.asReadonly();
  readonly processed = this._processed.asReadonly();
  readonly batchIndex = this._batchIndex.asReadonly();
  readonly batchCount = this._batchCount.asReadonly();
  readonly results = this._results.asReadonly();
  readonly tallies = this._tallies.asReadonly();
  /** Files the plan set aside as too large for any single request. */
  readonly oversized = this._oversized.asReadonly();
  readonly elapsedMs = this._elapsedMs.asReadonly();
  /** A run left incomplete by a previous page load, if there is one. */
  readonly interrupted = this._interrupted.asReadonly();
  /**
   * The last finished run as it was persisted — what the report falls back to
   * after a refresh, when `results()` is empty but the failures still matter.
   */
  readonly lastReport = this._lastReport.asReadonly();
  /** True once persistence has failed, so the UI can stop promising resume. */
  readonly persistenceDegraded = this.store.degraded;

  readonly importing = this.status.running;

  readonly progress = computed(() => {
    const total = this._total();
    return total > 0 ? Math.round((this._processed() / total) * 100) : 0;
  });

  readonly filesPerMinute = computed(() => {
    const window = this._doneAt();
    if (window.length < 2) return 0;
    const span = window[window.length - 1] - window[0];
    return span > 0 ? ((window.length - 1) / span) * 60_000 : 0;
  });

  readonly etaMs = computed(() => {
    const rate = this.filesPerMinute();
    const remaining = this._total() - this._processed();
    if (rate <= 0 || remaining <= 0) return null;
    return (remaining / rate) * 60_000;
  });

  /** Files still outstanding: never reached a verdict, or reached `failed`. */
  readonly outstanding = computed(() => {
    this._results();
    return this.runFiles.filter(file => {
      const result = this.resultsByIdentity.get(fileIdentity(file));
      return !result || result.outcome === 'failed';
    });
  });

  readonly canResume = computed(() => !this.importing() && this.outstanding().length > 0);

  start(files: File[], attribution: ImportAttribution): void {
    if (this.importing()) return;
    this.resetRun();
    this.runAttribution = attribution;
    void this.execute(files, attribution);
  }

  /**
   * Send the outstanding files again, keeping everything the run already
   * established. Safe to the point of being boring: the API matches patients on
   * name plus date of birth and visits on their content, so a file that did land
   * before the run stopped comes back as `visits_skipped` rather than a
   * duplicate.
   */
  resume(): void {
    if (this.importing()) return;
    const files = this.outstanding();
    if (files.length === 0) return;
    void this.execute(files, this.runAttribution, { keepResults: true });
  }

  /**
   * Stop now rather than at the end of the batch.
   *
   * Within one request the server streams every file it carries and the client
   * cannot interject, so a graceful stop would leave the user waiting out the
   * rest of the batch — exactly the powerlessness the button exists to remove.
   * The file in flight may still commit, because the API's generator is
   * synchronous and cannot be interrupted mid-file. That is harmless: it either
   * landed, in which case resume skips it, or it did not, in which case resume
   * sends it again.
   */
  cancel(): void {
    if (!this.importing()) return;
    this.cancelRequested = true;
    this.status.set('cancelling');
    this.controller?.abort();
  }

  /** Clear a terminal run so the UI can go back to an empty state. */
  dismiss(): void {
    if (this.importing()) return;
    this.status.set('idle');
    this._message.set('');
    this._error.set(false);
  }

  /** Give up on continuing a run interrupted by a previous page load. */
  discardInterrupted(): void {
    this.store.clearManifest();
    this._interrupted.set(null);
  }

  /**
   * Of a freshly picked selection, the files a previously interrupted run had
   * not already imported. Matching is by `fileIdentity`, the same key the
   * selection dedupes on.
   */
  outstandingFrom(files: File[]): File[] {
    const done = new Set(this._interrupted()?.doneIdentities ?? []);
    return files.filter(file => !done.has(fileIdentity(file)));
  }

  private async execute(
    files: File[],
    attribution: ImportAttribution | undefined,
    options: { keepResults?: boolean } = {},
  ): Promise<void> {
    const plan = planImport(files);
    this._oversized.set(plan.oversized);

    if (!options.keepResults) {
      this.resultsByIdentity.clear();
      this._results.set([]);
      this._tallies.set(emptyTallies());
      this.runFiles = plan.accepted;
      this._total.set(plan.accepted.length);
    } else {
      // A resumed run still reports against the original selection; the files
      // it re-sends are a subset, and the ones that already landed keep their
      // verdicts. Membership is checked through a Set because `includes` over
      // 8,000 files inside a loop over 8,000 files is not a search, it is a
      // stall.
      const known = new Set(this.runFiles.map(fileIdentity));
      for (const file of plan.accepted) {
        if (known.has(fileIdentity(file))) continue;
        known.add(fileIdentity(file));
        this.runFiles.push(file);
      }
      this._total.set(this.runFiles.length);
    }

    this.cancelRequested = false;
    this.controller = new AbortController();
    this._message.set('');
    this._error.set(false);
    this._currentFile.set('');
    this._processed.set(this.resultsByIdentity.size);
    this._batchIndex.set(0);
    this._batchCount.set(plan.batches.length);
    this._doneAt.set([]);
    this.startTicker();

    // A selection with nothing sendable must not fall through the loop and
    // report a successful import of nothing: success toast, zeroed summary,
    // five caches reloaded.
    if (plan.accepted.length === 0) {
      this.finish({ code: 'noFiles' });
      return;
    }

    for (const batch of plan.batches) {
      if (this.cancelRequested) break;
      await this.runBatch(batch, attribution);
    }

    this.finish();
  }

  /**
   * One batch, with retries. A batch that cannot be delivered records its files
   * as failed and lets the run continue: across ~163 requests a transient
   * failure is close to certain, and ending an hour-long migration because one
   * of them died — when the report can say exactly which files to re-run, and
   * re-running them is idempotent — trades a complete result for nothing.
   */
  private async runBatch(batch: File[], attribution: ImportAttribution | undefined): Promise<void> {
    this.status.set('uploading');
    this._batchIndex.update(index => index + 1);

    // Cleared per batch, not per attempt: a file recorded by an earlier attempt
    // keeps that verdict, so a retry cannot overwrite "imported, 12 visits
    // created" with the "skipped" the same file reports the second time round.
    const recorded = new Set<string>();
    let lastError: ImportBatchError | undefined;

    for (let attempt = 1; attempt <= MAX_BATCH_ATTEMPTS; attempt++) {
      if (this.cancelRequested) return;
      try {
        await this.streamBatch(batch, attribution, recorded);
        lastError = undefined;
        break;
      } catch (err) {
        lastError = err as ImportBatchError;
        if (this.cancelRequested) return;
        if (!isRetryableBatchError(lastError) || attempt === MAX_BATCH_ATTEMPTS) break;
        await this.delay(RETRY_BASE_MS * 2 ** (attempt - 1));
      }
    }

    if (this.cancelRequested) return;

    // Files the batch never reported on: the request failed outright, or the
    // API's outer `except` fired and the generator stopped part-way. Either way
    // they were not imported, and resume will send them again.
    for (const file of batch) {
      const identity = fileIdentity(file);
      if (recorded.has(identity)) continue;
      this.record({
        name: file.name,
        identity,
        outcome: 'failed',
        patientsCreated: 0,
        patientsUpdated: 0,
        visitsCreated: 0,
        visitsSkipped: 0,
        errors: [this.describeBatchError(lastError)],
      });
      recorded.add(identity);
    }

    this.flush();
  }

  private streamBatch(
    batch: File[],
    attribution: ImportAttribution | undefined,
    recorded: Set<string>,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const signal = this.controller!.signal;

      // The transport swallows AbortError rather than surfacing it, so without
      // this an aborted batch would neither complete nor error and the loop
      // would wait on it forever.
      const onAbort = () => {
        subscription.unsubscribe();
        resolve();
      };
      signal.addEventListener('abort', onAbort, { once: true });
      const done = (settle: () => void) => {
        signal.removeEventListener('abort', onAbort);
        settle();
      };

      const subscription = this.patientService.importXlsxBatch(batch, attribution, signal).subscribe({
        next: event => this.consume(event, batch, recorded),
        error: err => done(() => reject(err)),
        complete: () => done(resolve),
      });

      if (signal.aborted) onAbort();
    });
  }

  private consume(event: ImportProgressEvent, batch: File[], recorded: Set<string>): void {
    if (event.type === 'progress') {
      this.status.set('processing');
      this._currentFile.set(event.file);
      return;
    }

    if (event.type !== 'file_done') return;

    // `current` is 1-based within this request, which is what makes it a
    // reliable index into the batch even when two cards share a filename.
    const file = batch[event.current - 1];
    if (!file) return;

    const identity = fileIdentity(file);
    if (recorded.has(identity)) return;
    recorded.add(identity);

    this.record({
      name: file.name,
      identity,
      outcome: classifyFileOutcome(event),
      patientsCreated: event.patientsCreated ?? 0,
      patientsUpdated: event.patientsUpdated ?? 0,
      visitsCreated: event.visitsCreated ?? 0,
      visitsSkipped: event.visitsSkipped ?? 0,
      errors: event.errors ?? [],
    });

    this._doneAt.update(window => {
      const next = [...window, Date.now()];
      return next.length > THROUGHPUT_WINDOW ? next.slice(-THROUGHPUT_WINDOW) : next;
    });
  }

  private record(result: ImportFileResult): void {
    this.resultsByIdentity.set(result.identity, result);
    this._processed.set(this.resultsByIdentity.size);
  }

  /**
   * Publish the accumulated results, once per batch rather than once per file.
   *
   * Copying the array and re-totalling on every one of 8,000 files would be
   * quadratic and would notify every subscriber that often. Per batch it is ~163
   * updates, which is well inside what a progress panel needs.
   */
  private flush(): void {
    const results = [...this.resultsByIdentity.values()];
    this._results.set(results);
    this._tallies.set(tally(results));
    this.persistManifest(results);
  }

  private finish(failure?: { code?: string; detail?: string }): void {
    this.stopTicker();
    this.flush();
    this.controller = null;

    const total = this._total();
    const processed = this._processed();
    const tallies = this._tallies();
    const landed = processed - tallies.filesFailed;

    if (this.cancelRequested) {
      this.status.set('stopped');
      this._error.set(false);
      this._message.set(
        this.translate.format('home.importStopped', { files: landed, total }),
      );
    } else if (failure || landed === 0) {
      this.status.set('failed');
      this._error.set(true);
      this._message.set(
        failure?.code === 'noFiles'
          ? this.translate.instant('home.importNoFiles')
          : this.translate.format('home.importFailed', {
              detail: failure?.detail ?? this.translate.instant('home.importUnknownError'),
            }),
      );
    } else if (tallies.filesFailed > 0) {
      // Batching made partial success the normal failure mode: files that
      // imported are committed server-side and stay there, so a bare "import
      // failed" would leave the user looking at a patient list that still shows
      // the pre-import state with no hint that hundreds of records did land.
      this.status.set('completed');
      this._error.set(true);
      this._message.set(
        this.translate.format('home.importCompletedWithFailures', {
          files: landed,
          total,
          failed: tallies.filesFailed,
        }),
      );
    } else {
      this.status.set('completed');
      this._error.set(false);
      this._message.set(
        this.translate.format('home.importSummary', {
          filesProcessed: processed,
          patientsCreated: tallies.patientsCreated,
          visitsCreated: tallies.visitsCreated,
        }),
      );
      this.toast.success('toast.importSuccess');
    }

    this.persistReport();
    if (landed > 0) this.refreshCaches();
  }

  /**
   * Only while work is outstanding. A run that imported everything has nothing
   * to resume, and leaving its manifest behind would offer the user a pointless
   * "continue where you left off" on the next page load.
   */
  private persistManifest(results: ImportFileResult[]): void {
    const doneIdentities = results
      .filter(result => result.outcome !== 'failed')
      .map(result => result.identity);

    if (doneIdentities.length >= this._total() && this._total() > 0) {
      this.store.clearManifest();
      this._interrupted.set(null);
      return;
    }

    this.store.writeManifest({
      doneIdentities,
      total: this._total(),
      attribution: this.runAttribution,
      startedAt: this.startedAt,
    });
  }

  private persistReport(): void {
    this.store.writeReport({
      finishedAt: Date.now(),
      state: this.status.state(),
      total: this._total(),
      processed: this._processed(),
      tallies: this._tallies(),
      filesPerMinute: this.filesPerMinute(),
      attention: this._results().filter(
        result => result.outcome === 'failed' || result.outcome === 'incomplete',
      ),
      // Set by the store, which owns the row cap.
      attentionTruncated: false,
    });
    this._lastReport.set(this.store.readReport());
  }

  private describeBatchError(error: ImportBatchError | undefined): string {
    return error?.detail || this.translate.instant('home.importUnknownError');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startTicker(): void {
    this.stopTicker();
    this.startedAt = Date.now();
    this._elapsedMs.set(0);
    this.elapsedTimer = setInterval(() => {
      this._elapsedMs.set(Date.now() - this.startedAt);
    }, ELAPSED_TICK_MS);
  }

  private stopTicker(): void {
    if (this.elapsedTimer !== null) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
    if (this.startedAt) this._elapsedMs.set(Date.now() - this.startedAt);
  }

  private resetRun(): void {
    this.cancelRequested = false;
    this._oversized.set([]);
    this._doneAt.set([]);
  }

  /**
   * An import creates patients and visits, so every cache that can show them has
   * to be reloaded. Each reload is isolated with catchError because forkJoin
   * unsubscribes its remaining sources on the first error, which would strand the
   * other caches holding pre-import data.
   *
   * The permission gating mirrors Home's initial load, and admin.ts keeps a third
   * variant of the same "reload these caches" list — worth consolidating when the
   * service layer is unified.
   */
  private refreshCaches(): void {
    const has = (p: Permission) => this.authService.hasPermission(p);
    const reloads: Observable<unknown>[] = [
      has(Permission.PatientsRead) ? this.patientService.loadAll() : of([]),
      has(Permission.UsersRead) ? this.userService.loadAll() : of([]),
      has(Permission.VisitsRead) ? this.visitService.loadAll() : of([]),
      has(Permission.DiagnosesRead) ? this.diagnosisService.loadAll() : of([]),
      has(Permission.TreatmentsRead) ? this.treatmentService.loadAll() : of([]),
    ];
    forkJoin(reloads.map(reload => reload.pipe(catchError(() => of(null))))).subscribe();
  }
}

function tally(results: ImportFileResult[]): ImportRunTallies {
  const totals = emptyTallies();
  for (const result of results) {
    totals.patientsCreated += result.patientsCreated;
    totals.patientsUpdated += result.patientsUpdated;
    totals.visitsCreated += result.visitsCreated;
    totals.visitsSkipped += result.visitsSkipped;
    if (result.outcome === 'imported') totals.filesImported++;
    else if (result.outcome === 'skipped') totals.filesSkipped++;
    else if (result.outcome === 'incomplete') totals.filesIncomplete++;
    else totals.filesFailed++;
  }
  return totals;
}
