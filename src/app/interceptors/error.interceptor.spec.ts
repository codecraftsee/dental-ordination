import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let refreshToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refreshToken = vi.fn().mockReturnValue(of({ accessToken: 'fresh-token', refreshToken: 'r' }));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { refreshToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('refreshes the token on a 401 and retries with the new one', () => {
    let result: unknown;
    http.get(`${API}/api/patients`).subscribe(r => (result = r));

    httpMock.expectOne(`${API}/api/patients`).flush({ detail: 'expired' }, UNAUTHORIZED);

    const retry = httpMock.expectOne(`${API}/api/patients`);
    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retry.flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('surfaces the original error when the refresh fails', () => {
    refreshToken.mockReturnValue(of(null));
    let error: HttpErrorResponse | undefined;
    http.get(`${API}/api/patients`).subscribe({ error: e => (error = e) });

    httpMock.expectOne(`${API}/api/patients`).flush({ detail: 'expired' }, UNAUTHORIZED);

    expect(error?.status).toBe(401);
  });

  it('does not retry a failed login — a 401 there means bad credentials', () => {
    let error: HttpErrorResponse | undefined;
    http.post(`${API}/api/auth/login`, {}).subscribe({ error: e => (error = e) });

    httpMock.expectOne(`${API}/api/auth/login`).flush({ detail: 'bad' }, UNAUTHORIZED);

    expect(refreshToken).not.toHaveBeenCalled();
    expect(error?.status).toBe(401);
  });

  it('does not retry a failed refresh, which would loop', () => {
    http.post(`${API}/api/auth/refresh`, {}).subscribe({ error: () => undefined });
    httpMock.expectOne(`${API}/api/auth/refresh`).flush({}, UNAUTHORIZED);
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('does not retry change-password — a 401 there means the old password was wrong', () => {
    let error: HttpErrorResponse | undefined;
    http.post(`${API}/api/auth/change-password`, {}).subscribe({ error: e => (error = e) });

    httpMock.expectOne(`${API}/api/auth/change-password`).flush({}, UNAUTHORIZED);

    expect(refreshToken).not.toHaveBeenCalled();
    expect(error?.status).toBe(401);
  });

  it('passes non-401 errors straight through', () => {
    let error: HttpErrorResponse | undefined;
    http.get(`${API}/api/patients`).subscribe({ error: e => (error = e) });

    httpMock
      .expectOne(`${API}/api/patients`)
      .flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(refreshToken).not.toHaveBeenCalled();
    expect(error?.status).toBe(500);
  });

  it('leaves 401s from non-API URLs alone', () => {
    let error: HttpErrorResponse | undefined;
    http.get('https://other.com/data').subscribe({ error: e => (error = e) });

    httpMock.expectOne('https://other.com/data').flush({}, UNAUTHORIZED);

    expect(refreshToken).not.toHaveBeenCalled();
    expect(error?.status).toBe(401);
  });
});
