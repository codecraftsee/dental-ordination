import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Visit, VisitCreate, VisitUpdate } from '../models/visit.model';
import { EntityCacheService, matchesQuery, toNumber } from './entity-cache.service';

@Injectable({ providedIn: 'root' })
export class VisitService extends EntityCacheService<Visit, VisitCreate, VisitUpdate> {
  protected readonly path = '/api/visits';

  /** `price` is a Decimal on the backend, so it arrives as a string. See `toNumber`. */
  protected override normalize(visit: Visit): Visit {
    return { ...visit, price: toNumber(visit.price) };
  }

  override loadAll(params?: {
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<Visit[]> {
    return super.loadAll({ ...params });
  }

  dismissImportWarning(id: string): Observable<Visit> {
    return this.patchOne(id, 'dismiss-warning');
  }

  getByPatientId(patientId: string): Visit[] {
    return this.getAll()
      .filter(v => v.patientId === patientId)
      .sort(byDateDescending);
  }

  getByDoctorId(doctorId: string): Visit[] {
    return this.getAll()
      .filter(v => v.doctorId === doctorId)
      .sort(byDateDescending);
  }

  getRecent(count: number): Visit[] {
    return [...this.getAll()].sort(byDateDescending).slice(0, count);
  }

  getThisMonthCount(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.getAll().filter(v => {
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
    return this.getAll()
      .filter(v => !filters.patientId || v.patientId === filters.patientId)
      .filter(v => !filters.doctorId || v.doctorId === filters.doctorId)
      .filter(v => !filters.dateFrom || v.date >= filters.dateFrom)
      .filter(v => !filters.dateTo || v.date <= filters.dateTo)
      .filter(v =>
        matchesQuery(v, query, item => [
          patientNames.get(item.patientId),
          doctorNames.get(item.doctorId),
          item.diagnosisNotes,
          item.treatmentNotes,
        ]),
      )
      .sort(byDateDescending);
  }
}

function byDateDescending(a: Visit, b: Visit): number {
  return b.date.localeCompare(a.date);
}
