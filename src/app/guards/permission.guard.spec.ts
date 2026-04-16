import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { permissionGuard } from './permission.guard';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/user.model';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('permissionGuard', () => {
  let router: Router;

  const setup = (hasPermission: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasPermission: vi.fn().mockReturnValue(hasPermission),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
  };

  it('returns true when user has required permissions', () => {
    setup(true);
    const guard = permissionGuard([Permission.PatientsRead]);
    const result = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('redirects to / with forbidden param when user lacks permissions', () => {
    setup(false);
    const guard = permissionGuard([Permission.AdminBulkDelete]);
    const result = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/?forbidden=true');
  });

  it('passes all required permissions to hasPermission', () => {
    setup(true);
    const authService = TestBed.inject(AuthService);
    const guard = permissionGuard([Permission.PatientsRead, Permission.PatientsCreate]);
    TestBed.runInInjectionContext(() => guard(mockRoute, mockState));
    expect(authService.hasPermission).toHaveBeenCalledWith(Permission.PatientsRead, Permission.PatientsCreate);
  });
});
