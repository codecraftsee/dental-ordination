import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import StaffDetail from './staff-detail';
import { UserService } from '../../services/user.service';
import { VisitService } from '../../services/visit.service';
import { PatientService } from '../../services/patient.service';
import { DiagnosisService } from '../../services/diagnosis.service';
import { TreatmentService } from '../../services/treatment.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { TranslateService } from '../../services/translate.service';
import { UserRole, Specialization } from '../../models/user.model';

const mockUser = {
  id: '1',
  email: 'doctor@test.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.Doctor,
  isActive: true,
  mustSetPassword: false,
  specialization: Specialization.GeneralDentistry,
  permissions: [],
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
};

describe('StaffDetail', () => {
  let component: StaffDetail;
  let fixture: ComponentFixture<StaffDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: UserService, useValue: { loadById: vi.fn().mockReturnValue(of(mockUser)), resendInvite: vi.fn().mockReturnValue(of(null)), delete: vi.fn().mockReturnValue(of(null)) } },
        { provide: VisitService, useValue: { loadAll: vi.fn().mockReturnValue(of([])), getByDoctorId: vi.fn().mockReturnValue([]) } },
        { provide: PatientService, useValue: { loadAll: vi.fn().mockReturnValue(of([])), getById: vi.fn().mockReturnValue(null) } },
        { provide: DiagnosisService, useValue: { loadAll: vi.fn().mockReturnValue(of([])), getById: vi.fn().mockReturnValue(null) } },
        { provide: TreatmentService, useValue: { loadAll: vi.fn().mockReturnValue(of([])), getById: vi.fn().mockReturnValue(null) } },
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn().mockReturnValue(of(false)) } },
        { provide: AuthService, useValue: { hasPermission: () => true, hasAnyPermission: () => true, userPermissions: signal([]) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: TranslateService, useValue: { instant: (k: string) => k, translate: (k: string) => k, get: (k: string) => of(k), currentLang: signal('en'), version: signal('en') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct initials', () => {
    expect(component.getInitials(mockUser)).toBe('JD');
  });

  it('should prefix Dr. for doctors', () => {
    expect(component.getDisplayName(mockUser)).toBe('Dr. John Doe');
  });

  it('should not prefix Dr. for nurses', () => {
    const nurse = { ...mockUser, role: UserRole.Nurse };
    expect(component.getDisplayName(nurse)).toBe('John Doe');
  });
});
