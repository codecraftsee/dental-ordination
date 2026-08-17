import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DiagnosisService } from './diagnosis.service';
import { Diagnosis, DiagnosisCategory } from '../models/diagnosis.model';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api/diagnoses`;

const mockDiagnoses: Diagnosis[] = [
  {
    id: '1',
    code: 'K02.1',
    name: 'Karijes dentina',
    category: DiagnosisCategory.Caries,
    description: 'Duboki karijes',
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    code: 'K05.3',
    name: 'Hronični parodontitis',
    category: DiagnosisCategory.Periodontal,
    createdAt: '2026-01-01',
  },
];

describe('DiagnosisService', () => {
  let service: DiagnosisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiagnosisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function loadMocks(): void {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockDiagnoses);
  }

  it('getAll returns empty array before any load', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('isLoaded returns false before loadAll', () => {
    expect(service.isLoaded()).toBe(false);
  });

  it('loadAll fetches diagnoses and populates cache', () => {
    service.loadAll().subscribe(diagnoses => {
      expect(diagnoses).toEqual(mockDiagnoses);
    });
    httpMock.expectOne(req => req.url === API).flush(mockDiagnoses);
    expect(service.getAll()).toEqual(mockDiagnoses);
    expect(service.isLoaded()).toBe(true);
  });

  it('loadAll passes the category query param', () => {
    service.loadAll({ category: DiagnosisCategory.Caries }).subscribe();
    const req = httpMock.expectOne(r => r.url === API);
    expect(req.request.params.get('category')).toBe('Caries');
    req.flush([]);
  });

  it('getById returns the correct diagnosis after load', () => {
    loadMocks();
    expect(service.getById('1')?.code).toBe('K02.1');
    expect(service.getById('99')).toBeUndefined();
  });

  it('create prepends the new diagnosis to the cache', () => {
    loadMocks();
    const created: Diagnosis = {
      id: '3',
      code: 'K04.0',
      name: 'Pulpitis',
      category: DiagnosisCategory.Pulpal,
      createdAt: '2026-02-01',
    };
    service
      .create({ code: 'K04.0', name: 'Pulpitis', category: DiagnosisCategory.Pulpal })
      .subscribe();
    httpMock.expectOne(req => req.method === 'POST').flush(created);
    expect(service.getAll()[0].id).toBe('3');
    expect(service.getAll()).toHaveLength(3);
  });

  it('update replaces the diagnosis in the cache', () => {
    loadMocks();
    service.update('1', { name: 'Karijes emajla' }).subscribe();
    httpMock
      .expectOne(req => req.method === 'PUT')
      .flush({ ...mockDiagnoses[0], name: 'Karijes emajla' });
    expect(service.getById('1')?.name).toBe('Karijes emajla');
  });

  it('delete removes the diagnosis from the cache', () => {
    loadMocks();
    service.delete('1').subscribe();
    httpMock.expectOne(req => req.method === 'DELETE').flush(null);
    expect(service.getAll()).toHaveLength(1);
    expect(service.getById('1')).toBeUndefined();
  });

  it('search filters by category', () => {
    loadMocks();
    expect(service.search('', { category: DiagnosisCategory.Caries })).toHaveLength(1);
    expect(service.search('', { category: DiagnosisCategory.Orthodontic })).toHaveLength(0);
  });

  it('search matches name, code and description case-insensitively', () => {
    loadMocks();
    expect(service.search('karijes', {}).map(d => d.id)).toEqual(['1']);
    expect(service.search('k05', {}).map(d => d.id)).toEqual(['2']);
    expect(service.search('duboki', {}).map(d => d.id)).toEqual(['1']);
  });

  it('search ignores surrounding whitespace and returns all for an empty query', () => {
    loadMocks();
    expect(service.search('   ', {})).toHaveLength(2);
    expect(service.search('  karijes  ', {}).map(d => d.id)).toEqual(['1']);
  });
});
