import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, TokenResponse } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl + '/api/auth';

  private readonly currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    // Backend uses OAuth2PasswordRequestForm which expects form data with 'username' field
    const body = new URLSearchParams();
    body.set('username', credentials.email);
    body.set('password', credentials.password);

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/login`, body.toString(), {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      })
      .pipe(
        tap(response => {
          localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }),
      );
  }

  refreshToken(): Observable<TokenResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return of(null);
    }
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        }),
      );
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.getAccessToken()) {
      return of(null);
    }
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }
}
