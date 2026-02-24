import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Visit, VisitCreate, VisitUpdate } from '../models/visit.model';

@Injectable({ providedIn: 'root' })
export class VisitService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/visits';

  private readonly items = signal<Visit[]>([]);
  private loaded = false;

  getAll(): Visit[] {
    return this.items();
  }

  getById(id: string): Visit | undefined {
    return this.items().find(v => v.id === id);
  }

  loadAll(params?: {
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<Visit[]> {
    let httpParams = new HttpParams();
    if (params?.patientId) httpParams = httpParams.set('patient_id', params.patientId);
    if (params?.doctorId) httpParams = httpParams.set('doctor_id', params.doctorId);
    if (params?.dateFrom) httpParams = httpParams.set('date_from', params.dateFrom);
    if (params?.dateTo) httpParams = httpParams.set('date_to', params.dateTo);

    return this.http.get<Visit[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(visits => {
        this.items.set(visits);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<Visit> {
    return this.http.get<Visit>(`${this.apiUrl}/${id}`);
  }

  create(data: VisitCreate): Observable<Visit> {
    return this.http.post<Visit>(this.apiUrl, data).pipe(
      tap(visit => this.items.set([visit, ...this.items()])),
    );
  }

  update(id: string, data: VisitUpdate): Observable<Visit> {
    return this.http.put<Visit>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updated => {
        this.items.set(this.items().map(v => (v.id === id ? updated : v)));
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.items.set(this.items().filter(v => v.id !== id))),
    );
  }

  getByPatientId(patientId: string): Visit[] {
    return this.items()
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getByDoctorId(doctorId: string): Visit[] {
    return this.items()
      .filter(v => v.doctorId === doctorId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getRecent(count: number): Visit[] {
    return [...this.items()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count);
  }

  getThisMonthCount(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.items().filter(v => {
      const d = new Date(v.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }

  search(
    query: string,
    filters: { patientId?: string; doctorId?: string; dateFrom?: string; dateTo?: string },
    patientNames: Map<string, string>,
    doctorNames: Map<string, string>,
  ): Visit[] {
    let results = this.items();
    if (filters.patientId) {
      results = results.filter(v => v.patientId === filters.patientId);
    }
    if (filters.doctorId) {
      results = results.filter(v => v.doctorId === filters.doctorId);
    }
    if (filters.dateFrom) {
      results = results.filter(v => v.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      results = results.filter(v => v.date <= filters.dateTo!);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(v => {
        const patientName = patientNames.get(v.patientId) || '';
        const doctorName = doctorNames.get(v.doctorId) || '';
        return (
          patientName.toLowerCase().includes(q) ||
          doctorName.toLowerCase().includes(q) ||
          (v.diagnosisNotes || '').toLowerCase().includes(q) ||
          (v.treatmentNotes || '').toLowerCase().includes(q)
        );
      });
    }
    return results.sort((a, b) => b.date.localeCompare(a.date));
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
