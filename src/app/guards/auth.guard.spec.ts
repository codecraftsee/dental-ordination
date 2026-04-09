import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, firstValueFrom, isObservable } from 'rxjs';
import { vi } from 'vitest';
import { authGuard, loginGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { User, UserRole } from '../models/user.model';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('authGuard', () => {
  let router: Router;

  const setup = (isAuthenticated: boolean, accessToken: string | null = null, loadUserResult: User | null = null) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(isAuthenticated),
            getAccessToken: vi.fn().mockReturnValue(accessToken),
            loadCurrentUser: vi.fn().mockReturnValue(of(loadUserResult)),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
  };

  it('returns true when user is already authenticated', () => {
    setup(true);
    const authService = TestBed.inject(AuthService);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
    expect(authService.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('restores session and returns true when token exists and user loads', async () => {
    const mockUser: User = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: UserRole.Admin } as User;
    setup(false, 'valid-token', mockUser);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(isObservable(result)).toBe(true);
    const resolved = await firstValueFrom(result as ReturnType<typeof of>);
    expect(resolved).toBe(true);
  });

  it('redirects to /login when token exists but user load returns null', async () => {
    setup(false, 'expired-token', null);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(isObservable(result)).toBe(true);
    const resolved = await firstValueFrom(result as ReturnType<typeof of>);
    expect(resolved).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resolved as UrlTree)).toBe('/login');
  });

  it('redirects to /login when no token exists', () => {
    setup(false, null);
    const authService = TestBed.inject(AuthService);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    expect(authService.loadCurrentUser).not.toHaveBeenCalled();
  });
});

describe('loginGuard', () => {
  let router: Router;

  const setup = (isAuthenticated: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: signal(isAuthenticated) } },
      ],
    });
    router = TestBed.inject(Router);
  };

  it('returns true when user is not authenticated', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('redirects to / when user is already authenticated', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => loginGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
