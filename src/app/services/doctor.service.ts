import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Doctor, DoctorCreate, DoctorUpdate } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/doctors';

  private readonly items = signal<Doctor[]>([]);
  private loaded = false;

  getAll(): Doctor[] {
    return this.items();
  }

  getById(id: string): Doctor | undefined {
    return this.items().find(d => d.id === id);
  }

  loadAll(params?: { specialization?: string }): Observable<Doctor[]> {
    let httpParams = new HttpParams();
    if (params?.specialization) httpParams = httpParams.set('specialization', params.specialization);

    return this.http.get<Doctor[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(doctors => {
        this.items.set(doctors);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
  }

  create(data: DoctorCreate): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, data).pipe(
      tap(doctor => this.items.set([doctor, ...this.items()])),
    );
  }

  update(id: string, data: DoctorUpdate): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}`, data).pipe(
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

  search(query: string, filters: { specialization?: string }): Doctor[] {
    let results = this.items();
    if (filters.specialization) {
      results = results.filter(d => d.specialization === filters.specialization);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        d =>
          d.firstName.toLowerCase().includes(q) ||
          d.lastName.toLowerCase().includes(q) ||
          (d.licenseNumber || '').toLowerCase().includes(q),
      );
    }
    return results;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
