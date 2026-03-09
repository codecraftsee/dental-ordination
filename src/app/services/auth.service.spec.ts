import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

const mockUser: User = {
  id: '1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('isAuthenticated is false initially', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('userRole is null when not authenticated', () => {
    expect(service.userRole()).toBeNull();
  });

  it('hasRole returns false when no user is set', () => {
    expect(service.hasRole('admin')).toBe(false);
  });

  it('getAccessToken returns null when localStorage is empty', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('login stores tokens on success', () => {
    service.login({ email: 'test@test.com', password: 'pass' }).subscribe(res => {
      expect(res.accessToken).toBe('access-token');
    });
    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(localStorage.getItem('access_token')).toBe('access-token');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
  });

  it('logout clears tokens and sets user to null', () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'rtok');
    service.logout();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('loadCurrentUser returns null without making HTTP call when no token', () => {
    let result: unknown = 'not-set';
    service.loadCurrentUser().subscribe(u => (result = u));
    expect(result).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('loadCurrentUser sets the current user on success', () => {
    localStorage.setItem('access_token', 'valid-token');
    service.loadCurrentUser().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/me`).flush(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe('admin');
    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('doctor')).toBe(false);
  });

  it('refreshToken calls logout when no refresh token exists', () => {
    let result: unknown = 'not-set';
    service.refreshToken().subscribe(r => (result = r));
    expect(result).toBeNull();
  });
});
