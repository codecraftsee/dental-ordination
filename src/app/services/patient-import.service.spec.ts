import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PatientImportService } from './patient-import.service';
import { PatientService, ImportProgressEvent, ImportResult } from './patient.service';
import { UserService } from './user.service';
import { VisitService } from './visit.service';
import { DiagnosisService } from './diagnosis.service';
import { TreatmentService } from './treatment.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { TranslateService } from './translate.service';

const summary: ImportResult = {
  patientsCreated: 3,
  patientsFound: 1,
  visitsCreated: 7,
  filesProcessed: 2,
  errors: [],
};

describe('PatientImportService', () => {
  let service: PatientImportService;
  let events: Subject<ImportProgressEvent>;
  let importXlsx: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let hasPermission: ReturnType<typeof vi.fn>;
  let loadAll: Record<string, ReturnType<typeof vi.fn>>;

  const file = new File(['x'], 'patients.xlsx');

  beforeEach(() => {
    events = new Subject<ImportProgressEvent>();
    importXlsx = vi.fn().mockReturnValue(events);
    toastSuccess = vi.fn();
    hasPermission = vi.fn().mockReturnValue(true);
    loadAll = {
      patient: vi.fn().mockReturnValue(of([])),
      user: vi.fn().mockReturnValue(of([])),
      visit: vi.fn().mockReturnValue(of([])),
      diagnosis: vi.fn().mockReturnValue(of([])),
      treatment: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PatientService, useValue: { importXlsx, loadAll: loadAll['patient'] } },
        { provide: UserService, useValue: { loadAll: loadAll['user'] } },
        { provide: VisitService, useValue: { loadAll: loadAll['visit'] } },
        { provide: DiagnosisService, useValue: { loadAll: loadAll['diagnosis'] } },
        { provide: TreatmentService, useValue: { loadAll: loadAll['treatment'] } },
        { provide: AuthService, useValue: { hasPermission } },
        { provide: ToastService, useValue: { success: toastSuccess, error: vi.fn() } },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
            format: (key: string) => key,
          },
        },
      ],
    });
    service = TestBed.inject(PatientImportService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle', () => {
    expect(service.importing()).toBe(false);
    expect(service.progress()).toBe(0);
    expect(service.message()).toBe('');
    expect(service.error()).toBe(false);
    expect(service.total()).toBe(0);
    expect(service.currentFile()).toBe('');
  });

  it('start passes files and doctor id through to the import request', () => {
    service.start([file], 'doc-1');
    expect(importXlsx).toHaveBeenCalledWith([file], 'doc-1');
    expect(service.importing()).toBe(true);
  });

  it('ignores a second start while an import is already running', () => {
    service.start([file], undefined);
    service.start([file], undefined);
    expect(importXlsx).toHaveBeenCalledTimes(1);
  });

  it('progress events update the file, total and percentage', () => {
    service.start([file], undefined);
    events.next({ type: 'progress', current: 1, total: 4, file: 'a.xlsx' });

    expect(service.currentFile()).toBe('a.xlsx');
    expect(service.total()).toBe(4);
    expect(service.progress()).toBe(0);

    events.next({ type: 'progress', current: 3, total: 4, file: 'c.xlsx' });
    expect(service.progress()).toBe(50);
  });

  it('file_done advances the percentage by completed files', () => {
    service.start([file], undefined);
    events.next({ type: 'file_done', current: 1, total: 4, file: 'a.xlsx', patientsCreated: 1, visitsCreated: 2, errors: [] });
    expect(service.progress()).toBe(25);
  });

  it('completion clears the running flag, reports a summary and toasts', () => {
    service.start([file], undefined);
    events.next({ type: 'complete', summary });

    expect(service.importing()).toBe(false);
    expect(service.progress()).toBe(100);
    expect(service.error()).toBe(false);
    expect(service.message()).toBe('home.importSummary');
    expect(toastSuccess).toHaveBeenCalledWith('toast.importSuccess');
  });

  it('completion reloads every cache an import can invalidate', () => {
    service.start([file], undefined);
    events.next({ type: 'complete', summary });

    expect(loadAll['patient']).toHaveBeenCalled();
    expect(loadAll['user']).toHaveBeenCalled();
    expect(loadAll['visit']).toHaveBeenCalled();
    expect(loadAll['diagnosis']).toHaveBeenCalled();
    expect(loadAll['treatment']).toHaveBeenCalled();
  });

  it('skips reloading caches the user has no permission to read', () => {
    hasPermission.mockReturnValue(false);
    service.start([file], undefined);
    events.next({ type: 'complete', summary });

    expect(loadAll['patient']).not.toHaveBeenCalled();
    expect(loadAll['visit']).not.toHaveBeenCalled();
  });

  it('one failing cache reload does not prevent the others', () => {
    loadAll['patient'].mockReturnValue(throwError(() => new Error('boom')));
    service.start([file], undefined);

    expect(() => events.next({ type: 'complete', summary })).not.toThrow();
    expect(loadAll['visit']).toHaveBeenCalled();
    expect(loadAll['treatment']).toHaveBeenCalled();
  });

  it('errors surface as a failure message and clear the running flag', () => {
    service.start([file], undefined);
    events.error({ detail: 'bad sheet' });

    expect(service.importing()).toBe(false);
    expect(service.error()).toBe(true);
    expect(service.message()).toBe('home.importFailed');
    expect(service.progress()).toBe(0);
  });

  it('dismisses the message after five seconds', () => {
    vi.useFakeTimers();
    service.start([file], undefined);
    events.next({ type: 'complete', summary });
    expect(service.message()).toBe('home.importSummary');

    vi.advanceTimersByTime(5000);

    expect(service.message()).toBe('');
    expect(service.error()).toBe(false);
  });

  it('a new import clears the previous run message', () => {
    service.start([file], undefined);
    events.error({ detail: 'bad sheet' });
    expect(service.message()).toBe('home.importFailed');

    events = new Subject<ImportProgressEvent>();
    importXlsx.mockReturnValue(events);
    service.start([file], undefined);

    expect(service.message()).toBe('');
    expect(service.error()).toBe(false);
    expect(service.progress()).toBe(0);
  });

  it('progress state outlives the component that started the import', () => {
    // The whole point of the extraction: nothing here is tied to a component
    // lifecycle, so state survives navigating away from the dashboard.
    service.start([file], undefined);
    events.next({ type: 'progress', current: 2, total: 5, file: 'b.xlsx' });

    TestBed.resetTestingModule();

    expect(service.importing()).toBe(true);
    expect(service.currentFile()).toBe('b.xlsx');
    expect(service.progress()).toBe(20);
  });
});
