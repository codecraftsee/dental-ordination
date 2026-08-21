import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { ImportBatchError, ImportProgressEvent, PatientService } from './patient.service';
import { AuthService } from './auth.service';
import { Patient } from '../models/patient.model';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api/patients`;

const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'Marko',
    lastName: 'Marković',
    gender: 'male',
    city: 'Beograd',
    phone: '0601234567',
    dateOfBirth: '1990-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    firstName: 'Ana',
    lastName: 'Anić',
    gender: 'female',
    city: 'Novi Sad',
    phone: '0697654321',
    dateOfBirth: '1985-05-15',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('PatientService', () => {
  let service: PatientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll returns empty array before any load', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('isLoaded returns false before loadAll', () => {
    expect(service.isLoaded()).toBe(false);
  });

  it('loadAll fetches patients and populates cache', () => {
    service.loadAll().subscribe(patients => {
      expect(patients).toEqual(mockPatients);
    });
    httpMock.expectOne(req => req.url === API).flush(mockPatients);
    expect(service.getAll()).toEqual(mockPatients);
    expect(service.isLoaded()).toBe(true);
  });

  it('loadAll passes search and city query params', () => {
    service.loadAll({ search: 'Marko', city: 'Beograd' }).subscribe();
    const req = httpMock.expectOne(req => req.url === API);
    expect(req.request.params.get('search')).toBe('Marko');
    expect(req.request.params.get('city')).toBe('Beograd');
    req.flush([]);
  });

  it('getById returns the correct patient after load', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.getById('1')?.firstName).toBe('Marko');
    expect(service.getById('99')).toBeUndefined();
  });

  it('create prepends the new patient to the cache', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);

    const newPatient: Patient = {
      id: '3',
      firstName: 'Jovana',
      lastName: 'Jović',
      gender: 'female',
      city: 'Niš',
      dateOfBirth: '2000-01-01',
      createdAt: '',
      updatedAt: '',
    };
    service
      .create({ firstName: 'Jovana', lastName: 'Jović', gender: 'female', dateOfBirth: '2000-01-01' })
      .subscribe();
    httpMock.expectOne(req => req.method === 'POST').flush(newPatient);
    expect(service.getAll()[0].id).toBe('3');
    expect(service.getAll().length).toBe(3);
  });

  it('update replaces the patient in the cache', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);

    const updated: Patient = { ...mockPatients[0], firstName: 'Marco' };
    service.update('1', { firstName: 'Marco' }).subscribe();
    httpMock.expectOne(req => req.method === 'PUT').flush(updated);
    expect(service.getById('1')?.firstName).toBe('Marco');
  });

  it('delete removes the patient from the cache', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);

    service.delete('1').subscribe();
    httpMock.expectOne(req => req.method === 'DELETE').flush(null);
    expect(service.getAll().length).toBe(1);
    expect(service.getById('1')).toBeUndefined();
  });

  it('search filters by name query', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    const results = service.search('marko', {});
    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe('Marko');
  });

  it('search filters by city', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.search('', { city: 'Beograd' })).toHaveLength(1);
    expect(service.search('', { city: 'Novi Sad' })).toHaveLength(1);
  });

  it('search filters by gender', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.search('', { gender: 'female' })).toHaveLength(1);
    expect(service.search('', { gender: 'male' })).toHaveLength(1);
  });

  it('getCities returns unique sorted cities', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.getCities()).toEqual(['Beograd', 'Novi Sad']);
  });

  /**
   * `importXlsxBatch` is one request and nothing more. Splitting a selection,
   * numbering progress across it, retrying and cancelling all belong to
   * `PatientImportService`. What has to hold here is narrower: the stream is
   * parsed faithfully, a failure carries a status the orchestrator can act on,
   * and the request never outlives its subscription.
   */
  describe('importXlsxBatch', () => {
    const fileDone = (file: string, current: number, total: number) => ({
      type: 'file_done',
      current,
      total,
      file,
      patients_created: 1,
      patients_found: 0,
      visits_created: 2,
      visits_skipped: 0,
      patients_incomplete: 0,
      visits_incomplete: 0,
      errors: [],
    });

    /** An SSE body for one request, in the API's event order. */
    const sseBody = (files: string[]) => {
      const total = files.length;
      const events: unknown[] = files.flatMap((file, i) => [
        { type: 'progress', current: i + 1, total, file, status: 'processing' },
        fileDone(file, i + 1, total),
      ]);
      events.push({
        type: 'complete',
        summary: {
          patients_created: total, patients_found: 0, visits_created: total * 2,
          visits_skipped: 0, patients_incomplete: 0, visits_incomplete: 0,
          files_processed: total, errors: [],
        },
      });
      return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
    };

    const makeFiles = (n: number) =>
      Array.from({ length: n }, (_, i) => new File(['x'], `card${i}.xlsx`));

    const stubFetch = () => {
      const calls: { files: string[]; doctorId: string | null; auth: string | null }[] = [];
      vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
        const form = init.body as FormData;
        const files = form.getAll('files').map(f => (f as File).name);
        calls.push({
          files,
          doctorId: (form.get('doctor_id') as string) ?? null,
          auth: (init.headers as Record<string, string>)?.['Authorization'] ?? null,
        });
        return new Response(sseBody(files), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }));
      return calls;
    };

    /** Runs a batch to its end, returning what it emitted and how it settled. */
    const collect = (files: File[], doctorId?: string, signal?: AbortSignal) =>
      new Promise<{ events: ImportProgressEvent[]; error?: ImportBatchError }>(resolve => {
        const events: ImportProgressEvent[] = [];
        service.importXlsxBatch(files, doctorId, signal).subscribe({
          next: event => events.push(event),
          error: (error: ImportBatchError) => resolve({ events, error }),
          complete: () => resolve({ events }),
        });
      });

    afterEach(() => vi.unstubAllGlobals());

    it('sends every file in a single request, carrying the doctor override', async () => {
      const calls = stubFetch();
      await collect(makeFiles(50), 'doc-1');

      expect(calls).toHaveLength(1);
      expect(calls[0].files).toHaveLength(50);
      expect(calls[0].doctorId).toBe('doc-1');
    });

    it('emits the stream verbatim, batch-scoped and camelCased', async () => {
      stubFetch();
      const { events } = await collect(makeFiles(3));

      // No renumbering here — `current`/`total` stay scoped to the request, and
      // the `complete` is passed through rather than held back.
      expect(events.filter(e => e.type === 'progress')).toHaveLength(3);
      const done = events.filter(e => e.type === 'file_done');
      expect(done.map(e => e.current)).toEqual([1, 2, 3]);
      expect(done.every(e => e.total === 3)).toBe(true);
      // The case interceptor never sees a `fetch`, so the conversion is local.
      expect(done[0].patientsCreated).toBe(1);
      expect(done[0].visitsSkipped).toBe(0);
      expect(events.filter(e => e.type === 'complete')).toHaveLength(1);
    });

    it('surfaces a rejected fetch as status 0, which is what marks it retryable', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
      const { error } = await collect(makeFiles(2));

      expect(error?.status).toBe(0);
      expect(error?.detail).toBe('Failed to fetch');
    });

    it('surfaces a server error with its status and the API detail', async () => {
      vi.stubGlobal('fetch', vi.fn(async () =>
        new Response(JSON.stringify({ detail: 'Too many files' }), { status: 400 })));
      const { error } = await collect(makeFiles(2));

      expect(error?.status).toBe(400);
      expect(error?.detail).toBe('Too many files');
    });

    /**
     * A run split across ~163 requests has to survive the access token expiring
     * part-way through, and it cannot lean on errorInterceptor — that only wraps
     * HttpClient, and this path is `fetch`.
     */
    it('refreshes once and retries the request on a 401', async () => {
      const auth = TestBed.inject(AuthService);
      let token = 'old-token';
      vi.spyOn(auth, 'getAccessToken').mockImplementation(() => token);
      const refresh = vi.spyOn(auth, 'refreshToken').mockImplementation(() => {
        token = 'new-token';
        return of({ accessToken: 'new-token', refreshToken: 'r' } as never);
      });

      let call = 0;
      const sent: (string | null)[] = [];
      vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
        call++;
        sent.push((init.headers as Record<string, string>)?.['Authorization'] ?? null);
        if (call === 1) {
          return new Response(JSON.stringify({ detail: 'Could not validate credentials' }), { status: 401 });
        }
        const files = (init.body as FormData).getAll('files').map(f => (f as File).name);
        return new Response(sseBody(files), { status: 200 });
      }));

      const { events, error } = await collect(makeFiles(2));

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(sent).toEqual(['Bearer old-token', 'Bearer new-token']);
      expect(error).toBeUndefined();
      expect(events.filter(e => e.type === 'file_done')).toHaveLength(2);
    });

    it('gives up on the 401 when the refresh fails, without sending again', async () => {
      const auth = TestBed.inject(AuthService);
      vi.spyOn(auth, 'getAccessToken').mockReturnValue('expired');
      // refreshToken() resolves to null once it has given up and logged out.
      const refresh = vi.spyOn(auth, 'refreshToken').mockReturnValue(of(null));

      const sent: string[] = [];
      vi.stubGlobal('fetch', vi.fn(async () => {
        sent.push('sent');
        return new Response(JSON.stringify({ detail: 'Could not validate credentials' }), { status: 401 });
      }));

      const { error } = await collect(makeFiles(2));

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(sent).toHaveLength(1);
      expect(error?.status).toBe(401);
      expect(error?.detail).toBe('Could not validate credentials');
    });

    /** Aborting is a normal way for a run to end, not a failure to report. */
    it('an aborted request is swallowed rather than surfaced as an error', async () => {
      vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')));
        })));

      const controller = new AbortController();
      const seen = { error: false, complete: false };
      service.importXlsxBatch(makeFiles(2), undefined, controller.signal).subscribe({
        error: () => (seen.error = true),
        complete: () => (seen.complete = true),
      });

      controller.abort();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(seen.error).toBe(false);
      expect(seen.complete).toBe(false);
    });

    it('unsubscribing aborts the in-flight request', async () => {
      let signal: AbortSignal | undefined;
      vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return new Promise(() => undefined);
      }));

      const subscription = service.importXlsxBatch(makeFiles(2)).subscribe();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(signal?.aborted).toBe(false);

      subscription.unsubscribe();
      expect(signal?.aborted).toBe(true);
    });
  });
});
