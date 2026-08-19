import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import TreatmentForm from './treatment-form';
import { TranslateService } from '../../services/translate.service';
import { TreatmentService } from '../../services/treatment.service';
import { ToastService } from '../../services/toast.service';
import { Treatment, TreatmentCategory } from '../../models/treatment.model';

const treatment: Treatment = {
  id: 't-1',
  code: 'T01',
  name: 'Plombiranje',
  category: TreatmentCategory.Restorative,
  description: 'Kompozitna plomba',
  defaultPrice: 3000,
  createdAt: '',
};

const validValues = {
  code: 'T01',
  name: 'Plombiranje',
  category: TreatmentCategory.Restorative,
  description: '',
  defaultPrice: 3000,
};

describe('TreatmentForm', () => {
  let fixture: ComponentFixture<TreatmentForm>;
  let component: TreatmentForm;
  let treatmentService: { loadById: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
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
        { provide: TreatmentService, useValue: treatmentService },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => (key === 'id' ? routeId : null) } } },
        },
      ],
    }).compileComponents();

    navigate = vi.fn<(commands: unknown[]) => void>();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(commands => {
      navigate(commands as unknown[]);
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(TreatmentForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    routeId = null;
    treatmentService = {
      loadById: vi.fn().mockReturnValue(of(treatment)),
      create: vi.fn().mockReturnValue(of(treatment)),
      update: vi.fn().mockReturnValue(of(treatment)),
    };
    toast = { success: vi.fn(), error: vi.fn() };
  });

  it('starts in add mode with an invalid form', async () => {
    await create();
    expect(component.isEditMode).toBe(false);
    expect(component.treatmentId).toBeNull();
    expect(component.form.valid).toBe(false);
    expect(treatmentService.loadById).not.toHaveBeenCalled();
  });

  it('offers every treatment category', async () => {
    await create();
    expect(component.categories).toEqual(Object.values(TreatmentCategory));
  });

  it('requires code, name and category, and leaves description optional', async () => {
    await create();
    component.form.patchValue(validValues);
    expect(component.form.valid).toBe(true);
    component.form.patchValue({ code: '' });
    expect(component.form.valid).toBe(false);
  });

  it('rejects a negative default price', async () => {
    await create();
    component.form.patchValue({ ...validValues, defaultPrice: -1 });
    expect(component.form.valid).toBe(false);
  });

  it('does not submit an invalid form, and marks it touched instead', async () => {
    await create();
    component.onSubmit();
    expect(treatmentService.create).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('creates a treatment and returns to the list', async () => {
    await create();
    component.form.patchValue(validValues);
    component.onSubmit();

    expect(treatmentService.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'T01' }));
    expect(toast.success).toHaveBeenCalledWith('toast.treatmentCreated');
    expect(navigate).toHaveBeenCalledWith(['/treatments']);
  });

  it('loads the treatment in edit mode and updates rather than creates', async () => {
    routeId = 't-1';
    await create();

    expect(component.isEditMode).toBe(true);
    expect(treatmentService.loadById).toHaveBeenCalledWith('t-1');
    expect(component.form.value.name).toBe('Plombiranje');

    component.onSubmit();
    expect(treatmentService.update).toHaveBeenCalledWith('t-1', expect.objectContaining({ code: 'T01' }));
    expect(treatmentService.create).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('toast.treatmentUpdated');
  });

  it('returns to the list when the treatment cannot be loaded', async () => {
    routeId = 'missing';
    treatmentService.loadById.mockReturnValue(throwError(() => new Error('404')));
    await create();

    expect(navigate).toHaveBeenCalledWith(['/treatments']);
  });

  it('toasts the error and stays put when the write fails', async () => {
    await create();
    treatmentService.create.mockReturnValue(throwError(() => ({ detail: 'duplicate code' })));
    component.form.patchValue(validValues);
    component.onSubmit();

    expect(toast.error).toHaveBeenCalledWith({ detail: 'duplicate code' });
    expect(navigate).not.toHaveBeenCalled();
  });
});
