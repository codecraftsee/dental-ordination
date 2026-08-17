import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserCreate, UserUpdate, UserRole } from '../models/user.model';
import { EntityCacheService, matchesQuery } from './entity-cache.service';

@Injectable({ providedIn: 'root' })
export class UserService extends EntityCacheService<User, UserCreate, UserUpdate> {
  protected readonly path = '/api/users';

  override loadAll(params?: { role?: UserRole }): Observable<User[]> {
    return super.loadAll({ role: params?.role });
  }

  getByRole(...roles: UserRole[]): User[] {
    return this.getAll().filter(u => roles.includes(u.role));
  }

  getDisplayName(id: string): string {
    const u = this.getById(id);
    if (!u) return '';
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return u.role === UserRole.Doctor ? `Dr. ${name}` : name;
  }

  resendInvite(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/resend-invite`, {});
  }

  search(query: string, filters: { role?: UserRole }): User[] {
    return this.getAll()
      .filter(u => !filters.role || u.role === filters.role)
      .filter(u => matchesQuery(u, query, item => [item.firstName, item.lastName, item.email]));
  }

  isActive(id: string): boolean {
    return this.getById(id) !== undefined;
  }
}
