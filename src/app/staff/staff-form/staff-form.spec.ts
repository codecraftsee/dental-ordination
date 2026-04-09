import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import StaffForm from './staff-form';
import { UserService } from '../../services/user.service';
import { UserRole } from '../../models/user.model';
import { TranslateService } from '../../services/translate.service';

describe('StaffForm', () => {
  let component: StaffForm;
  let fixture: ComponentFixture<StaffForm>;
  let userService: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; loadById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = {
      create: vi.fn().mockReturnValue(of({ id: '1' })),
      update: vi.fn().mockReturnValue(of({ id: '1' })),
      loadById: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [StaffForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: UserService, useValue: userService },
        { provide: TranslateService, useValue: { instant: (k: string) => k, get: (k: string) => of(k), currentLang: signal('en') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be in create mode by default', () => {
    expect(component.isEditMode).toBe(false);
  });

  it('should require specialization when role is doctor', () => {
    component.form.get('role')!.setValue(UserRole.Doctor);
    component.form.get('specialization')!.setValue(null);
    expect(component.form.get('specialization')!.valid).toBe(false);
  });

  it('should not require specialization for nurse', () => {
    component.form.get('role')!.setValue(UserRole.Nurse);
    expect(component.form.get('specialization')!.valid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(userService.create).not.toHaveBeenCalled();
  });
});
