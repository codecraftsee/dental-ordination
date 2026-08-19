import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { ImportProgressEvent, PatientService } from './patient.service';
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
   * importXlsx splits large selections across several requests but must not
   * expose that to subscribers: progress stays numbered against the whole
   * selection and exactly one `complete` arrives, carrying summed totals.
   */
  describe('importXlsx batching', () => {
    const BATCH = 200;

    /** An SSE body for one request, in the API's event order. */
    const sseBody = (files: string[], startsAt: number) => {
      const total = files.length;
      const events = files.flatMap((file, i) => [
        { type: 'progress', current: i + 1, total, file, status: 'processing' },
        { type: 'file_done', current: i + 1, total, file, patients_created: 1, visits_created: 2, errors: [] },
      ]);
      events.push({
        type: 'complete',
        summary: {
          patients_created: total, patients_found: 0, visits_created: total * 2,
          files_processed: total, errors: [`batch at ${startsAt}`],
        },
      } as never);
      return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
    };

    const stubFetch = () => {
      const calls: { files: string[]; doctorId: string | null }[] = [];
      const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
        const form = init.body as FormData;
        const files = form.getAll('files').map(f => (f as File).name);
        calls.push({ files, doctorId: (form.get('doctor_id') as string) ?? null });
        return new Response(sseBody(files, calls.length), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      });
      vi.stubGlobal('fetch', fetchMock);
      return calls;
    };

    const makeFiles = (n: number) =>
      Array.from({ length: n }, (_, i) => new File(['x'], `card${i}.xlsx`));

    afterEach(() => vi.unstubAllGlobals());

    it('sends a single request when the selection fits in one batch', async () => {
      const calls = stubFetch();
      await new Promise<void>(done => service.importXlsx(makeFiles(BATCH)).subscribe({ complete: done }));
      expect(calls).toHaveLength(1);
      expect(calls[0].files).toHaveLength(BATCH);
    });

    it('splits a larger selection into sequential batches', async () => {
      const calls = stubFetch();
      await new Promise<void>(done =>
        service.importXlsx(makeFiles(450), 'doc-1').subscribe({ complete: done }),
      );
      expect(calls.map(c => c.files.length)).toEqual([200, 200, 50]);
      // Every batch has to carry the doctor override, not just the first.
      expect(calls.every(c => c.doctorId === 'doc-1')).toBe(true);
      // No file sent twice, none dropped.
      const sent = calls.flatMap(c => c.files);
      expect(new Set(sent).size).toBe(450);
    });

    it('numbers progress against the whole selection, not the batch', async () => {
      stubFetch();
      const events: ImportProgressEvent[] = [];
      await new Promise<void>(done =>
        service.importXlsx(makeFiles(450)).subscribe({ next: e => events.push(e), complete: done }),
      );
      const fileDone = events.filter(e => e.type === 'file_done');
      expect(fileDone).toHaveLength(450);
      // Without renumbering these would restart at 1 on each new batch.
      expect(fileDone.map(e => e.current)).toEqual(Array.from({ length: 450 }, (_, i) => i + 1));
      expect(fileDone.every(e => e.total === 450)).toBe(true);
    });

    it('emits one complete carrying the summed totals', async () => {
      stubFetch();
      const events: ImportProgressEvent[] = [];
      await new Promise<void>(done =>
        service.importXlsx(makeFiles(450)).subscribe({ next: e => events.push(e), complete: done }),
      );
      const completes = events.filter(e => e.type === 'complete');
      expect(completes).toHaveLength(1);
      const summary = completes[0].summary;
      expect(summary.filesProcessed).toBe(450);
      expect(summary.patientsCreated).toBe(450);
      expect(summary.visitsCreated).toBe(900);
      // Errors concatenate across batches rather than the last one winning.
      expect(summary.errors).toEqual(['batch at 1', 'batch at 2', 'batch at 3']);
    });

    it('reports how many files committed when a later batch fails', async () => {
      let call = 0;
      vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
        call++;
        const files = (init.body as FormData).getAll('files').map(f => (f as File).name);
        if (call === 3) {
          return new Response(JSON.stringify({ detail: 'Too many files' }), { status: 400 });
        }
        return new Response(sseBody(files, call), { status: 200 });
      }));

      const err = await new Promise<{ detail: string; filesProcessed: number }>(resolve =>
        service.importXlsx(makeFiles(450)).subscribe({ error: resolve }),
      );
      expect(err.detail).toBe('Too many files');
      // The two batches before it are committed server-side and stay there.
      expect(err.filesProcessed).toBe(400);
    });

    it('numbers the next batch from what completed, not from the batch size', async () => {
      let call = 0;
      vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
        call++;
        const files = (init.body as FormData).getAll('files').map(f => (f as File).name);
        if (call > 1) return new Response(sseBody(files, call), { status: 200 });

        // The API's outer `except`: three files stream, then a fatal `complete`
        // and the generator stops. The other 197 are never processed.
        const events: unknown[] = files.slice(0, 3).flatMap((file, i) => [
          { type: 'progress', current: i + 1, total: files.length, file },
          { type: 'file_done', current: i + 1, total: files.length, file, patients_created: 1, visits_created: 2, errors: [] },
        ]);
        events.push({ type: 'complete', summary: { files_processed: 3, errors: ['Fatal error: boom'] } });
        return new Response(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(''), { status: 200 });
      }));

      const seen: ImportProgressEvent[] = [];
      await new Promise<void>(done =>
        service.importXlsx(makeFiles(450)).subscribe({ next: e => seen.push(e), complete: done }),
      );

      const fileDone = seen.filter(e => e.type === 'file_done');
      // Batch 1 finished 3 of its 200, so batch 2 starts at 4 — not at 201,
      // which would march the bar over 197 files that never ran.
      expect(fileDone.map(e => e.current).slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(fileDone).toHaveLength(3 + 200 + 50);
      expect(fileDone[fileDone.length - 1].current).toBe(253);
    });

    /**
     * A single request authenticated once and ran to completion. Split into
     * batches, the run has to outlive an access token that expires part-way —
     * and it cannot lean on errorInterceptor, which only wraps HttpClient.
     */
    describe('access token expiring mid-run', () => {
      /** 401s the nth request, serves every other one. */
      const stubFetchFailingAuthOn = (nth: number) => {
        const sent: (string | null)[] = [];
        let call = 0;
        vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
          call++;
          sent.push((init.headers as Record<string, string>)?.['Authorization'] ?? null);
          if (call === nth) {
            return new Response(JSON.stringify({ detail: 'Could not validate credentials' }), { status: 401 });
          }
          const files = (init.body as FormData).getAll('files').map(f => (f as File).name);
          return new Response(sseBody(files, call), { status: 200 });
        }));
        return sent;
      };

      it('refreshes once and retries the batch, then finishes the run', async () => {
        const auth = TestBed.inject(AuthService);
        let token = 'old-token';
        vi.spyOn(auth, 'getAccessToken').mockImplementation(() => token);
        const refresh = vi.spyOn(auth, 'refreshToken').mockImplementation(() => {
          token = 'new-token';
          return of({ accessToken: 'new-token', refreshToken: 'r' } as never);
        });

        const sent = stubFetchFailingAuthOn(2);
        const events: ImportProgressEvent[] = [];
        await new Promise<void>(done =>
          service.importXlsx(makeFiles(450)).subscribe({ next: e => events.push(e), complete: done }),
        );

        expect(refresh).toHaveBeenCalledTimes(1);
        // Batch 2 sent twice: once on the stale token, once on the fresh one.
        expect(sent).toEqual([
          'Bearer old-token', 'Bearer old-token', 'Bearer new-token', 'Bearer new-token',
        ]);
        // The run still delivers every file exactly once, despite the retry.
        expect(events.filter(e => e.type === 'file_done')).toHaveLength(450);
        expect(events.filter(e => e.type === 'complete')).toHaveLength(1);
      });

      it('surfaces the 401 without retrying again when the refresh fails', async () => {
        const auth = TestBed.inject(AuthService);
        vi.spyOn(auth, 'getAccessToken').mockReturnValue('expired');
        // refreshToken() resolves to null once it has given up and logged out.
        const refresh = vi.spyOn(auth, 'refreshToken').mockReturnValue(of(null));

        const sent = stubFetchFailingAuthOn(2);
        const err = await new Promise<{ detail: string; filesProcessed: number }>(resolve =>
          service.importXlsx(makeFiles(450)).subscribe({ error: resolve }),
        );

        expect(refresh).toHaveBeenCalledTimes(1);
        // Two requests only: the failed batch is not re-sent on a dead session.
        expect(sent).toHaveLength(2);
        expect(err.detail).toBe('Could not validate credentials');
        expect(err.filesProcessed).toBe(200);
      });
    });
  });
});
