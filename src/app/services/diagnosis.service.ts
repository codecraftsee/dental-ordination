import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Diagnosis, DiagnosisCreate, DiagnosisUpdate } from '../models/diagnosis.model';
import { EntityCacheService, matchesQuery } from './entity-cache.service';

@Injectable({ providedIn: 'root' })
export class DiagnosisService extends EntityCacheService<Diagnosis, DiagnosisCreate, DiagnosisUpdate> {
  protected readonly path = '/api/diagnoses';

  override loadAll(params?: { category?: string }): Observable<Diagnosis[]> {
    return super.loadAll({ category: params?.category });
  }

  search(query: string, filters: { category?: string }): Diagnosis[] {
    return this.getAll()
      .filter(d => !filters.category || d.category === filters.category)
      .filter(d => matchesQuery(d, query, item => [item.name, item.code, item.description]));
  }
}
