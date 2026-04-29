import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientDocumentService } from './patient-document.service';
import { PatientDocument } from '../models/patient-document.model';
import { environment } from '../../environments/environment';

const PATIENT_ID = 'p-1';
const DOCS_URL = `${environment.apiUrl}/api/patients/${PATIENT_ID}/documents`;

const mockDocs: PatientDocument[] = [
  {
    id: 'd-1',
    patientId: PATIENT_ID,
    filename: 'xray.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2_400_000,
    description: 'Pre-op xray',
    uploadedByUserId: 'u-1',
    uploadedAt: '2026-04-22T10:00:00Z',
    signedUrl: 'https://storage.example/xray.pdf?token=abc',
  },
  {
    id: 'd-2',
    patientId: PATIENT_ID,
    filename: 'scan.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 800_000,
    uploadedAt: '2026-04-21T10:00:00Z',
    signedUrl: 'https://storage.example/scan.jpg?token=def',
  },
];

describe('PatientDocumentService', () => {
  let service: PatientDocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientDocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll returns empty array before any load', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('isLoadedFor returns false before load', () => {
    expect(service.isLoadedFor(PATIENT_ID)).toBe(false);
  });

  it('loadByPatientId fetches documents and populates cache', () => {
    service.loadByPatientId(PATIENT_ID).subscribe(docs => {
      expect(docs).toEqual(mockDocs);
    });
    httpMock.expectOne(DOCS_URL).flush(mockDocs);
    expect(service.getAll()).toEqual(mockDocs);
    expect(service.isLoadedFor(PATIENT_ID)).toBe(true);
    expect(service.isLoadedFor('other')).toBe(false);
  });

  it('getById returns the correct document after load', () => {
    service.loadByPatientId(PATIENT_ID).subscribe();
    httpMock.expectOne(DOCS_URL).flush(mockDocs);
    expect(service.getById('d-1')?.filename).toBe('xray.pdf');
    expect(service.getById('missing')).toBeUndefined();
  });

  it('upload posts FormData with file field and prepends to cache', () => {
    service.loadByPatientId(PATIENT_ID).subscribe();
    httpMock.expectOne(DOCS_URL).flush(mockDocs);

    const file = new File(['hello'], 'report.pdf', { type: 'application/pdf' });
    const uploaded: PatientDocument = {
      id: 'd-3',
      patientId: PATIENT_ID,
      filename: 'report.pdf',
      contentType: 'application/pdf',
      sizeBytes: 5,
      description: 'checkup notes',
      uploadedAt: '2026-04-22T12:00:00Z',
      signedUrl: 'https://storage.example/report.pdf?token=ghi',
    };

    service.upload(PATIENT_ID, file, 'checkup notes').subscribe();
    const req = httpMock.expectOne(DOCS_URL);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
    expect((body.get('file') as File).name).toBe('report.pdf');
    expect(body.get('description')).toBe('checkup notes');
    req.flush(uploaded);

    expect(service.getAll()[0].id).toBe('d-3');
    expect(service.getAll().length).toBe(3);
  });

  it('upload omits description when blank', () => {
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    service.upload(PATIENT_ID, file, '   ').subscribe();
    const req = httpMock.expectOne(DOCS_URL);
    const body = req.request.body as FormData;
    expect(body.has('description')).toBe(false);
    req.flush({ ...mockDocs[0], id: 'd-new' });
  });

  it('delete removes the document from cache', () => {
    service.loadByPatientId(PATIENT_ID).subscribe();
    httpMock.expectOne(DOCS_URL).flush(mockDocs);

    service.delete(PATIENT_ID, 'd-1').subscribe();
    httpMock.expectOne(req => req.method === 'DELETE' && req.url === `${DOCS_URL}/d-1`).flush(null);

    expect(service.getAll().length).toBe(1);
    expect(service.getById('d-1')).toBeUndefined();
  });
});
