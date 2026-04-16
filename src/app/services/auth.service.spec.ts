import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { Permission, User, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';

@Component({ template: '', standalone: true })
class DummyLoginComponent {}

const mockUser: User = {
  id: '1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.Admin,
  isActive: true,
  mustSetPassword: false,
  permissions: [Permission.PatientsRead, Permission.PatientsCreate, Permission.UsersRead],
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
        provideRouter([{ path: 'login', component: DummyLoginComponent }]),
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
    expect(service.hasRole(UserRole.Admin)).toBe(false);
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
    expect(service.userRole()).toBe(UserRole.Admin);
    expect(service.hasRole(UserRole.Admin)).toBe(true);
    expect(service.hasRole(UserRole.Doctor)).toBe(false);
  });

  it('refreshToken calls logout when no refresh token exists', () => {
    let result: unknown = 'not-set';
    service.refreshToken().subscribe(r => (result = r));
    expect(result).toBeNull();
  });

  it('changePassword sends PUT to change-password endpoint with request body', () => {
    const request = { currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' };
    let completed = false;
    service.changePassword(request).subscribe({ complete: () => (completed = true) });
    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/change-password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('changePassword propagates HTTP errors', () => {
    const request = { currentPassword: 'wrong', newPassword: 'newPass1', confirmPassword: 'newPass1' };
    let errorOccurred = false;
    service.changePassword(request).subscribe({ error: () => (errorOccurred = true) });
    httpMock.expectOne(`${environment.apiUrl}/api/auth/change-password`).flush(
      { detail: 'Wrong password' },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(errorOccurred).toBe(true);
  });

  it('userPermissions returns empty array when no user is loaded', () => {
    expect(service.userPermissions()).toEqual([]);
  });

  it('hasPermission returns false when no user is loaded', () => {
    expect(service.hasPermission(Permission.PatientsRead)).toBe(false);
  });

  it('hasPermission returns false when called with no arguments', () => {
    localStorage.setItem('access_token', 'valid-token');
    service.loadCurrentUser().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/me`).flush(mockUser);
    expect(service.hasPermission()).toBe(false);
  });

  it('hasPermission returns true when user has the requested permission', () => {
    localStorage.setItem('access_token', 'valid-token');
    service.loadCurrentUser().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/me`).flush(mockUser);
    expect(service.hasPermission(Permission.PatientsRead)).toBe(true);
  });

  it('hasPermission returns false when user lacks the permission', () => {
    localStorage.setItem('access_token', 'valid-token');
    service.loadCurrentUser().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/me`).flush(mockUser);
    expect(service.hasPermission(Permission.AdminBulkDelete)).toBe(false);
  });

  it('hasPermission with multiple args returns true only when all are present', () => {
    localStorage.setItem('access_token', 'valid-token');
    service.loadCurrentUser().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/me`).flush(mockUser);
    expect(service.hasPermission(Permission.PatientsRead, Permission.PatientsCreate)).toBe(true);
    expect(service.hasPermission(Permission.PatientsRead, Permission.AdminBulkDelete)).toBe(false);
  });

  it('hasAnyPermission returns true when at least one matches', () => {
    localStorage.setItem('access_token', 'valid-token');
    service.loadCurrentUser().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/api/auth/me`).flush(mockUser);
    expect(service.hasAnyPermission(Permission.AdminBulkDelete, Permission.PatientsRead)).toBe(true);
    expect(service.hasAnyPermission(Permission.AdminBulkDelete, Permission.AdminImport)).toBe(false);
  });
});
