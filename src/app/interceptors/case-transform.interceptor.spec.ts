import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { caseTransformInterceptor } from './case-transform.interceptor';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

describe('caseTransformInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([caseTransformInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('transforms snake_case response keys to camelCase for API URLs', () => {
    let result: Record<string, unknown> = {};
    http.get<Record<string, unknown>>(`${API}/api/patients`).subscribe(d => (result = d));
    httpMock
      .expectOne(`${API}/api/patients`)
      .flush({ first_name: 'Marko', last_name: 'Marković', date_of_birth: '1990-01-01' });
    expect(result['firstName']).toBe('Marko');
    expect(result['lastName']).toBe('Marković');
    expect(result['dateOfBirth']).toBe('1990-01-01');
  });

  it('transforms camelCase request body keys to snake_case for API URLs', () => {
    http
      .post(`${API}/api/patients`, { firstName: 'Marko', lastName: 'Marković' })
      .subscribe();
    const req = httpMock.expectOne(`${API}/api/patients`);
    expect(req.request.body['first_name']).toBe('Marko');
    expect(req.request.body['last_name']).toBe('Marković');
    req.flush({});
  });

  it('handles nested objects in response', () => {
    let result: Record<string, unknown> = {};
    http.get<Record<string, unknown>>(`${API}/api/visits`).subscribe(d => (result = d));
    httpMock
      .expectOne(`${API}/api/visits`)
      .flush({ patient_id: '1', patient: { first_name: 'Ana' } });
    expect(result['patientId']).toBe('1');
    expect((result['patient'] as Record<string, unknown>)['firstName']).toBe('Ana');
  });

  it('handles array responses', () => {
    let result: Record<string, unknown>[] = [];
    http.get<Record<string, unknown>[]>(`${API}/api/patients`).subscribe(d => (result = d));
    httpMock
      .expectOne(`${API}/api/patients`)
      .flush([{ first_name: 'Marko' }, { first_name: 'Ana' }]);
    expect(result[0]['firstName']).toBe('Marko');
    expect(result[1]['firstName']).toBe('Ana');
  });

  it('does not transform requests to non-API URLs', () => {
    let result: Record<string, unknown> = {};
    http.get<Record<string, unknown>>('https://other.com/data').subscribe(d => (result = d));
    httpMock.expectOne('https://other.com/data').flush({ first_name: 'Marko' });
    expect(result['first_name']).toBe('Marko');
    expect(result['firstName']).toBeUndefined();
  });

  it('skips body transformation for FormData', () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.txt');
    http.post(`${API}/api/import`, formData).subscribe();
    const req = httpMock.expectOne(`${API}/api/import`);
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({});
  });
});
