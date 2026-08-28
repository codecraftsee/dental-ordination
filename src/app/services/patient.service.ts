import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientCreate, PatientUpdate } from '../models/patient.model';
import { AuthService } from './auth.service';
import { ImportAttribution } from '../models/import-run.model';
import { EntityCacheService, matchesQuery } from './entity-cache.service';
import { snakeToCamelKeys } from '../interceptors/case-transform.interceptor';

/**
 * The counters the API keeps. Every one of these is in `_empty_counts()` on the
 * server and is sent on both `file_done` and `complete`; the frontend used to
 * declare only three of them and silently drop the rest, which is why nothing
 * could report duplicates skipped or records imported with gaps.
 */
export interface ImportCounts {
  patientsCreated: number;
  patientsFound: number;
  /** Blank fields on an existing patient filled in by a later card. */
  patientsUpdated: number;
  visitsCreated: number;
  visitsSkipped: number;
  patientsIncomplete: number;
  visitsIncomplete: number;
  /**
   * Why a visit is incomplete. `visitsIncomplete` on its own cannot be acted on,
   * and a missing price is the one cause that appends no error string — so a
   * file flagged only for that showed up as "Incomplete" with a blank message.
   */
  visitsMissingPrice: number;
  /**
   * Rows whose "Dr" cell named somebody the roster could not resolve. These are
   * *not* flagged and raise no error: the fallback doctor is the caller's answer
   * for exactly them. Reported because nothing else records that the card
   * disagreed — the visit also keeps the card's text verbatim.
   */
  visitsUnmatchedDoctor: number;
}

export interface ImportResult extends ImportCounts {
  filesProcessed: number;
  errors: string[];
}

/**
 * Events from **one** import request. `current` and `total` are scoped to that
 * request; numbering them across a whole selection is the orchestrator's job
 * (`PatientImportService`), not this layer's.
 */
export type ImportProgressEvent =
  | { type: 'progress'; current: number; total: number; file: string }
  | ({ type: 'file_done'; current: number; total: number; file: string; errors: string[] } & ImportCounts)
  | { type: 'complete'; summary: ImportResult };

/**
 * A batch request that never produced a stream. `status` is 0 when the request
 * failed before a response existed at all — DNS, offline, connection reset —
 * which is the case worth retrying.
 */
export interface ImportBatchError {
  status: number;
  detail?: string;
  code?: string;
}

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
   * Streams **one** import request over SSE and emits its events verbatim.
   *
   * This goes through `fetch` rather than HttpClient because HttpClient cannot
   * surface a response body incrementally, which also means it bypasses the case
   * interceptor — hence the local `snakeToCamelKeys` conversion below.
   *
   * Deliberately one request and nothing more. Splitting a selection, numbering
   * progress across it, accumulating summaries, retrying, cancelling and resuming
   * all belong to `PatientImportService`. While they lived here there was no seam
   * to abort a single batch or to let a run continue past a failed one, and none
   * of it could be tested without faking a multi-request `fetch`.
   *
   * `signal` lets the caller abort mid-stream; unsubscribing aborts as well, so
   * the request cannot outlive its subscription either way.
   */
  importXlsxBatch(
    files: File[],
    attribution?: ImportAttribution,
    signal?: AbortSignal,
  ): Observable<ImportProgressEvent> {
    return new Observable(observer => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (signal?.aborted) controller.abort();
      else signal?.addEventListener('abort', abort, { once: true });

      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

      // The token is read per attempt rather than passed in, so the retry below
      // picks up whatever refreshToken() has just written to storage.
      const send = () => {
        const formData = new FormData();
        for (const file of files) formData.append('files', file);
        // Alternatives, and the API treats them as such: doctor_id skips card
        // matching entirely, fallback_doctor_id only names who receives the rows
        // matching could not identify.
        if (attribution?.doctorId) formData.append('doctor_id', attribution.doctorId);
        if (attribution?.fallbackDoctorId) {
          formData.append('fallback_doctor_id', attribution.fallbackDoctorId);
        }
        const token = this.authService.getAccessToken();

        return fetch(environment.apiUrl + '/api/import/xlsx', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          signal: controller.signal,
        });
      };

      const run = async () => {
        let response: Response;
        try {
          response = await send();
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') throw err;
          // A `fetch` that rejects never reached a response: offline, DNS
          // failure, connection reset. Status 0 is what tells the orchestrator
          // this is worth retrying, as distinct from a server that answered.
          const error: ImportBatchError = { status: 0, detail: (err as Error)?.message };
          throw error;
        }

        // Refresh once and retry, mirroring errorInterceptor. That interceptor
        // is an HttpInterceptorFn and this request goes through `fetch`, so it
        // never sees this call — and batching is what made that gap reachable.
        // A single request authenticated once and ran to completion however long
        // it took; a run split into batches has to survive the access token
        // expiring part-way through, which at ACCESS_TOKEN_EXPIRE_MINUTES=30 a
        // large import can easily outlive.
        //
        // Nothing was processed under a 401, so re-sending cannot double-import.
        // If the refresh fails it returns null and has already logged out, and
        // the original 401 falls through to the throw below.
        if (response.status === 401) {
          const refreshed = await firstValueFrom(this.authService.refreshToken());
          if (refreshed) response = await send();
        }

        if (!response.ok) {
          // Carries the API's `detail`, which is what the caller renders.
          const body = await response.json().catch(() => ({}));
          const error: ImportBatchError = { ...body, status: response.status };
          throw error;
        }

        reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop()!;
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;
            const event = snakeToCamelKeys(JSON.parse(line.slice(6))) as ImportProgressEvent;
            // `reader.read()` is not patched by zone.js, so control has already
            // left the Angular zone by this point and signal writes downstream
            // would not schedule change detection.
            this.ngZone.run(() => observer.next(event));
          }
        }

        this.ngZone.run(() => observer.complete());
      };

      run().catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        this.ngZone.run(() => observer.error(err));
      });

      return () => {
        signal?.removeEventListener('abort', abort);
        controller.abort();
        reader?.cancel().catch(() => undefined);
      };
    });
  }
}
