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
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { DoctorService } from '../services/doctor.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';

const makeLoadAllMock = () => ({ loadAll: vi.fn().mockReturnValue(of([])) });

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let authService: { changePassword: ReturnType<typeof vi.fn> };
  let adminService: {
    deleteVisits: ReturnType<typeof vi.fn>;
    deletePatients: ReturnType<typeof vi.fn>;
    deleteDoctors: ReturnType<typeof vi.fn>;
    deleteDiagnoses: ReturnType<typeof vi.fn>;
    deleteTreatments: ReturnType<typeof vi.fn>;
    deleteAll: ReturnType<typeof vi.fn>;
  };
  let patientService: { loadAll: ReturnType<typeof vi.fn> };
  let doctorService: { loadAll: ReturnType<typeof vi.fn> };
  let visitService: { loadAll: ReturnType<typeof vi.fn> };
  let diagnosisService: { loadAll: ReturnType<typeof vi.fn> };
  let treatmentService: { loadAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { changePassword: vi.fn().mockReturnValue(of(undefined)) };
    adminService = {
      deleteVisits: vi.fn().mockReturnValue(of(undefined)),
      deletePatients: vi.fn().mockReturnValue(of(undefined)),
      deleteDoctors: vi.fn().mockReturnValue(of(undefined)),
      deleteDiagnoses: vi.fn().mockReturnValue(of(undefined)),
      deleteTreatments: vi.fn().mockReturnValue(of(undefined)),
      deleteAll: vi.fn().mockReturnValue(of(undefined)),
    };
    patientService = makeLoadAllMock();
    doctorService = makeLoadAllMock();
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
        { provide: AuthService, useValue: authService },
        { provide: AdminService, useValue: adminService },
        { provide: PatientService, useValue: patientService },
        { provide: DoctorService, useValue: doctorService },
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

  // Password form validation

  it('passwordForm is invalid when empty', () => {
    expect(component.passwordForm.invalid).toBe(true);
  });

  it('passwordForm is invalid when passwords do not match', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'different' });
    expect(component.passwordForm.errors?.['passwordMismatch']).toBeTruthy();
  });

  it('passwordForm is valid when all fields are correct and passwords match', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    expect(component.passwordForm.valid).toBe(true);
  });

  // submitPasswordChange — invalid form

  it('submitPasswordChange marks all controls as touched when form is invalid', () => {
    component.submitPasswordChange();
    expect(component.passwordForm.get('currentPassword')?.touched).toBe(true);
    expect(component.passwordForm.get('newPassword')?.touched).toBe(true);
    expect(component.passwordForm.get('confirmPassword')?.touched).toBe(true);
  });

  it('submitPasswordChange does not call authService when form is invalid', () => {
    component.submitPasswordChange();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  // submitPasswordChange — success

  it('submitPasswordChange calls authService.changePassword with form values', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(authService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old',
      newPassword: 'newPass1',
      confirmPassword: 'newPass1',
    });
  });

  it('submitPasswordChange sets success message and resets form on success', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(component.pwMessage()).toBe('admin.changePasswordSuccess');
    expect(component.pwIsError()).toBe(false);
    expect(component.pwLoading()).toBe(false);
    expect(component.passwordForm.pristine).toBe(true);
    expect(component.passwordForm.get('currentPassword')?.value).toBeNull();
    expect(component.passwordForm.get('newPassword')?.value).toBeNull();
    expect(component.passwordForm.get('confirmPassword')?.value).toBeNull();
  });

  it('submitPasswordChange sets error message on failure', () => {
    authService.changePassword.mockReturnValue(throwError(() => new Error('fail')));
    component.passwordForm.setValue({ currentPassword: 'wrong', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(component.pwMessage()).toBe('admin.changePasswordError');
    expect(component.pwIsError()).toBe(true);
    expect(component.pwLoading()).toBe(false);
  });

  // execute — success

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

  // Cache refresh logic — parameterized across all non-visits branches

  it.each([
    { key: 'patients' as const, deleteFn: 'deletePatients' as const },
    { key: 'doctors' as const, deleteFn: 'deleteDoctors' as const },
    { key: 'diagnoses' as const, deleteFn: 'deleteDiagnoses' as const },
    { key: 'treatments' as const, deleteFn: 'deleteTreatments' as const },
    { key: 'all' as const, deleteFn: 'deleteAll' as const },
  ])('execute dispatches $deleteFn and refreshes correct caches for $key action', ({ key, deleteFn }) => {
    const serviceMap: Record<string, Array<{ loadAll: ReturnType<typeof vi.fn> }>> = {
      patients: [patientService, visitService],
      doctors: [doctorService],
      diagnoses: [diagnosisService],
      treatments: [treatmentService],
      all: [patientService, visitService, doctorService, diagnosisService, treatmentService],
    };

    const action = component.actions.find(a => a.key === key)!;
    action.confirmInput.set('DELETE');
    component.execute(action);

    expect(adminService[deleteFn]).toHaveBeenCalled();
    for (const svc of serviceMap[key]) {
      expect(svc.loadAll).toHaveBeenCalled();
    }
  });
});
