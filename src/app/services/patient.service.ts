import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientCreate, PatientUpdate } from '../models/patient.model';
import { AuthService } from './auth.service';
import { EntityCacheService, matchesQuery } from './entity-cache.service';
import { planImport } from './import-batch';
import { snakeToCamelKeys } from '../interceptors/case-transform.interceptor';

export interface ImportResult {
  patientsCreated: number;
  patientsFound: number;
  visitsCreated: number;
  filesProcessed: number;
  errors: string[];
}

export type ImportProgressEvent =
  | { type: 'progress'; current: number; total: number; file: string }
  | { type: 'file_done'; current: number; total: number; file: string; patientsCreated: number; visitsCreated: number; errors: string[] }
  | { type: 'complete'; summary: ImportResult };

@Injectable({ providedIn: 'root' })
export class PatientService extends EntityCacheService<Patient, PatientCreate, PatientUpdate> {
  protected readonly path = '/api/patients';

  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  override loadAll(params?: { search?: string; city?: string }): Observable<Patient[]> {
    return super.loadAll({ search: params?.search, city: params?.city });
  }

  dismissImportWarning(id: string): Observable<Patient> {
    return this.patchOne(id, 'dismiss-warning');
  }

  search(query: string, filters: { city?: string; gender?: string }): Patient[] {
    return this.getAll()
      .filter(p => !filters.city || p.city === filters.city)
      .filter(p => !filters.gender || p.gender === filters.gender)
      .filter(p => matchesQuery(p, query, item => [item.firstName, item.lastName, item.phone, item.city]));
  }

  getCities(): string[] {
    const cities = new Set(this.getAll().map(p => p.city).filter(Boolean) as string[]);
    return [...cities].sort();
  }

  /**
   * Streams the XLSX import over SSE. This goes through `fetch` rather than
   * HttpClient because HttpClient cannot surface a response body incrementally,
   * which also means it bypasses the case interceptor — hence the local
   * conversion below.
   *
   * Large selections are uploaded as several sequential requests, split by
   * `planImport` on both bytes and file count — see `import-batch.ts` for which
   * backend limit each one answers to. One request holds every file it carries in
   * server memory for as long as it runs, and a connection dropped near the end
   * loses the progress stream for everything still queued behind it; batching
   * bounds both. Sequential, not parallel: the point is to cap what is in flight,
   * and the server processes files one at a time regardless.
   *
   * Files too large to fit in any single request are dropped here rather than
   * failing the run — the import dialog surfaces them to the user before it gets
   * this far, so reaching this with an oversized file means a non-dialog caller.
   *
   * Subscribers cannot tell: `current`/`total` are renumbered across the whole
   * selection and the per-request `complete` events are accumulated into a
   * single one emitted at the end, so the event stream has the same shape it
   * has always had.
   */
  importXlsx(files: File[], doctorId?: string): Observable<ImportProgressEvent> {
    return new Observable(observer => {
      const controller = new AbortController();
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let cancelled = false;

      const { batches, accepted } = planImport(files);

      // Summed across batches. Written generically so a counter added to the
      // API's summary keeps totalling correctly instead of reporting whatever
      // the last batch happened to see.
      const summary: Record<string, unknown> = {
        patientsCreated: 0, patientsFound: 0, visitsCreated: 0, filesProcessed: 0, errors: [],
      };
      const accumulate = (batchSummary: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(batchSummary ?? {})) {
          if (typeof value === 'number') {
            summary[key] = ((summary[key] as number) ?? 0) + value;
          } else if (Array.isArray(value)) {
            summary[key] = [...((summary[key] as unknown[]) ?? []), ...value];
          } else {
            summary[key] = value;
          }
        }
      };

      // The token is read here rather than passed in, so the retry above picks
      // up whatever refreshToken() has just written to storage.
      const sendBatch = (batch: File[]) => {
        const formData = new FormData();
        for (const file of batch) formData.append('files', file);
        if (doctorId) formData.append('doctor_id', doctorId);
        const token = this.authService.getAccessToken();

        return fetch(environment.apiUrl + '/api/import/xlsx', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          signal: controller.signal,
        });
      };

      const run = async () => {
        // Without this an empty plan falls straight through to the synthetic
        // `complete` below and reports a successful import of nothing: success
        // toast, zeroed summary, five caches reloaded. The dialog cannot reach it
        // (Start is disabled when nothing is importable), but "succeeds when
        // nothing was sent" is the wrong contract for a public method.
        if (accepted.length === 0) {
          throw { code: 'noFiles', filesProcessed: 0 };
        }

        let filesDone = 0;

        for (const batch of batches) {
          if (cancelled) return;

          let response = await sendBatch(batch);

          // Refresh once and retry, mirroring errorInterceptor. That
          // interceptor is an HttpInterceptorFn and this request goes through
          // `fetch`, so it never sees this call — and batching is what made
          // that gap reachable. A single request authenticated once and ran to
          // completion however long it took; a run split into batches has to
          // survive the access token expiring part-way through, which at
          // ACCESS_TOKEN_EXPIRE_MINUTES=30 a large import can easily outlive.
          //
          // Nothing was processed under a 401, so re-sending the batch cannot
          // double-import. If the refresh fails it returns null and has already
          // logged out, and the original 401 falls through to the throw below.
          if (response.status === 401) {
            const refreshed = await firstValueFrom(this.authService.refreshToken());
            if (refreshed) response = await sendBatch(batch);
          }

          if (!response.ok) {
            // Carries the API's `detail`, which is what the caller renders.
            // filesProcessed says how much of the selection already committed
            // — batches before this one are on the server and stay there.
            throw { ...(await response.json().catch(() => ({}))), filesProcessed: filesDone };
          }

          reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          // How far this batch actually got, which is not always how many files
          // it carried: the API's generator has an outer `except` that yields a
          // single `complete` and stops, so a batch that dies at file 3 of 200
          // streams no further events. Counting `file_done` — emitted after a
          // file is processed, unlike `progress`, which precedes it — keeps the
          // next batch from being numbered over files that never ran.
          let batchDone = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop()!;
            for (const part of parts) {
              const line = part.trim();
              if (!line.startsWith('data: ')) continue;
              const parsed = snakeToCamelKeys(JSON.parse(line.slice(6))) as ImportProgressEvent;

              // Held back: one `complete` is emitted for the whole run below.
              if (parsed.type === 'complete') {
                accumulate(parsed.summary as unknown as Record<string, unknown>);
                continue;
              }

              if (parsed.type === 'file_done') {
                batchDone = Math.max(batchDone, parsed.current);
              }

              // `current`/`total` arrive scoped to this request, so without
              // this the progress bar would restart at zero on every batch.
              const event = {
                ...parsed,
                current: filesDone + parsed.current,
                total: accepted.length,
              } as ImportProgressEvent;
              this.ngZone.run(() => observer.next(event));
            }
          }

          filesDone += batchDone;
        }

        if (cancelled) return;
        this.ngZone.run(() => {
          observer.next({ type: 'complete', summary: summary as unknown as ImportResult });
          observer.complete();
        });
      };

      run().catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        this.ngZone.run(() => observer.error(err));
      });

      return () => {
        cancelled = true;
        controller.abort();
        reader?.cancel();
      };
    });
  }
}
