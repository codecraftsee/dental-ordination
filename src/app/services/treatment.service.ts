import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Treatment, TreatmentCreate, TreatmentUpdate } from '../models/treatment.model';

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/treatments';

  private readonly items = signal<Treatment[]>([]);
  private loaded = false;

  getAll(): Treatment[] {
    return this.items();
  }

  getById(id: string): Treatment | undefined {
    return this.items().find(t => t.id === id);
  }

  loadAll(params?: { category?: string }): Observable<Treatment[]> {
    let httpParams = new HttpParams();
    if (params?.category) httpParams = httpParams.set('category', params.category);

    return this.http.get<Treatment[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(treatments => {
        this.items.set(treatments);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<Treatment> {
    return this.http.get<Treatment>(`${this.apiUrl}/${id}`);
  }

  create(data: TreatmentCreate): Observable<Treatment> {
    return this.http.post<Treatment>(this.apiUrl, data).pipe(
      tap(treatment => this.items.set([treatment, ...this.items()])),
    );
  }

  update(id: string, data: TreatmentUpdate): Observable<Treatment> {
    return this.http.put<Treatment>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updated => {
        this.items.set(this.items().map(t => (t.id === id ? updated : t)));
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.items.set(this.items().filter(t => t.id !== id))),
    );
  }

  search(query: string, filters: { category?: string }): Treatment[] {
    let results = this.items();
    if (filters.category) {
      results = results.filter(t => t.category === filters.category);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q),
      );
    }
    return results;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
