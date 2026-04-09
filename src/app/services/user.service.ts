import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserCreate, UserUpdate, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/users';

  private readonly items = signal<User[]>([]);
  private loaded = false;

  getAll(): User[] {
    return this.items();
  }

  getById(id: string): User | undefined {
    return this.items().find(u => u.id === id);
  }

  getByRole(...roles: UserRole[]): User[] {
    return this.items().filter(u => roles.includes(u.role));
  }

  getDisplayName(id: string): string {
    const u = this.getById(id);
    if (!u) return '';
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return u.role === UserRole.Doctor ? `Dr. ${name}` : name;
  }

  loadAll(params?: { role?: UserRole }): Observable<User[]> {
    let httpParams = new HttpParams();
    if (params?.role) httpParams = httpParams.set('role', params.role);

    return this.http.get<User[]>(this.apiUrl, { params: httpParams }).pipe(
      tap(users => {
        this.items.set(users);
        this.loaded = true;
      }),
    );
  }

  loadById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(data: UserCreate): Observable<User> {
    return this.http.post<User>(this.apiUrl, data).pipe(
      tap(user => this.items.set([user, ...this.items()])),
    );
  }

  update(id: string, data: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updated => {
        this.items.set(this.items().map(u => (u.id === id ? updated : u)));
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.items.set(this.items().filter(u => u.id !== id))),
    );
  }

  resendInvite(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/resend-invite`, {});
  }

  search(query: string, filters: { role?: UserRole }): User[] {
    let results = this.items();
    if (filters.role) {
      results = results.filter(u => u.role === filters.role);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        u =>
          (u.firstName || '').toLowerCase().includes(q) ||
          (u.lastName || '').toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return results;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
