import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VisitService } from './visit.service';
import { Visit } from '../models/visit.model';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api/visits`;

function visit(overrides: Partial<Visit> & Pick<Visit, 'id' | 'date'>): Visit {
  return {
    patientId: 'p1',
    doctorId: 'd1',
    toothNumber: null,
    paid: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

const mockVisits: Visit[] = [
  visit({ id: '1', date: '2026-03-10', patientId: 'p1', doctorId: 'd1', diagnosisNotes: 'Karijes' }),
  visit({ id: '2', date: '2026-03-20', patientId: 'p2', doctorId: 'd2', treatmentNotes: 'Plomba' }),
  visit({ id: '3', date: '2026-01-05', patientId: 'p1', doctorId: 'd2' }),
];

describe('VisitService', () => {
  let service: VisitService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VisitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  function loadMocks(): void {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockVisits);
  }

  it('getAll returns empty array before any load', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('coerces the string price Pydantic sends for Decimal into a number', () => {
    service.loadAll().subscribe();
    httpMock
      .expectOne(() => true)
      .flush([
        { ...visit({ id: '1', date: '2026-03-10' }), price: '1500.00' },
        { ...visit({ id: '2', date: '2026-03-11' }), price: '0.00' },
        { ...visit({ id: '3', date: '2026-03-12' }), price: null },
      ]);

    expect(service.getById('1')?.price).toBe(1500);
    // '0.00' is truthy where 0 is falsy, so an unpaid zero-price visit used to read
    // as money owed in patient-list's `!v.paid && v.price` check.
    expect(service.getById('2')?.price).toBe(0);
    expect(service.getById('3')?.price).toBeUndefined();
  });

  it('isLoaded returns false before loadAll', () => {
    expect(service.isLoaded()).toBe(false);
  });

  it('loadAll fetches visits and populates cache', () => {
    service.loadAll().subscribe(visits => {
      expect(visits).toEqual(mockVisits);
    });
    httpMock.expectOne(req => req.url === API).flush(mockVisits);
    expect(service.getAll()).toEqual(mockVisits);
    expect(service.isLoaded()).toBe(true);
  });

  it('loadAll forwards the filters as query params', () => {
    // The camelCase → snake_case rename is the interceptor's job, and these tests
    // run without it; caseTransformInterceptor covers that half.
    service
      .loadAll({ patientId: 'p1', doctorId: 'd1', dateFrom: '2026-01-01', dateTo: '2026-12-31' })
      .subscribe();
    const req = httpMock.expectOne(r => r.url === API);
    expect(req.request.params.get('patientId')).toBe('p1');
    expect(req.request.params.get('doctorId')).toBe('d1');
    expect(req.request.params.get('dateFrom')).toBe('2026-01-01');
    expect(req.request.params.get('dateTo')).toBe('2026-12-31');
    req.flush([]);
  });

  it('getById returns the correct visit after load', () => {
    loadMocks();
    expect(service.getById('2')?.patientId).toBe('p2');
    expect(service.getById('99')).toBeUndefined();
  });

  it('create prepends the new visit to the cache', () => {
    loadMocks();
    const created = visit({ id: '4', date: '2026-04-01' });
    service.create({ patientId: 'p1', doctorId: 'd1', date: '2026-04-01' }).subscribe();
    httpMock.expectOne(req => req.method === 'POST').flush(created);
    expect(service.getAll()[0].id).toBe('4');
    expect(service.getAll()).toHaveLength(4);
  });

  it('update replaces the visit in the cache', () => {
    loadMocks();
    service.update('1', { paid: true }).subscribe();
    httpMock
      .expectOne(req => req.method === 'PUT')
      .flush({ ...mockVisits[0], paid: true });
    expect(service.getById('1')?.paid).toBe(true);
  });

  it('dismissImportWarning patches and replaces the visit in the cache', () => {
    loadMocks();
    service.dismissImportWarning('1').subscribe();
    const req = httpMock.expectOne(r => r.method === 'PATCH');
    expect(req.request.url).toBe(`${API}/1/dismiss-warning`);
    req.flush({ ...mockVisits[0], importIncomplete: false });
    expect(service.getById('1')?.importIncomplete).toBe(false);
  });

  it('delete removes the visit from the cache', () => {
    loadMocks();
    service.delete('1').subscribe();
    httpMock.expectOne(req => req.method === 'DELETE').flush(null);
    expect(service.getAll()).toHaveLength(2);
    expect(service.getById('1')).toBeUndefined();
  });

  it('getByPatientId returns that patient visits newest first', () => {
    loadMocks();
    const results = service.getByPatientId('p1');
    expect(results.map(v => v.id)).toEqual(['1', '3']);
  });

  it('getByDoctorId returns that doctor visits newest first', () => {
    loadMocks();
    expect(service.getByDoctorId('d2').map(v => v.id)).toEqual(['2', '3']);
  });

  it('getRecent returns the newest visits limited to count', () => {
    loadMocks();
    expect(service.getRecent(2).map(v => v.id)).toEqual(['2', '1']);
  });

  it('getRecent does not mutate the cache order', () => {
    loadMocks();
    service.getRecent(3);
    expect(service.getAll().map(v => v.id)).toEqual(['1', '2', '3']);
  });

  it('getThisMonthCount counts only visits in the current calendar month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    loadMocks();
    expect(service.getThisMonthCount()).toBe(2);
  });

  it('search filters by patient and doctor id', () => {
    loadMocks();
    expect(service.search('', { patientId: 'p1' }, new Map(), new Map())).toHaveLength(2);
    expect(service.search('', { doctorId: 'd1' }, new Map(), new Map())).toHaveLength(1);
  });

  it('search filters by date range inclusively', () => {
    loadMocks();
    const results = service.search(
      '',
      { dateFrom: '2026-03-01', dateTo: '2026-03-20' },
      new Map(),
      new Map(),
    );
    expect(results.map(v => v.id)).toEqual(['2', '1']);
  });

  it('search matches patient and doctor names from the supplied maps', () => {
    loadMocks();
    const patients = new Map([['p2', 'Ana Anić']]);
    const doctors = new Map([['d1', 'Dr. Petar Petrović']]);
    expect(service.search('ana', {}, patients, doctors).map(v => v.id)).toEqual(['2']);
    expect(service.search('petar', {}, patients, doctors).map(v => v.id)).toEqual(['1']);
  });

  it('search matches diagnosis and treatment notes', () => {
    loadMocks();
    expect(service.search('karijes', {}, new Map(), new Map()).map(v => v.id)).toEqual(['1']);
    expect(service.search('plomba', {}, new Map(), new Map()).map(v => v.id)).toEqual(['2']);
  });

  it('search returns results newest first', () => {
    loadMocks();
    expect(service.search('', {}, new Map(), new Map()).map(v => v.id)).toEqual(['2', '1', '3']);
  });
});
