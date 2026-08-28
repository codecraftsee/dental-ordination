import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import {
  MAX_BATCH_ATTEMPTS,
  PatientImportService,
  classifyFileOutcome,
  isRetryableBatchError,
} from './patient-import.service';
import { ImportBatchError, ImportCounts, ImportProgressEvent, PatientService } from './patient.service';
import { UserService } from './user.service';
import { VisitService } from './visit.service';
import { DiagnosisService } from './diagnosis.service';
import { TreatmentService } from './treatment.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { TranslateService } from './translate.service';
import { ImportRunStore } from './import-run-store';
import { MAX_FILES_PER_REQUEST } from './import-batch';
import { fileIdentity } from '../shared/file-identity';
import { ImportAttribution, StoredRunManifest } from '../models/import-run.model';

const counts = (over: Partial<ImportCounts> = {}): ImportCounts => ({
  patientsCreated: 1,
  patientsFound: 0,
  patientsUpdated: 0,
  visitsCreated: 2,
  visitsSkipped: 0,
  patientsIncomplete: 0,
  visitsIncomplete: 0,
  visitsMissingPrice: 0,
  visitsUnmatchedDoctor: 0,
  ...over,
});

const fileDone = (
  file: string,
  current: number,
  total: number,
  over: Partial<ImportCounts> = {},
  errors: string[] = [],
): ImportProgressEvent => ({
  type: 'file_done',
  current,
  total,
  file,
  errors,
  ...counts(over),
});

/** One request's worth of SSE, as the transport would deliver it. */
const streamFor = (
  files: File[],
  options: { upTo?: number; over?: (index: number) => Partial<ImportCounts>; errors?: (index: number) => string[] } = {},
): Observable<ImportProgressEvent> => {
  const upTo = options.upTo ?? files.length;
  const events: ImportProgressEvent[] = [];
  files.slice(0, upTo).forEach((file, i) => {
    events.push({ type: 'progress', current: i + 1, total: files.length, file: file.name });
    events.push(fileDone(file.name, i + 1, files.length, options.over?.(i), options.errors?.(i)));
  });
  return of(...events);
};

const makeFiles = (n: number, prefix = 'card') =>
  Array.from({ length: n }, (_, i) => new File(['x'], `${prefix}${i}.xlsx`));

