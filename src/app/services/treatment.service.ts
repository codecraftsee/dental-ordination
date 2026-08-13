import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Treatment, TreatmentCreate, TreatmentUpdate } from '../models/treatment.model';
import { EntityCacheService, matchesQuery } from './entity-cache.service';

@Injectable({ providedIn: 'root' })
export class TreatmentService extends EntityCacheService<Treatment, TreatmentCreate, TreatmentUpdate> {
  protected readonly path = '/api/treatments';

  override loadAll(params?: { category?: string }): Observable<Treatment[]> {
    return super.loadAll({ category: params?.category });
  }

  search(query: string, filters: { category?: string }): Treatment[] {
    return this.getAll()
      .filter(t => !filters.category || t.category === filters.category)
      .filter(t => matchesQuery(t, query, item => [item.name, item.code, item.description]));
  }
}
