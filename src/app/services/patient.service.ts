import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientCreate, PatientUpdate } from '../models/patient.model';
import { AuthService } from './auth.service';
import { EntityCacheService, matchesQuery } from './entity-cache.service';
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
   */
  importXlsx(files: File[], doctorId?: string): Observable<ImportProgressEvent> {
    return new Observable(observer => {
      const controller = new AbortController();
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

      const formData = new FormData();
      for (const file of files) formData.append('files', file);
      if (doctorId) formData.append('doctor_id', doctorId);
      const token = this.authService.getAccessToken();

      fetch(environment.apiUrl + '/api/import/xlsx', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: controller.signal,
      }).then(async response => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          this.ngZone.run(() => observer.error(err));
          return;
        }
        reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) { this.ngZone.run(() => observer.complete()); break; }
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop()!;
          for (const part of parts) {
            const line = part.trim();
            if (line.startsWith('data: ')) {
              const parsed = snakeToCamelKeys(JSON.parse(line.slice(6))) as ImportProgressEvent;
              this.ngZone.run(() => observer.next(parsed));
            }
          }
        }
      }).catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        this.ngZone.run(() => observer.error(err));
      });

      return () => {
        controller.abort();
        reader?.cancel();
      };
    });
  }
}
