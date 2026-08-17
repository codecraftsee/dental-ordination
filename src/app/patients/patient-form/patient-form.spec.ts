import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import PatientForm from './patient-form';
import { TranslateService } from '../../services/translate.service';
import { PatientService } from '../../services/patient.service';
import { ToastService } from '../../services/toast.service';
import { Patient } from '../../models/patient.model';

const patient: Patient = {
  id: 'p-1',
  firstName: 'Marko',
  lastName: 'Marković',
  parentName: 'Petar',
  gender: 'male',
  dateOfBirth: '1990-04-05',
  address: 'Glavna 1',
  city: 'Beograd',
  phone: '0601234567',
  email: 'marko@example.com',
  createdAt: '',
  updatedAt: '',
};

const validValues = {
  firstName: 'Marko',
  lastName: 'Marković',
  parentName: 'Petar',
  gender: 'male',
  dateOfBirth: new Date(1990, 3, 5),
  address: 'Glavna 1',
  city: 'Beograd',
  phone: '0601234567',
  email: 'marko@example.com',
};

describe('PatientForm', () => {
  let fixture: ComponentFixture<PatientForm>;
  let component: PatientForm;
  let patientService: { loadById: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn<(commands: unknown[]) => void>>;
  let routeId: string | null;

  async function create(): Promise<void> {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            instant: (key: string) => key,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
        { provide: PatientService, useValue: patientService },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          // ParamMap.get returns null for a missing key, where Map returns undefined.
          useValue: { snapshot: { paramMap: { get: (key: string) => (key === 'id' ? routeId : null) } } },
        },
      ],
    }).compileComponents();

    navigate = vi.fn<(commands: unknown[]) => void>();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(commands => {
      navigate(commands as unknown[]);
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(PatientForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    routeId = null;
    patientService = {
      loadById: vi.fn().mockReturnValue(of(patient)),
      create: vi.fn().mockReturnValue(of(patient)),
      update: vi.fn().mockReturnValue(of(patient)),
    };
    toast = { success: vi.fn(), error: vi.fn() };
  });

  it('starts in add mode with an empty, invalid form', async () => {
    await create();
    expect(component.isEditMode).toBe(false);
    expect(component.patientId).toBeNull();
    expect(component.form.valid).toBe(false);
    expect(patientService.loadById).not.toHaveBeenCalled();
  });

  it('defaults gender to male', async () => {
    await create();
    expect(component.form.value.gender).toBe('male');
  });

  it('requires every field, and a well-formed email', async () => {
    await create();
    component.form.patchValue({ ...validValues, email: 'not-an-email' });
    expect(component.form.valid).toBe(false);
    component.form.patchValue({ email: 'marko@example.com' });
    expect(component.form.valid).toBe(true);
  });

  it('does not submit an invalid form, and marks it touched instead', async () => {
    await create();
    component.onSubmit();
    expect(patientService.create).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('creates a patient with the date serialised as yyyy-MM-dd', async () => {
    await create();
    component.form.patchValue(validValues);
    component.onSubmit();

    expect(patientService.create).toHaveBeenCalledTimes(1);
    expect(patientService.create.mock.calls[0][0].dateOfBirth).toBe('1990-04-05');
    expect(toast.success).toHaveBeenCalledWith('toast.patientCreated');
    expect(navigate).toHaveBeenCalledWith(['/patients', 'p-1']);
  });

  it('formats single-digit months and days with a leading zero', async () => {
    await create();
    component.form.patchValue({ ...validValues, dateOfBirth: new Date(2001, 0, 9) });
    component.onSubmit();

    expect(patientService.create.mock.calls[0][0].dateOfBirth).toBe('2001-01-09');
  });

  it('loads the patient in edit mode and parses the date into a local Date', async () => {
    routeId = 'p-1';
    await create();

    expect(component.isEditMode).toBe(true);
    expect(patientService.loadById).toHaveBeenCalledWith('p-1');
    const loaded = component.form.value.dateOfBirth as Date;
    expect(loaded.getFullYear()).toBe(1990);
    expect(loaded.getMonth()).toBe(3);
    expect(loaded.getDate()).toBe(5);
  });

  it('updates rather than creates in edit mode', async () => {
    routeId = 'p-1';
    await create();
    component.onSubmit();

    expect(patientService.update).toHaveBeenCalledWith('p-1', expect.objectContaining({ firstName: 'Marko' }));
    expect(patientService.create).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('toast.patientUpdated');
  });

  it('returns to the list when the patient cannot be loaded', async () => {
    routeId = 'missing';
    patientService.loadById.mockReturnValue(throwError(() => new Error('404')));
    await create();

    expect(navigate).toHaveBeenCalledWith(['/patients']);
  });

  it('toasts the error and stays put when the write fails', async () => {
    await create();
    patientService.create.mockReturnValue(throwError(() => ({ detail: 'duplicate' })));
    component.form.patchValue(validValues);
    component.onSubmit();

    expect(toast.error).toHaveBeenCalledWith({ detail: 'duplicate' });
    expect(navigate).not.toHaveBeenCalled();
  });
});
