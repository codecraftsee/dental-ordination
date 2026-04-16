import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import SetPassword from './set-password';
import { AuthService } from '../services/auth.service';
import { TranslateService } from '../services/translate.service';

describe('SetPassword', () => {
  let component: SetPassword;
  let fixture: ComponentFixture<SetPassword>;
  let authService: { setPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { setPassword: vi.fn().mockReturnValue(of({ accessToken: 'a', refreshToken: 'r', tokenType: 'bearer' })) };

    await TestBed.configureTestingModule({
      imports: [SetPassword],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => k === 'token' ? 'test-token' : null } } } },
        { provide: AuthService, useValue: authService },
        { provide: TranslateService, useValue: { instant: (k: string) => k, translate: (k: string) => k, get: (k: string) => of(k), currentLang: signal('en'), version: signal('en') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(authService.setPassword).not.toHaveBeenCalled();
  });

  it('should set error on API failure', () => {
    authService.setPassword.mockReturnValue(throwError(() => new Error('bad token')));
    component.form.setValue({ password: 'Test123#', passwordConfirm: 'Test123#' });
    component.onSubmit();
    expect(component.error()).toBe('setPassword.error');
  });
});
