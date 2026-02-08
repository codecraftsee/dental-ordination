import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Diagnosis, DiagnosisCreate, DiagnosisUpdate } from '../models/diagnosis.model';

@Injectable({ providedIn: 'root' })
export class DiagnosisService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/diagnoses';

  private readonly items = signal<Diagnosis[]>([]);
  private loaded = false;

  getAll(): Diagnosis[] {
    return this.items();
  }

  getById(id: string): Diagnosis | undefined {
    return this.items().find(d => d.id === id);
  }

  loadAll(params?: { category?: string }): Observable<Diagnosis[]> {
    let httpParams = new HttpParams();
    if (params?.category) httpParams = httpParams.set('category', params.category);

    return this.http.get<Diagnosis[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(diagnoses => {
        this.items.set(diagnoses);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<Diagnosis> {
    return this.http.get<Diagnosis>(`${this.apiUrl}/${id}`);
  }

  create(data: DiagnosisCreate): Observable<Diagnosis> {
    return this.http.post<Diagnosis>(this.apiUrl, data).pipe(
      tap(diagnosis => this.items.set([diagnosis, ...this.items()])),
    );
  }

  update(id: string, data: DiagnosisUpdate): Observable<Diagnosis> {
    return this.http.put<Diagnosis>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updated => {
        this.items.set(this.items().map(d => (d.id === id ? updated : d)));
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.items.set(this.items().filter(d => d.id !== id))),
    );
  }

  search(query: string, filters: { category?: string }): Diagnosis[] {
    let results = this.items();
    if (filters.category) {
      results = results.filter(d => d.category === filters.category);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.description || '').toLowerCase().includes(q),
      );
    }
    return results;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
