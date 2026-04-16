import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import Admin from './admin';
import { TranslateService } from '../services/translate.service';
import { AdminService } from '../services/admin.service';
import { PatientService } from '../services/patient.service';
import { UserService } from '../services/user.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';

const makeLoadAllMock = () => ({ loadAll: vi.fn().mockReturnValue(of([])) });

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let adminService: {
    deleteVisits: ReturnType<typeof vi.fn>;
    deletePatients: ReturnType<typeof vi.fn>;
    deleteDiagnoses: ReturnType<typeof vi.fn>;
    deleteTreatments: ReturnType<typeof vi.fn>;
    deleteAll: ReturnType<typeof vi.fn>;
  };
  let patientService: { loadAll: ReturnType<typeof vi.fn> };
  let userService: { loadAll: ReturnType<typeof vi.fn> };
  let visitService: { loadAll: ReturnType<typeof vi.fn> };
  let diagnosisService: { loadAll: ReturnType<typeof vi.fn> };
  let treatmentService: { loadAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    adminService = {
      deleteVisits: vi.fn().mockReturnValue(of(undefined)),
      deletePatients: vi.fn().mockReturnValue(of(undefined)),
      deleteDiagnoses: vi.fn().mockReturnValue(of(undefined)),
      deleteTreatments: vi.fn().mockReturnValue(of(undefined)),
      deleteAll: vi.fn().mockReturnValue(of(undefined)),
    };
    patientService = makeLoadAllMock();
    userService = makeLoadAllMock();
    visitService = makeLoadAllMock();
    diagnosisService = makeLoadAllMock();
    treatmentService = makeLoadAllMock();

    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            instant: (key: string) => key,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
        { provide: AdminService, useValue: adminService },
        { provide: PatientService, useValue: patientService },
        { provide: UserService, useValue: userService },
        { provide: VisitService, useValue: visitService },
        { provide: DiagnosisService, useValue: diagnosisService },
        { provide: TreatmentService, useValue: treatmentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('execute calls adminService.deleteVisits for visits action', () => {
    const action = component.actions.find(a => a.key === 'visits')!;
    action.confirmInput.set('DELETE');
    component.execute(action);
    expect(adminService.deleteVisits).toHaveBeenCalled();
  });

  it('execute sets success state and refreshes cache on success', () => {
    const action = component.actions.find(a => a.key === 'visits')!;
    action.confirmInput.set('DELETE');
    component.execute(action);
    expect(action.message()).toBe('admin.success');
    expect(action.isError()).toBe(false);
    expect(action.loading()).toBe(false);
    expect(visitService.loadAll).toHaveBeenCalled();
  });

  it('execute sets error state and message on failure', () => {
    adminService.deleteVisits.mockReturnValue(throwError(() => ({ error: { detail: 'DB error' } })));
    const action = component.actions.find(a => a.key === 'visits')!;
    action.confirmInput.set('DELETE');
    component.execute(action);
    expect(action.message()).toBe('DB error');
    expect(action.isError()).toBe(true);
    expect(action.loading()).toBe(false);
  });

  it('execute falls back to admin.error key when error has no detail', () => {
    adminService.deleteVisits.mockReturnValue(throwError(() => ({ error: {} })));
    const action = component.actions.find(a => a.key === 'visits')!;
    action.confirmInput.set('DELETE');
    component.execute(action);
    expect(action.message()).toBe('admin.error');
  });

  it.each([
    { key: 'patients' as const, deleteFn: 'deletePatients' as const, caches: ['patientService', 'visitService'] },
    { key: 'diagnoses' as const, deleteFn: 'deleteDiagnoses' as const, caches: ['diagnosisService'] },
    { key: 'treatments' as const, deleteFn: 'deleteTreatments' as const, caches: ['treatmentService'] },
  ])('execute dispatches $deleteFn and refreshes correct caches for $key action', ({ key, deleteFn, caches }) => {
    const serviceMap: Record<string, { loadAll: ReturnType<typeof vi.fn> }> = {
      patientService,
      userService,
      visitService,
      diagnosisService,
      treatmentService,
    };

    const action = component.actions.find(a => a.key === key)!;
    action.confirmInput.set('DELETE');
    component.execute(action);

    expect(adminService[deleteFn]).toHaveBeenCalled();
    for (const svcKey of caches) {
      expect(serviceMap[svcKey].loadAll).toHaveBeenCalled();
    }
  });

  it('execute for all action refreshes all caches', () => {
    const action = component.actions.find(a => a.key === 'all')!;
    action.confirmInput.set('DELETE');
    component.execute(action);
    expect(adminService.deleteAll).toHaveBeenCalled();
    expect(patientService.loadAll).toHaveBeenCalled();
    expect(visitService.loadAll).toHaveBeenCalled();
    expect(userService.loadAll).toHaveBeenCalled();
    expect(diagnosisService.loadAll).toHaveBeenCalled();
    expect(treatmentService.loadAll).toHaveBeenCalled();
  });
});
