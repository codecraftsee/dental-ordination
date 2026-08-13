import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { EntityCacheService, matchesQuery } from './entity-cache.service';
import { environment } from '../../environments/environment';

interface Thing {
  id: string;
  name: string;
  note?: string;
}

type ThingCreate = Omit<Thing, 'id'>;
type ThingUpdate = Partial<ThingCreate>;

@Injectable({ providedIn: 'root' })
class ThingService extends EntityCacheService<Thing, ThingCreate, ThingUpdate> {
  protected readonly path = '/api/things';

  dismiss(id: string): Observable<Thing> {
    return this.patchOne(id, 'dismiss-warning');
  }
}

const API = `${environment.apiUrl}/api/things`;

const things: Thing[] = [
  { id: '1', name: 'First', note: 'alpha' },
  { id: '2', name: 'Second' },
];

describe('EntityCacheService', () => {
  let service: ThingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ThingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function loadMocks(): void {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(things);
  }

  it('starts empty and unloaded', () => {
    expect(service.getAll()).toEqual([]);
    expect(service.isLoaded()).toBe(false);
  });

  it('resolves the URL from the subclass path', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(API).flush([]);
  });

  it('loadAll populates the cache and flips isLoaded', () => {
    loadMocks();
    expect(service.getAll()).toEqual(things);
    expect(service.isLoaded()).toBe(true);
  });

  it('loadAll sends only the params that have a value', () => {
    service.loadAll({ kept: 'yes', empty: '', missing: undefined }).subscribe();
    const req = httpMock.expectOne(r => r.url === API);
    expect(req.request.params.get('kept')).toBe('yes');
    expect(req.request.params.has('empty')).toBe(false);
    expect(req.request.params.has('missing')).toBe(false);
    req.flush([]);
  });

  it('getById finds a cached entity and misses cleanly', () => {
    loadMocks();
    expect(service.getById('2')?.name).toBe('Second');
    expect(service.getById('nope')).toBeUndefined();
  });

  it('loadById fetches without touching the cache', () => {
    loadMocks();
    service.loadById('1').subscribe();
    httpMock.expectOne(`${API}/1`).flush({ id: '1', name: 'Changed' });
    expect(service.getById('1')?.name).toBe('First');
  });

  it('create prepends to the cache', () => {
    loadMocks();
    service.create({ name: 'Third' }).subscribe();
    httpMock.expectOne(r => r.method === 'POST').flush({ id: '3', name: 'Third' });
    expect(service.getAll().map(t => t.id)).toEqual(['3', '1', '2']);
  });

  it('update replaces in place, preserving order', () => {
    loadMocks();
    service.update('2', { name: 'Renamed' }).subscribe();
    httpMock.expectOne(r => r.method === 'PUT').flush({ id: '2', name: 'Renamed' });
    expect(service.getAll().map(t => t.name)).toEqual(['First', 'Renamed']);
  });

  it('delete removes from the cache', () => {
    loadMocks();
    service.delete('1').subscribe();
    httpMock.expectOne(r => r.method === 'DELETE').flush(null);
    expect(service.getAll().map(t => t.id)).toEqual(['2']);
  });

  it('patchOne targets the sub-path and replaces in place', () => {
    loadMocks();
    service.dismiss('1').subscribe();
    const req = httpMock.expectOne(r => r.method === 'PATCH');
    expect(req.request.url).toBe(`${API}/1/dismiss-warning`);
    req.flush({ id: '1', name: 'First', note: 'dismissed' });
    expect(service.getById('1')?.note).toBe('dismissed');
  });

  it('a failed write leaves the cache untouched', () => {
    loadMocks();
    service.delete('1').subscribe({ error: () => undefined });
    httpMock
      .expectOne(r => r.method === 'DELETE')
      .flush({ detail: 'nope' }, { status: 500, statusText: 'Server Error' });
    expect(service.getAll().map(t => t.id)).toEqual(['1', '2']);
  });
});

describe('matchesQuery', () => {
  const thing: Thing = { id: '1', name: 'Karijes dentina', note: 'duboki' };

  it('matches any of the given fields case-insensitively', () => {
    expect(matchesQuery(thing, 'KARIJES', t => [t.name, t.note])).toBe(true);
    expect(matchesQuery(thing, 'duboki', t => [t.name, t.note])).toBe(true);
  });

  it('trims the query and treats a blank one as matching everything', () => {
    expect(matchesQuery(thing, '  dentina  ', t => [t.name])).toBe(true);
    expect(matchesQuery(thing, '   ', t => [t.name])).toBe(true);
    expect(matchesQuery(thing, '', t => [t.name])).toBe(true);
  });

  it('tolerates undefined fields', () => {
    const bare: Thing = { id: '2', name: 'x' };
    expect(matchesQuery(bare, 'zzz', t => [t.name, t.note])).toBe(false);
  });
});
