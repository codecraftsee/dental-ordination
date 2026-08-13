import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let getAccessToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getAccessToken = vi.fn().mockReturnValue('jwt-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getAccessToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches the bearer token to API requests', () => {
    http.get(`${API}/api/patients`).subscribe();
    const req = httpMock.expectOne(`${API}/api/patients`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush([]);
  });

  it('leaves non-API requests untouched', () => {
    http.get('https://other.com/data').subscribe();
    const req = httpMock.expectOne('https://other.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sends no token when none is stored', () => {
    getAccessToken.mockReturnValue(null);
    http.get(`${API}/api/patients`).subscribe();
    const req = httpMock.expectOne(`${API}/api/patients`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('skips the login endpoint, which has no session yet', () => {
    http.post(`${API}/api/auth/login`, {}).subscribe();
    const req = httpMock.expectOne(`${API}/api/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips the refresh endpoint, which authenticates with the refresh token', () => {
    http.post(`${API}/api/auth/refresh`, {}).subscribe();
    const req = httpMock.expectOne(`${API}/api/auth/refresh`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
