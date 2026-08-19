import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpParams } from '@angular/common/http';
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

  it('transforms camelCase query params to snake_case for API URLs', () => {
    http
      .get(`${API}/api/visits`, {
        params: { patientId: 'p1', doctorId: 'd1', dateFrom: '2026-01-01', dateTo: '2026-12-31' },
      })
      .subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/api/visits`);
    expect(req.request.params.get('patient_id')).toBe('p1');
    expect(req.request.params.get('doctor_id')).toBe('d1');
    expect(req.request.params.get('date_from')).toBe('2026-01-01');
    expect(req.request.params.get('date_to')).toBe('2026-12-31');
    expect(req.request.params.has('patientId')).toBe(false);
    req.flush([]);
  });

  it('leaves single-word and already snake_case params alone', () => {
    http
      .get(`${API}/api/patients`, { params: { search: 'Marko', city: 'Beograd', import_incomplete: 'true' } })
      .subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/api/patients`);
    expect(req.request.params.get('search')).toBe('Marko');
    expect(req.request.params.get('city')).toBe('Beograd');
    expect(req.request.params.get('import_incomplete')).toBe('true');
    req.flush([]);
  });

  it('preserves repeated values when renaming a param', () => {
    let params = new HttpParams();
    params = params.append('toothNumber', '11').append('toothNumber', '12');
    http.get(`${API}/api/visits`, { params }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/api/visits`);
    expect(req.request.params.getAll('tooth_number')).toEqual(['11', '12']);
    req.flush([]);
  });

  it('does not transform query params for non-API URLs', () => {
    http.get('https://other.com/data', { params: { firstName: 'Marko' } }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'https://other.com/data');
    expect(req.request.params.get('firstName')).toBe('Marko');
    req.flush({});
  });
});
