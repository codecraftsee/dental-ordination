import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientService } from './patient.service';
import { Patient } from '../models/patient.model';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/api/patients`;

const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'Marko',
    lastName: 'Marković',
    gender: 'male',
    city: 'Beograd',
    phone: '0601234567',
    dateOfBirth: '1990-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    firstName: 'Ana',
    lastName: 'Anić',
    gender: 'female',
    city: 'Novi Sad',
    phone: '0697654321',
    dateOfBirth: '1985-05-15',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('PatientService', () => {
  let service: PatientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll returns empty array before any load', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('isLoaded returns false before loadAll', () => {
    expect(service.isLoaded()).toBe(false);
  });

  it('loadAll fetches patients and populates cache', () => {
    service.loadAll().subscribe(patients => {
      expect(patients).toEqual(mockPatients);
    });
    httpMock.expectOne(req => req.url === API).flush(mockPatients);
    expect(service.getAll()).toEqual(mockPatients);
    expect(service.isLoaded()).toBe(true);
  });

  it('loadAll passes search and city query params', () => {
    service.loadAll({ search: 'Marko', city: 'Beograd' }).subscribe();
    const req = httpMock.expectOne(req => req.url === API);
    expect(req.request.params.get('search')).toBe('Marko');
    expect(req.request.params.get('city')).toBe('Beograd');
    req.flush([]);
  });

  it('getById returns the correct patient after load', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.getById('1')?.firstName).toBe('Marko');
    expect(service.getById('99')).toBeUndefined();
  });

  it('create prepends the new patient to the cache', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);

    const newPatient: Patient = {
      id: '3',
      firstName: 'Jovana',
      lastName: 'Jović',
      gender: 'female',
      city: 'Niš',
      dateOfBirth: '2000-01-01',
      createdAt: '',
      updatedAt: '',
    };
    service
      .create({ firstName: 'Jovana', lastName: 'Jović', gender: 'female', dateOfBirth: '2000-01-01' })
      .subscribe();
    httpMock.expectOne(req => req.method === 'POST').flush(newPatient);
    expect(service.getAll()[0].id).toBe('3');
    expect(service.getAll().length).toBe(3);
  });

  it('update replaces the patient in the cache', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);

    const updated: Patient = { ...mockPatients[0], firstName: 'Marco' };
    service.update('1', { firstName: 'Marco' }).subscribe();
    httpMock.expectOne(req => req.method === 'PUT').flush(updated);
    expect(service.getById('1')?.firstName).toBe('Marco');
  });

  it('delete removes the patient from the cache', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);

    service.delete('1').subscribe();
    httpMock.expectOne(req => req.method === 'DELETE').flush(null);
    expect(service.getAll().length).toBe(1);
    expect(service.getById('1')).toBeUndefined();
  });

  it('search filters by name query', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    const results = service.search('marko', {});
    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe('Marko');
  });

  it('search filters by city', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.search('', { city: 'Beograd' })).toHaveLength(1);
    expect(service.search('', { city: 'Novi Sad' })).toHaveLength(1);
  });

  it('search filters by gender', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.search('', { gender: 'female' })).toHaveLength(1);
    expect(service.search('', { gender: 'male' })).toHaveLength(1);
  });

  it('getCities returns unique sorted cities', () => {
    service.loadAll().subscribe();
    httpMock.expectOne(() => true).flush(mockPatients);
    expect(service.getCities()).toEqual(['Beograd', 'Novi Sad']);
  });
});
