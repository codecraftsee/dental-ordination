import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientCreate, PatientUpdate } from '../models/patient.model';

export interface ImportResult {
  patientsCreated: number;
  patientsFound: number;
  visitsCreated: number;
  filesProcessed: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/patients';

  private readonly items = signal<Patient[]>([]);
  private loaded = false;

  getAll(): Patient[] {
    return this.items();
  }

  getById(id: string): Patient | undefined {
    return this.items().find(p => p.id === id);
  }

  loadAll(params?: { search?: string; city?: string }): Observable<Patient[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.city) httpParams = httpParams.set('city', params.city);

    return this.http.get<Patient[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(patients => {
        this.items.set(patients);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  create(data: PatientCreate): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, data).pipe(
      tap(patient => this.items.set([patient, ...this.items()])),
    );
  }

  update(id: string, data: PatientUpdate): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updated => {
        this.items.set(this.items().map(p => (p.id === id ? updated : p)));
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.items.set(this.items().filter(p => p.id !== id))),
    );
  }

  search(query: string, filters: { city?: string; gender?: string }): Patient[] {
    let results = this.items();
    if (filters.city) {
      results = results.filter(p => p.city === filters.city);
    }
    if (filters.gender) {
      results = results.filter(p => p.gender === filters.gender);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        p =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          (p.phone || '').includes(q) ||
          (p.city || '').toLowerCase().includes(q),
      );
    }
    return results;
  }

  getCities(): string[] {
    const cities = new Set(this.items().map(p => p.city).filter(Boolean) as string[]);
    return [...cities].sort();
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  importXlsx(files: File[]): Observable<ImportResult> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<ImportResult>(
      environment.apiUrl + '/api/import/xlsx',
      formData,
    );
  }
}
