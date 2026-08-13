import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TreatmentService } from './treatment.service';
import { Treatment, TreatmentCategory } from '../models/treatment.model';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api/treatments`;

const mockTreatments: Treatment[] = [
  {
    id: '1',
    code: 'T01',
    name: 'Plombiranje',
    category: TreatmentCategory.Restorative,
    description: 'Kompozitna plomba',
    defaultPrice: 3000,
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    code: 'T02',
    name: 'Čišćenje kamenca',
    category: TreatmentCategory.Preventive,
    createdAt: '2026-01-01',
  },
];

describe('TreatmentService', () => {
  let service: TreatmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TreatmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function loadMocks(): void {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockTreatments);
  }

  it('getAll returns empty array before any load', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('isLoaded returns false before loadAll', () => {
    expect(service.isLoaded()).toBe(false);
  });

  it('loadAll fetches treatments and populates cache', () => {
    service.loadAll().subscribe(treatments => {
      expect(treatments).toEqual(mockTreatments);
    });
    httpMock.expectOne(req => req.url === API).flush(mockTreatments);
    expect(service.getAll()).toEqual(mockTreatments);
    expect(service.isLoaded()).toBe(true);
  });

  it('loadAll passes the category query param', () => {
    service.loadAll({ category: TreatmentCategory.Preventive }).subscribe();
    const req = httpMock.expectOne(r => r.url === API);
    expect(req.request.params.get('category')).toBe('Preventive');
    req.flush([]);
  });

  it('getById returns the correct treatment after load', () => {
    loadMocks();
    expect(service.getById('1')?.defaultPrice).toBe(3000);
    expect(service.getById('99')).toBeUndefined();
  });

  it('create prepends the new treatment to the cache', () => {
    loadMocks();
    const created: Treatment = {
      id: '3',
      code: 'T03',
      name: 'Vađenje zuba',
      category: TreatmentCategory.Surgical,
      createdAt: '2026-02-01',
    };
    service
      .create({ code: 'T03', name: 'Vađenje zuba', category: TreatmentCategory.Surgical })
      .subscribe();
    httpMock.expectOne(req => req.method === 'POST').flush(created);
    expect(service.getAll()[0].id).toBe('3');
    expect(service.getAll()).toHaveLength(3);
  });

  it('update replaces the treatment in the cache', () => {
    loadMocks();
    service.update('1', { defaultPrice: 3500 }).subscribe();
    httpMock
      .expectOne(req => req.method === 'PUT')
      .flush({ ...mockTreatments[0], defaultPrice: 3500 });
    expect(service.getById('1')?.defaultPrice).toBe(3500);
  });

  it('delete removes the treatment from the cache', () => {
    loadMocks();
    service.delete('1').subscribe();
    httpMock.expectOne(req => req.method === 'DELETE').flush(null);
    expect(service.getAll()).toHaveLength(1);
    expect(service.getById('1')).toBeUndefined();
  });

  it('search filters by category', () => {
    loadMocks();
    expect(service.search('', { category: TreatmentCategory.Restorative })).toHaveLength(1);
    expect(service.search('', { category: TreatmentCategory.Orthodontic })).toHaveLength(0);
  });

  it('search matches name, code and description case-insensitively', () => {
    loadMocks();
    expect(service.search('plombiranje', {}).map(t => t.id)).toEqual(['1']);
    expect(service.search('t02', {}).map(t => t.id)).toEqual(['2']);
    expect(service.search('kompozitna', {}).map(t => t.id)).toEqual(['1']);
  });

  it('search ignores surrounding whitespace and returns all for an empty query', () => {
    loadMocks();
    expect(service.search('   ', {})).toHaveLength(2);
    expect(service.search('  plomb  ', {}).map(t => t.id)).toEqual(['1']);
  });
});
