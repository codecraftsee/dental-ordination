import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/admin`;

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deleteVisits sends DELETE to /admin/visits', () => {
    let completed = false;
    service.deleteVisits().subscribe({ complete: () => (completed = true) });
    const req = httpMock.expectOne(`${BASE}/visits`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('deleteVisits propagates HTTP errors', () => {
    let errored = false;
    service.deleteVisits().subscribe({ error: () => (errored = true) });
    httpMock.expectOne(`${BASE}/visits`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
  });

  it('deletePatients sends DELETE to /admin/patients', () => {
    let completed = false;
    service.deletePatients().subscribe({ complete: () => (completed = true) });
    const req = httpMock.expectOne(`${BASE}/patients`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('deletePatients propagates HTTP errors', () => {
    let errored = false;
    service.deletePatients().subscribe({ error: () => (errored = true) });
    httpMock.expectOne(`${BASE}/patients`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
  });

  it('deleteDiagnoses sends DELETE to /admin/diagnoses', () => {
    let completed = false;
    service.deleteDiagnoses().subscribe({ complete: () => (completed = true) });
    const req = httpMock.expectOne(`${BASE}/diagnoses`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('deleteDiagnoses propagates HTTP errors', () => {
    let errored = false;
    service.deleteDiagnoses().subscribe({ error: () => (errored = true) });
    httpMock.expectOne(`${BASE}/diagnoses`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
  });

  it('deleteTreatments sends DELETE to /admin/treatments', () => {
    let completed = false;
    service.deleteTreatments().subscribe({ complete: () => (completed = true) });
    const req = httpMock.expectOne(`${BASE}/treatments`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('deleteTreatments propagates HTTP errors', () => {
    let errored = false;
    service.deleteTreatments().subscribe({ error: () => (errored = true) });
    httpMock.expectOne(`${BASE}/treatments`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
  });

  it('deleteAll sends DELETE to /admin/all', () => {
    let completed = false;
    service.deleteAll().subscribe({ complete: () => (completed = true) });
    const req = httpMock.expectOne(`${BASE}/all`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('deleteAll propagates HTTP errors', () => {
    let errored = false;
    service.deleteAll().subscribe({ error: () => (errored = true) });
    httpMock.expectOne(`${BASE}/all`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
  });
});
