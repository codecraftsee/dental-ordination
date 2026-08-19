import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import Login from './login';
import { TranslateService } from '../services/translate.service';
import { AuthService } from '../services/auth.service';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let login: ReturnType<typeof vi.fn>;
  let loadCurrentUser: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn<(commands: unknown[]) => void>>;

  beforeEach(async () => {
    login = vi.fn().mockReturnValue(of({ accessToken: 'a', refreshToken: 'r' }));
    loadCurrentUser = vi.fn().mockReturnValue(of({ id: 'u-1' }));

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
        { provide: AuthService, useValue: { login, loadCurrentUser } },
      ],
    }).compileComponents();

    navigate = vi.fn<(commands: unknown[]) => void>();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(commands => {
      navigate(commands as unknown[]);
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with an empty, invalid form and no error', () => {
    expect(component.form.valid).toBe(false);
    expect(component.error()).toBe('');
    expect(component.loading()).toBe(false);
  });

  it('requires a well-formed email and a password', () => {
    component.form.setValue({ email: 'nope', password: 'secret123' });
    expect(component.form.valid).toBe(false);

    component.form.setValue({ email: 'a@b.com', password: '' });
    expect(component.form.valid).toBe(false);

    component.form.setValue({ email: 'a@b.com', password: 'secret123' });
    expect(component.form.valid).toBe(true);
  });

  it('does not submit an invalid form, and marks it touched instead', () => {
    component.onSubmit();
    expect(login).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('logs in, loads the current user, then lands on the dashboard', () => {
    component.form.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();

    expect(login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123' });
    expect(loadCurrentUser).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(component.loading()).toBe(false);
  });

  it('reports bad credentials without navigating', () => {
    login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ email: 'a@b.com', password: 'wrong' });
    component.onSubmit();

    expect(component.error()).toBe('login.error');
    expect(component.loading()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('reports the same error when loading the user fails after a good login', () => {
    loadCurrentUser.mockReturnValue(throwError(() => ({ status: 500 })));
    component.form.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();

    expect(component.error()).toBe('login.error');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clears a previous error when resubmitting', () => {
    login.mockReturnValueOnce(throwError(() => ({ status: 401 })));
    component.form.setValue({ email: 'a@b.com', password: 'wrong' });
    component.onSubmit();
    expect(component.error()).toBe('login.error');

    component.form.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();

    expect(component.error()).toBe('');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
