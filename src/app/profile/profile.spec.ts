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

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let authService: { changePassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { changePassword: vi.fn().mockReturnValue(of(undefined)) };

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

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

  it('submitPasswordChange sets success message and resets form on success', () => {
    component.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(component.pwMessage()).toBe('profile.changePasswordSuccess');
    expect(component.pwIsError()).toBe(false);
    expect(component.pwLoading()).toBe(false);
    expect(component.passwordForm.pristine).toBe(true);
    expect(component.passwordForm.value).toEqual({ currentPassword: '', newPassword: '', confirmPassword: '' });
  });

  it('submitPasswordChange sets error message on failure', () => {
    authService.changePassword.mockReturnValue(throwError(() => new Error('fail')));
    component.passwordForm.setValue({ currentPassword: 'wrong', newPassword: 'newPass1', confirmPassword: 'newPass1' });
    component.submitPasswordChange();
    expect(component.pwMessage()).toBe('profile.changePasswordError');
    expect(component.pwIsError()).toBe(true);
    expect(component.pwLoading()).toBe(false);
  });
});
