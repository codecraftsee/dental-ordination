import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type QueryParams = Record<string, string | undefined>;

/**
 * The signal-caching CRUD core shared by every entity service.
 *
 * Patient, visit, diagnosis, treatment and user were five copies of the same
 * class — diagnosis and treatment were identical apart from the type name and the
 * URL. Subclasses now declare their `path` and keep only what is genuinely their
 * own: their query methods and endpoint-specific extras.
 *
 * `apiUrl` is a getter rather than a field because subclass field initializers run
 * after the base's, so `this.path` is not set yet at base-construction time.
 */
export abstract class EntityCacheService<T extends { id: string }, TCreate, TUpdate> {
  protected http = inject(HttpClient);

  /** API path below the base URL, e.g. `/api/patients`. */
  protected abstract readonly path: string;

  private readonly items = signal<T[]>([]);
  private loaded = false;

  protected get apiUrl(): string {
    return environment.apiUrl + this.path;
  }

  getAll(): T[] {
    return this.items();
  }

  getById(id: string): T | undefined {
    return this.items().find(item => item.id === id);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  loadAll(params?: QueryParams): Observable<T[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) httpParams = httpParams.set(key, value);
    }
    return this.http.get<T[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(fetched => {
        this.items.set(fetched);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  create(data: TCreate): Observable<T> {
    return this.http
      .post<T>(this.apiUrl, data)
      .pipe(tap(created => this.items.set([created, ...this.items()])));
  }

  update(id: string, data: TUpdate): Observable<T> {
    return this.http
      .put<T>(`${this.apiUrl}/${id}`, data)
      .pipe(tap(updated => this.replace(id, updated)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.items.set(this.items().filter(item => item.id !== id))));
  }

  /** PATCH a sub-path of one entity and replace it in the cache. */
  protected patchOne(id: string, subPath: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<T>(`${this.apiUrl}/${id}/${subPath}`, body)
      .pipe(tap(updated => this.replace(id, updated)));
  }

  private replace(id: string, updated: T): void {
    this.items.set(this.items().map(item => (item.id === id ? updated : item)));
  }
}

/**
 * The free-text half of every service's `search`: lowercase, trim, and match the
 * query against a handful of fields. Callers apply their own structured filters
 * first, since those differ per entity.
 */
export function matchesQuery<T>(
  item: T,
  query: string,
  fields: (item: T) => (string | undefined)[],
): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return fields(item).some(field => (field || '').toLowerCase().includes(q));
}