/** Drains microtasks and the macrotask queue so an in-flight run settles. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('PatientImportService', () => {
  let service: PatientImportService;
  let importXlsxBatch: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let hasPermission: ReturnType<typeof vi.fn>;
  let loadAll: Record<string, ReturnType<typeof vi.fn>>;

  /**
   * Rebuilds the injector so a test can swap the batch stub before the service
   * is created — it reads the stored manifest in its field initialisers, so it
   * cannot be constructed first and configured after.
   */
  const build = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PatientService, useValue: { importXlsxBatch, loadAll: loadAll['patient'] } },
        { provide: UserService, useValue: { loadAll: loadAll['user'] } },
        { provide: VisitService, useValue: { loadAll: loadAll['visit'] } },
        { provide: DiagnosisService, useValue: { loadAll: loadAll['diagnosis'] } },
        { provide: TreatmentService, useValue: { loadAll: loadAll['treatment'] } },
        { provide: AuthService, useValue: { hasPermission } },
        { provide: ToastService, useValue: { success: toastSuccess, error: vi.fn() } },
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key, format: (key: string) => key },
        },
      ],
    });
    service = TestBed.inject(PatientImportService);
  };

  beforeEach(() => {
    localStorage.clear();
    importXlsxBatch = vi.fn((files: File[]) => streamFor(files));
    toastSuccess = vi.fn();
    hasPermission = vi.fn().mockReturnValue(true);
    loadAll = {
      patient: vi.fn().mockReturnValue(of([])),
      user: vi.fn().mockReturnValue(of([])),
      visit: vi.fn().mockReturnValue(of([])),
      diagnosis: vi.fn().mockReturnValue(of([])),
      treatment: vi.fn().mockReturnValue(of([])),
    };
    build();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('starts idle', () => {
    expect(service.state()).toBe('idle');
    expect(service.importing()).toBe(false);
    expect(service.progress()).toBe(0);
    expect(service.total()).toBe(0);
    expect(service.results()).toEqual([]);
  });

  describe('classifyFileOutcome', () => {
    it('treats zero patients created and none found as a failure', () => {
      const event = fileDone('a.xlsx', 1, 1, { patientsCreated: 0, patientsFound: 0, visitsCreated: 0 }, ['boom']);
      expect(classifyFileOutcome(event as never)).toBe('failed');
    });

    it('treats an existing patient with nothing new as skipped', () => {
      const event = fileDone('a.xlsx', 1, 1, {
        patientsCreated: 0, patientsFound: 1, visitsCreated: 0, visitsSkipped: 9,
      });
      expect(classifyFileOutcome(event as never)).toBe('skipped');
    });

    /** A row-level error is not a failed file: the rest of the card committed. */
    it('treats a committed file carrying errors as incomplete', () => {
      const event = fileDone('a.xlsx', 1, 1, {}, ['row 7: No doctors in system, skipping']);
      expect(classifyFileOutcome(event as never)).toBe('incomplete');
    });

    it('treats missing prices as incomplete rather than imported', () => {
      const event = fileDone('a.xlsx', 1, 1, { visitsIncomplete: 3 });
      expect(classifyFileOutcome(event as never)).toBe('incomplete');
    });

    it('treats a clean file as imported', () => {
      expect(classifyFileOutcome(fileDone('a.xlsx', 1, 1) as never)).toBe('imported');
    });

    /**
     * A later card filling in a blank phone number on a patient who already
     * existed did change the database. Reporting that as "already present" is
     * the same class of hiding as dropping `errors[]` on the floor.
     */
    it('does not call a file that updated a patient a no-op', () => {
      const event = fileDone('a.xlsx', 1, 1, {
        patientsCreated: 0, patientsFound: 1, patientsUpdated: 1, visitsCreated: 0, visitsSkipped: 3,
      });
      expect(classifyFileOutcome(event as never)).toBe('imported');
    });
  });

  describe('isRetryableBatchError', () => {
    it('retries a request that never reached a response', () => {
      expect(isRetryableBatchError({ status: 0 })).toBe(true);
    });

    it('retries server errors and back-pressure', () => {
      expect(isRetryableBatchError({ status: 500 })).toBe(true);
      expect(isRetryableBatchError({ status: 502 })).toBe(true);
      expect(isRetryableBatchError({ status: 429 })).toBe(true);
      expect(isRetryableBatchError({ status: 408 })).toBe(true);
    });

    /** A 4xx means the request is wrong, not unlucky — sending it again wastes time. */
    it('does not retry a request the server rejected outright', () => {
      expect(isRetryableBatchError({ status: 400 })).toBe(false);
      expect(isRetryableBatchError({ status: 401 })).toBe(false);
      expect(isRetryableBatchError({ status: 413 })).toBe(false);
      expect(isRetryableBatchError(undefined)).toBe(false);
    });
  });

  describe('running a selection', () => {
    it('splits into sequential requests, each carrying the doctor override', async () => {
      service.start(makeFiles(120), { doctorId: 'doc-1' });
      await flush();

      expect(importXlsxBatch).toHaveBeenCalledTimes(3);
      const sizes = importXlsxBatch.mock.calls.map(call => (call[0] as File[]).length);
      expect(sizes).toEqual([MAX_FILES_PER_REQUEST, MAX_FILES_PER_REQUEST, 20]);
      expect(
        importXlsxBatch.mock.calls.every(
          call => (call[1] as ImportAttribution)?.doctorId === 'doc-1',
        ),
      ).toBe(true);
    });

    it('numbers progress against the whole selection, not the batch', async () => {
      service.start(makeFiles(120), {});
      await flush();

      expect(service.total()).toBe(120);
      expect(service.processed()).toBe(120);
      expect(service.progress()).toBe(100);
    });

    it('records a verdict and counts for every file', async () => {
      service.start(makeFiles(3), {});
      await flush();

      expect(service.results()).toHaveLength(3);
      expect(service.results().every(result => result.outcome === 'imported')).toBe(true);
      expect(service.tallies().filesImported).toBe(3);
      expect(service.tallies().patientsCreated).toBe(3);
      expect(service.tallies().visitsCreated).toBe(6);
    });

    it('reports duplicates skipped, which nothing could see before', async () => {
      importXlsxBatch = vi.fn((files: File[]) =>
        streamFor(files, {
          over: () => ({ patientsCreated: 0, patientsFound: 1, visitsCreated: 0, visitsSkipped: 4 }),
        }),
      );
      build();

      service.start(makeFiles(2), {});
      await flush();

      expect(service.tallies().filesSkipped).toBe(2);
      expect(service.tallies().visitsSkipped).toBe(8);
    });

    it('ignores a second start while a run is already going', async () => {
      const gate = new Subject<ImportProgressEvent>();
      importXlsxBatch = vi.fn(() => gate);
      build();

      service.start(makeFiles(2), {});
      service.start(makeFiles(2), {});

      expect(importXlsxBatch).toHaveBeenCalledTimes(1);
    });

    it('fails a selection with nothing sendable rather than reporting success', async () => {
      service.start([], {});
      await flush();

      expect(importXlsxBatch).not.toHaveBeenCalled();
      expect(service.state()).toBe('failed');
      expect(service.message()).toBe('home.importNoFiles');
      expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('names the upload phase before any event arrives', () => {
      importXlsxBatch = vi.fn(() => new Subject<ImportProgressEvent>());
      build();

      service.start(makeFiles(2), {});

      expect(service.state()).toBe('uploading');
      expect(service.batchIndex()).toBe(1);
      expect(service.batchCount()).toBe(1);
    });
  });

  describe('a batch that fails', () => {
    it('retries a transient failure, then records its files failed and continues', async () => {
      vi.useFakeTimers();
      let call = 0;
      importXlsxBatch = vi.fn((files: File[]) => {
        call++;
        // Batch 1 fails every attempt; batch 2 succeeds first time.
        if (files[0].name === 'card0.xlsx') {
          return throwError(() => ({ status: 503, detail: 'upstream down' }) as ImportBatchError);
        }
        return streamFor(files);
      });
      build();

      service.start(makeFiles(60), {});
      await vi.advanceTimersByTimeAsync(10_000);

      // Three attempts at the doomed batch, then one at the next.
      expect(call).toBe(MAX_BATCH_ATTEMPTS + 1);
      expect(service.state()).toBe('completed');
      expect(service.tallies().filesFailed).toBe(MAX_FILES_PER_REQUEST);
      expect(service.tallies().filesImported).toBe(10);
      expect(service.results()[0].errors).toEqual(['upstream down']);
    });

    it('does not retry a failure the server will repeat', async () => {
      let call = 0;
      importXlsxBatch = vi.fn(() => {
        call++;
        return throwError(() => ({ status: 400, detail: 'Too many files' }) as ImportBatchError);
      });
      build();

      service.start(makeFiles(10), {});
      await flush();

      expect(call).toBe(1);
      expect(service.state()).toBe('failed');
    });

    /**
     * The API's outer `except` yields one `complete` and stops, so a batch can
     * report on three of its files and then go quiet. The rest were never
     * processed and must not be counted as done.
     */
    it('records files a batch went quiet on as failed', async () => {
      importXlsxBatch = vi.fn((files: File[]) => streamFor(files, { upTo: 3 }));
      build();

      service.start(makeFiles(10), {});
      await flush();

      expect(service.tallies().filesImported).toBe(3);
      expect(service.tallies().filesFailed).toBe(7);
      expect(service.processed()).toBe(10);
    });

    it('still reports success for the files that did land', async () => {
      importXlsxBatch = vi.fn((files: File[]) => streamFor(files, { upTo: 3 }));
      build();

      service.start(makeFiles(10), {});
      await flush();

      expect(service.state()).toBe('completed');
      expect(service.error()).toBe(true);
      expect(service.message()).toBe('home.importCompletedWithFailures');
      expect(loadAll['patient']).toHaveBeenCalled();
    });
  });

  describe('cancelling', () => {
    const startHanging = (fileCount: number) => {
      const gate = new Subject<ImportProgressEvent>();
      importXlsxBatch = vi.fn(
      (files: File[], _attribution: ImportAttribution | undefined, signal?: AbortSignal) => {
        // Mirrors the transport: an aborted request goes quiet rather than
        // erroring, which is what the orchestrator's abort listener exists for.
        signal?.addEventListener('abort', () => gate.complete(), { once: true });
        return gate;
      });
      build();
      service.start(makeFiles(fileCount), {});
      return gate;
    };

    it('stops the run and settles as stopped', async () => {
      const gate = startHanging(120);
      gate.next({ type: 'progress', current: 1, total: 50, file: 'card0.xlsx' });
      gate.next(fileDone('card0.xlsx', 1, 50));

      service.cancel();
      await flush();

      expect(service.state()).toBe('stopped');
      expect(service.message()).toBe('home.importStopped');
      expect(service.error()).toBe(false);
    });

    it('sends no further batches', async () => {
      startHanging(120);
      service.cancel();
      await flush();

      expect(importXlsxBatch).toHaveBeenCalledTimes(1);
    });

    it('keeps what already landed and does not invent failures for the rest', async () => {
      const gate = startHanging(120);
      gate.next(fileDone('card0.xlsx', 1, 50));
      gate.next(fileDone('card1.xlsx', 2, 50));

      service.cancel();
      await flush();

      expect(service.results()).toHaveLength(2);
      expect(service.tallies().filesFailed).toBe(0);
      expect(service.tallies().filesImported).toBe(2);
      // The other 118 are simply outstanding, not failed.
      expect(service.outstanding()).toHaveLength(118);
    });

    it('does nothing when no run is in flight', () => {
      service.cancel();
      expect(service.state()).toBe('idle');
    });
  });

  describe('resuming', () => {
    it('sends only the files that have not landed', async () => {
      importXlsxBatch = vi.fn((files: File[]) => streamFor(files, { upTo: 3 }));
      build();

      const files = makeFiles(10);
      service.start(files, { doctorId: 'doc-1' });
      await flush();
      expect(service.outstanding()).toHaveLength(7);

      importXlsxBatch.mockImplementation((batch: File[]) => streamFor(batch));
      service.resume();
      await flush();

      const resent = importXlsxBatch.mock.calls[1][0] as File[];
      expect(resent).toHaveLength(7);
      expect(resent.map(f => f.name)).toEqual(files.slice(3).map(f => f.name));
      // The doctor override carries over without being asked for again.
      expect((importXlsxBatch.mock.calls[1][1] as ImportAttribution).doctorId).toBe('doc-1');
    });

    it('replaces the earlier verdict instead of counting the file twice', async () => {
      importXlsxBatch = vi.fn((files: File[]) => streamFor(files, { upTo: 3 }));
      build();

      service.start(makeFiles(10), {});
      await flush();
      expect(service.processed()).toBe(10);
      expect(service.tallies().filesFailed).toBe(7);

      importXlsxBatch.mockImplementation((batch: File[]) => streamFor(batch));
      service.resume();
      await flush();

      expect(service.processed()).toBe(10);
      expect(service.total()).toBe(10);
      expect(service.tallies().filesFailed).toBe(0);
      expect(service.tallies().filesImported).toBe(10);
      expect(service.state()).toBe('completed');
    });

    it('offers nothing to resume once everything landed', async () => {
      service.start(makeFiles(5), {});
      await flush();

      expect(service.outstanding()).toHaveLength(0);
      expect(service.canResume()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('keeps a manifest while work is outstanding', async () => {
      importXlsxBatch = vi.fn((files: File[]) => streamFor(files, { upTo: 3 }));
      build();

      const files = makeFiles(10);
      service.start(files, { doctorId: 'doc-1' });
      await flush();

      const manifest = TestBed.inject(ImportRunStore).readManifest();
      expect(manifest?.total).toBe(10);
      expect(manifest?.attribution?.doctorId).toBe('doc-1');
      expect(manifest?.doneIdentities).toEqual(files.slice(0, 3).map(fileIdentity));
    });

    it('clears the manifest once nothing is outstanding', async () => {
      service.start(makeFiles(5), {});
      await flush();

      expect(TestBed.inject(ImportRunStore).readManifest()).toBeNull();
    });

    it('persists the rows that need attention, not the successes', async () => {
      importXlsxBatch = vi.fn((files: File[]) => streamFor(files, { upTo: 3 }));
      build();

      service.start(makeFiles(10), {});
      await flush();

      const report = TestBed.inject(ImportRunStore).readReport();
      expect(report?.state).toBe('completed');
      expect(report?.total).toBe(10);
      expect(report?.tallies.filesImported).toBe(3);
      // Only the seven failures are kept row by row.
      expect(report?.attention).toHaveLength(7);
      expect(report?.attention.every(row => row.outcome === 'failed')).toBe(true);
    });

    it('surfaces a run interrupted by a previous page load', () => {
      const files = makeFiles(4);
      const manifest: StoredRunManifest = {
        doneIdentities: files.slice(0, 2).map(fileIdentity),
        total: 4,
        attribution: { doctorId: 'doc-9' },
        startedAt: 1,
      };
      localStorage.setItem('import.run.manifest', JSON.stringify(manifest));
      TestBed.resetTestingModule();
      build();

      expect(service.interrupted()?.total).toBe(4);
      // Re-picking the same folder leaves out what already imported.
      expect(service.outstandingFrom(files).map(f => f.name)).toEqual(['card2.xlsx', 'card3.xlsx']);
    });

    it('discards an interrupted run when the user declines it', () => {
      localStorage.setItem(
        'import.run.manifest',
        JSON.stringify({ doneIdentities: [], total: 4, startedAt: 1 }),
      );
      TestBed.resetTestingModule();
      build();

      service.discardInterrupted();

      expect(service.interrupted()).toBeNull();
      expect(localStorage.getItem('import.run.manifest')).toBeNull();
    });
  });

  describe('cache refresh', () => {
    it('reloads every cache an import can invalidate', async () => {
      service.start(makeFiles(2), {});
      await flush();

      expect(loadAll['patient']).toHaveBeenCalled();
      expect(loadAll['user']).toHaveBeenCalled();
      expect(loadAll['visit']).toHaveBeenCalled();
      expect(loadAll['diagnosis']).toHaveBeenCalled();
      expect(loadAll['treatment']).toHaveBeenCalled();
      expect(toastSuccess).toHaveBeenCalledWith('toast.importSuccess');
    });

    it('skips caches the user has no permission to read', async () => {
      hasPermission.mockReturnValue(false);
      service.start(makeFiles(2), {});
      await flush();

      expect(loadAll['patient']).not.toHaveBeenCalled();
      expect(loadAll['visit']).not.toHaveBeenCalled();
    });

    it('one failing reload does not strand the others', async () => {
      loadAll['patient'].mockReturnValue(throwError(() => new Error('boom')));
      service.start(makeFiles(2), {});

      await expect(flush()).resolves.toBeUndefined();
      expect(loadAll['visit']).toHaveBeenCalled();
      expect(loadAll['treatment']).toHaveBeenCalled();
    });

    it('does not reload when nothing landed', async () => {
      importXlsxBatch = vi.fn(() => throwError(() => ({ status: 400 }) as ImportBatchError));
      build();

      service.start(makeFiles(2), {});
      await flush();

      expect(loadAll['patient']).not.toHaveBeenCalled();
    });
  });

  it('terminal state does not clear itself', async () => {
    vi.useFakeTimers();
    service.start(makeFiles(2), {});
    await vi.advanceTimersByTimeAsync(1000);
    expect(service.message()).toBe('home.importSummary');

    // The old five-second auto-dismiss made sense for a three-file import and
    // threw away the summary of a forty-minute one.
    await vi.advanceTimersByTimeAsync(60_000);

    expect(service.message()).toBe('home.importSummary');
    expect(service.state()).toBe('completed');
  });

  it('run state outlives the component that started the import', async () => {
    const gate = new Subject<ImportProgressEvent>();
    importXlsxBatch = vi.fn(() => gate);
    build();

    service.start(makeFiles(4), {});
    gate.next({ type: 'progress', current: 2, total: 4, file: 'card1.xlsx' });

    TestBed.resetTestingModule();

    expect(service.importing()).toBe(true);
    expect(service.currentFile()).toBe('card1.xlsx');
  });
});
