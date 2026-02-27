import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, loginGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('authGuard', () => {
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

  it('returns true when user is authenticated', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('redirects to /login when user is not authenticated', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
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
