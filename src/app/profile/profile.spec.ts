import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import Profile from './profile';
import { TranslateService } from '../services/translate.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { Specialization, UserRole } from '../models/user.model';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.Doctor,
  phone: '+1234567890',
  specialization: Specialization.GeneralDentistry,
  licenseNumber: 'LIC-123',
  isActive: true,
  mustSetPassword: false,
  permissions: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let authService: {
    changePassword: ReturnType<typeof vi.fn>;
    loadCurrentUser: ReturnType<typeof vi.fn>;
    user: ReturnType<typeof signal>;
  };
  let userService: { update: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      changePassword: vi.fn().mockReturnValue(of(undefined)),
      loadCurrentUser: vi.fn().mockReturnValue(of(mockUser)),
      user: signal(mockUser),
    };
    userService = { update: vi.fn().mockReturnValue(of(mockUser)) };
    toastService = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Profile],
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
        { provide: UserService, useValue: userService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Personal info form ──────────────────────────────────────────────────────

  it('infoForm is pre-populated from the current user', () => {
    expect(component.infoForm.value.firstName).toBe('John');
    expect(component.infoForm.value.lastName).toBe('Doe');
    expect(component.infoForm.value.phone).toBe('+1234567890');
  });

  it('infoForm is invalid when firstName is empty', () => {
    component.infoForm.patchValue({ firstName: '' });
    expect(component.infoForm.invalid).toBe(true);
  });

  it('infoForm is valid when required fields are filled', () => {
    component.infoForm.patchValue({ firstName: 'Jane', lastName: 'Smith' });
    expect(component.infoForm.valid).toBe(true);
  });

  it('submitPersonalInfo marks all controls as touched when form is invalid', () => {
    component.infoForm.patchValue({ firstName: '' });
    component.submitPersonalInfo();
    expect(component.firstName.touched).toBe(true);
  });

  it('submitPersonalInfo does not call userService when form is invalid', () => {
    component.infoForm.patchValue({ firstName: '' });
    component.submitPersonalInfo();
    expect(userService.update).not.toHaveBeenCalled();
  });

  it('submitPersonalInfo calls userService.update with form values', () => {
    component.infoForm.patchValue({ firstName: 'Jane', lastName: 'Smith', phone: '+987' });
    component.submitPersonalInfo();
    expect(userService.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ firstName: 'Jane', lastName: 'Smith', phone: '+987' }),
    );
  });

  it('submitPersonalInfo shows success toast and reloads user on success', () => {
    component.submitPersonalInfo();
    expect(toastService.success).toHaveBeenCalledWith('profile.updateInfoSuccess');
    expect(component.infoLoading()).toBe(false);
    expect(authService.loadCurrentUser).toHaveBeenCalled();
  });

  it('submitPersonalInfo shows error toast on failure', () => {
    const err = new Error('fail');
    userService.update.mockReturnValue(throwError(() => err));
    component.submitPersonalInfo();
    expect(toastService.error).toHaveBeenCalledWith(err);
    expect(component.infoLoading()).toBe(false);
  });

  // ── Password form ───────────────────────────────────────────────────────────

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

  it('submitPasswordChange marks all controls as touched when form is invalid', () => {
    component.submitPasswordChange();
    expect(component.passwordForm.get('currentPassword')?.touched).toBe(true);
  });

  it('submitPasswordChange does not call authService when form is invalid', () => {
    component.submitPasswordChange();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('submitPasswordChange calls authService.changePassword with form values', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(authService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old',
      newPassword: 'newPass1',
      confirmPassword: 'newPass1',
    });
  });

  it('submitPasswordChange shows success toast and resets form on success', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(toastService.success).toHaveBeenCalledWith('profile.changePasswordSuccess');
    expect(component.pwLoading()).toBe(false);
    expect(component.passwordForm.pristine).toBe(true);
    expect(component.passwordForm.value).toEqual({ currentPassword: '', newPassword: '', confirmPassword: '' });
  });

  it('submitPasswordChange shows error toast on failure', () => {
    const err = new Error('fail');
    authService.changePassword.mockReturnValue(throwError(() => err));
    component.passwordForm.setValue({ currentPassword: 'wrong', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(toastService.error).toHaveBeenCalledWith(err);
    expect(component.pwLoading()).toBe(false);
  });
});
